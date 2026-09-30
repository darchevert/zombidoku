import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Board } from '../components/Board';
import { TopBar } from '../components/TopBar';
import { RuleCards } from '../components/RuleCard';
import { ProgressBadges } from '../components/ProgressBadges';
import { PowerButton } from '../components/PowerButton';
import { PressableScale } from '../components/PressableScale';
import { WinModal } from '../components/WinModal';
import { LoseModal } from '../components/LoseModal';
import { Celebration, type CelebrationTrigger } from '../components/Celebration';
import { generatePuzzle } from '../engine/generator';
import { findConflicts, isSolved } from '../engine/solver';
import { findDeductions, type Deduction } from '../engine/deduction';
import type { CellState, Puzzle } from '../engine/types';
import { levelToSize, scoreForCompletion } from '../utils/levelConfig';
import { DAILY_CHALLENGE_BRAIN_REWARD, DAILY_CHALLENGE_SIZE, generateDailyPuzzle } from '../utils/dailyChallenge';
import { playSound } from '../utils/sounds';
import { showRewardedAd } from '../utils/ads';
import { useGameStore } from '../state/store';
import { colors } from '../theme/colors';
import { MAX_CONTENT_WIDTH } from '../theme/layout';
import { useT } from '../i18n';
import { LockableScrollView, type LockableScrollViewHandle } from '../components/LockableScrollView';
import type { WinStats } from '../components/WinModal';
import { playMusicForLevel, resetMusicChoice, stopMusic } from '../utils/music';

// Rewarded ads need a native SDK (see utils/ads.ts) that can't run in a
// browser tab — hidden on web rather than offering a button that could
// never show a real ad there once the mock is swapped for the real one.
const ADS_SUPPORTED = Platform.OS !== 'web';

const BRAIN_REWARD = 3;
// How long the bat lingers on a cell before it swoops off and leaves the
// ✕ behind — see handleMouse. Kept in step with CritterPop's own timing
// in Cell.tsx (spring + 220ms hold + 140ms fade ≈ 450ms) so the mark
// lands right as the bat disappears rather than popping in early/late.
const CRITTER_POP_MS = 450;
const CRITTER_GAP_MS = 150;
const MAX_LIVES = 3;
const DOUBLE_TAP_MS = 300;
const CELEBRATION_COUNT = 6;

function emptyGrid(size: number): CellState[][] {
  return Array.from({ length: size }, () => new Array<CellState>(size).fill('empty'));
}

interface GameScreenProps {
  onBack: () => void;
  onSettings: () => void;
  /** Plays the single shared daily puzzle instead of the level ladder:
   * fixed size, deterministic per-date board, one completion per day, no
   * "next level" progression. */
  daily?: boolean;
}

export function GameScreen({ onBack, onSettings, daily = false }: GameScreenProps) {
  const level = useGameStore((s) => s.level);
  const score = useGameStore((s) => s.score);
  const hints = useGameStore((s) => s.hints);
  const autoCats = useGameStore((s) => s.autoCats);
  const mice = useGameStore((s) => s.mice);
  const completeLevel = useGameStore((s) => s.completeLevel);
  const completeDailyChallenge = useGameStore((s) => s.completeDailyChallenge);
  const useHintCharge = useGameStore((s) => s.useHint);
  const useAutoCatCharge = useGameStore((s) => s.useAutoCat);
  const useMouseCharge = useGameStore((s) => s.useMouse);
  const buyHint = useGameStore((s) => s.buyHint);
  const buyAutoCat = useGameStore((s) => s.buyAutoCat);
  const buyMouse = useGameStore((s) => s.buyMouse);
  const hapticsEnabled = useGameStore((s) => s.hapticsEnabled);
  // A volume of 0 is "off": the settings have no separate on/off switches.
  const soundEnabled = useGameStore((s) => s.sfxVolume > 0);
  const zenModeEnabled = useGameStore((s) => s.zenModeEnabled);
  const timerModeEnabled = useGameStore((s) => s.timerModeEnabled);
  const recordBestTime = useGameStore((s) => s.recordBestTime);
  const grantHint = useGameStore((s) => s.grantHint);
  const grantAutoCat = useGameStore((s) => s.grantAutoCat);
  const grantMouse = useGameStore((s) => s.grantMouse);

  // The daily challenge always keeps its real stakes — zen mode is a
  // level-play comfort setting, not something that should water down the
  // one shared, one-shot puzzle of the day.
  const zenActive = zenModeEnabled && !daily;

  // The puzzle on screen tracks its own level rather than the store's
  // (which advances the instant a level is completed): otherwise the win
  // modal would find its level already stale and a fresh board already
  // generated underneath it before the player ever sees "Niveau suivant".
  const [activeLevel, setActiveLevel] = useState(level);
  // Bumped on retry so a fresh puzzle regenerates for the *same* level.
  // In daily mode this still fires on retry, but the puzzle it generates
  // is deterministic from the date, so it comes back identical anyway.
  const [attempt, setAttempt] = useState(0);
  const size = daily ? DAILY_CHALLENGE_SIZE : levelToSize(activeLevel);
  // Captured once on mount rather than derived from the live store value,
  // so completing the daily challenge this session doesn't retroactively
  // hide the board the player is mid-game on.
  const [alreadyDoneToday] = useState(
    () => daily && useGameStore.getState().hasCompletedDailyToday()
  );
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [grid, setGrid] = useState<CellState[][]>([]);
  const t = useT();
  const musicOn = useGameStore((s) => s.musicVolume > 0);
  const [loading, setLoading] = useState(true);

  // One random track per level, kept for the whole level (retries and
  // music on/off included); leaving the game screen forgets it.
  useEffect(() => {
    playMusicForLevel(activeLevel);
    return stopMusic;
  }, [activeLevel, musicOn]);
  useEffect(() => resetMusicChoice, []);
  // Freezing the page scroll while a finger paints the board; see
  // LockableScrollView for why this doesn't re-render the screen.
  const scrollRef = useRef<LockableScrollViewHandle>(null);
  const setScrollLocked = (locked: boolean) => scrollRef.current?.lock(locked);
  // The hint overlay: `hintActive` drives the dimmed-screen effect,
  // `hintDeduction` holds what to highlight and what "Appliquer" will
  // commit. Kept open until the player applies or dismisses it — no
  // auto-timeout, since revealing a real deduction isn't something to
  // rush past the way a solution-peek hint used to be.
  const [hintActive, setHintActive] = useState(false);
  const [hintDeduction, setHintDeduction] = useState<Deduction | null>(null);
  // The cell the mouse bonus's bat is currently swooping onto.
  const [critterCell, setCritterCell] = useState<{ row: number; col: number } | null>(null);
  const [won, setWon] = useState(false);
  const [lives, setLives] = useState(MAX_LIVES);
  const [lost, setLost] = useState(false);
  const [lastReward, setLastReward] = useState({ score: 0, brains: 0 });
  const [hintsUsed, setHintsUsed] = useState(0);
  const [autoCatsUsed, setAutoCatsUsed] = useState(0);
  // Feed the "you beat X% of your earlier games" popup stat.
  const [mistakes, setMistakes] = useState(0);
  const [batsUsed, setBatsUsed] = useState(0);
  const startedAtRef = useRef(Date.now());
  const [winStats, setWinStats] = useState<WinStats | undefined>(undefined);
  const recordPerformance = useGameStore((s) => s.recordPerformance);

  const lastTapRef = useRef<{ row: number; col: number; time: number } | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const celebrationIdRef = useRef(0);
  const [celebration, setCelebration] = useState<CelebrationTrigger | null>(null);

  // Undo: one history entry per user gesture (not per cell touched
  // mid-drag), so undoing a whole drag stroke — or a wrong double-tap
  // guess, lives included — is a single step. A ref avoids re-rendering
  // on every push; `canUndo` mirrors "is it non-empty" for the button.
  const historyRef = useRef<Array<{ grid: CellState[][]; lives: number }>>([]);
  const [canUndo, setCanUndo] = useState(false);

  const [elapsedSec, setElapsedSec] = useState(0);
  const [lastElapsedSec, setLastElapsedSec] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  function playIfEnabled(key: Parameters<typeof playSound>[0]) {
    if (soundEnabled) playSound(key);
  }

  function triggerCelebration() {
    celebrationIdRef.current += 1;
    const word = t(`celebration.${1 + Math.floor(Math.random() * CELEBRATION_COUNT)}`);
    setCelebration({ id: celebrationIdRef.current, word });
  }

  /** A quick horizontal wobble plus a haptic buzz — the physical "no"
   * feedback for a wrong guess, on top of the red locked cross itself. */
  function triggerWrongFeedback() {
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  }

  useEffect(() => {
    if (alreadyDoneToday) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setWon(false);
    setLost(false);
    setLives(MAX_LIVES);
    setHintActive(false);
    setHintDeduction(null);
    setCritterCell(null);
    setHintsUsed(0);
    setAutoCatsUsed(0);
    setMistakes(0);
    setBatsUsed(0);
    startedAtRef.current = Date.now();
    lastTapRef.current = null;
    historyRef.current = [];
    setCanUndo(false);
    setElapsedSec(0);
    setIsNewRecord(false);
    const timer = setTimeout(() => {
      const p = daily ? generateDailyPuzzle() : generatePuzzle(size);
      setPuzzle(p);
      setGrid(emptyGrid(size));
      setLoading(false);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLevel, attempt]);

  useEffect(() => {
    if (!timerModeEnabled || loading || !puzzle || won || lost) return;
    const interval = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [timerModeEnabled, loading, puzzle, won, lost]);

  const zombies = useMemo(() => {
    const list: Array<{ row: number; col: number }> = [];
    grid.forEach((row, r) =>
      row.forEach((cellState, c) => {
        if (cellState === 'zombie') list.push({ row: r, col: c });
      })
    );
    return list;
  }, [grid]);

  const conflictKeys = useMemo(() => {
    if (!puzzle) return new Set<string>();
    const conflicts = findConflicts(puzzle.size, puzzle.regions, zombies);
    return new Set(conflicts.map((c) => `${c.row},${c.col}`));
  }, [puzzle, zombies]);

  useEffect(() => {
    if (!puzzle || won || lost) return;
    if (isSolved(puzzle.size, puzzle.regions, zombies)) {
      const scoreEarned = scoreForCompletion(puzzle.size, hintsUsed, autoCatsUsed);
      const brainsEarned = daily ? DAILY_CHALLENGE_BRAIN_REWARD : BRAIN_REWARD;
      if (daily) {
        completeDailyChallenge({ scoreEarned, brainsEarned });
      } else {
        completeLevel({ scoreEarned, brainsEarned });
      }
      setLastReward({ score: scoreEarned, brains: brainsEarned });
      {
        const seconds = Math.min(600, Math.round((Date.now() - startedAtRef.current) / 1000));
        const bonuses = hintsUsed + autoCatsUsed + batsUsed;
        const { percent, sample } = recordPerformance(puzzle.size, mistakes * 45 + bonuses * 30 + seconds);
        setWinStats({ percent, sample, size: puzzle.size, mistakes, bonuses });
      }
      if (timerModeEnabled) {
        setLastElapsedSec(elapsedSec);
        setIsNewRecord(recordBestTime(puzzle.size, elapsedSec));
      }
      setWon(true);
      playIfEnabled('win');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zombies, puzzle, lost]);

  function setCell(row: number, col: number, state: CellState) {
    setGrid((prev) => {
      const next = prev.map((r) => r.slice());
      next[row][col] = state;
      return next;
    });
  }

  /** Snapshots grid+lives just before a mutating gesture, so `handleUndo`
   * can restore both together — undoing a wrong guess should give the
   * life back too, not just erase the red mark. Call once per gesture,
   * right before the mutation it's about to make. */
  function pushHistory() {
    historyRef.current.push({ grid: grid.map((r) => r.slice()), lives });
    setCanUndo(true);
  }

  function handleUndo() {
    const entry = historyRef.current.pop();
    if (!entry) return;
    setCanUndo(historyRef.current.length > 0);
    setGrid(entry.grid);
    setLives(entry.lives);
    setLost(false);
  }

  /** Sets a cell to the paint gesture's target state (see
   * gestureModeRef below) — a no-op if the cell is already there, locked
   * in as 'zombie'/'wrong', or out of bounds. Idempotent, so repeatedly
   * re-entering the same cell mid-drag is harmless. */
  function paintCell(row: number, col: number, target: 'x' | 'empty') {
    setGrid((prev) => {
      const current = prev[row]?.[col];
      if (current === undefined || current === 'zombie' || current === 'wrong') return prev;
      if (current === target) return prev;
      const next = prev.map((r) => r.slice());
      next[row][col] = target;
      return next;
    });
  }

  /** Double-tapping a cell commits to placing a zombie there. If it's
   * actually correct the zombie is placed; if not, the guess costs a life
   * and the cell is permanently marked "wrong" (red, locked) — a cell
   * already marked that way can't be re-guessed or lose another life.
   * In zen mode (regular levels only, never the daily challenge) a wrong
   * guess still gets marked and still gives feedback, it just doesn't
   * cost a life or end the level. */
  function handleDoubleTap(row: number, col: number) {
    if (!puzzle) return;
    if (grid[row][col] === 'zombie' || grid[row][col] === 'wrong') return;
    pushHistory();

    if (col === puzzle.solution[row]) {
      setCell(row, col, 'zombie');
      playIfEnabled('correct');
      triggerCelebration();
      return;
    }

    setCell(row, col, 'wrong');
    setMistakes((n) => n + 1);
    triggerWrongFeedback();
    playIfEnabled('wrong');
    if (zenActive) return;
    setLives((n) => {
      const next = n - 1;
      if (next <= 0) {
        setLost(true);
        playIfEnabled('lose');
      }
      return next;
    });
  }

  /** Whether the in-progress press-and-drag paints X marks on ('add') or
   * clears them from ('remove') every cell it passes over, decided once
   * from the *first* cell touched — 'x' cells stay 'x' while dragging
   * over an add-gesture, and vice versa. Null means this gesture does
   * nothing (it started on a locked cell, or was consumed as a
   * double-tap). */
  const gestureModeRef = useRef<'add' | 'remove' | null>(null);

  function handleGestureStart(row: number, col: number) {
    // Freeze the page scroll for the whole press: otherwise a vertical
    // drag over the board scrolls the ScrollView instead of painting.
    setScrollLocked(true);
    // The board is dimmed and inert while the hint overlay is open — the
    // player is meant to read it and tap Appliquer/Fermer, not keep
    // playing underneath it.
    if (won || lost || hintActive) return;

    const now = Date.now();
    const last = lastTapRef.current;
    const isDoubleTap =
      !!last && last.row === row && last.col === col && now - last.time < DOUBLE_TAP_MS;
    lastTapRef.current = { row, col, time: now };

    if (isDoubleTap) {
      lastTapRef.current = null;
      gestureModeRef.current = null;
      handleDoubleTap(row, col);
      return;
    }

    const current = grid[row]?.[col];
    if (current === undefined || current === 'zombie' || current === 'wrong') {
      gestureModeRef.current = null;
      return;
    }
    const mode = current === 'empty' ? 'add' : 'remove';
    gestureModeRef.current = mode;
    pushHistory();
    paintCell(row, col, mode === 'add' ? 'x' : 'empty');
    if (mode === 'add') playIfEnabled('mark');
  }

  function handleGestureMove(row: number, col: number) {
    const mode = gestureModeRef.current;
    if (!mode) return;
    if (mode === 'add' && grid[row]?.[col] === 'empty') playIfEnabled('mark');
    paintCell(row, col, mode === 'add' ? 'x' : 'empty');
  }

  function handleGestureEnd() {
    gestureModeRef.current = null;
    setScrollLocked(false);
  }

  function firstUnsolvedRow(): number | null {
    if (!puzzle) return null;
    for (let r = 0; r < puzzle.size; r++) {
      if (grid[r]?.[puzzle.solution[r]] !== 'zombie') return r;
    }
    return null;
  }

  /** Opens the hint overlay: darkens the board except cells the player
   * could genuinely have deduced themselves (see engine/deduction.ts) —
   * never a peek at the hidden solution. "Appliquer" (below) commits
   * those deductions; this only computes and displays them. */
  function handleHint() {
    if (!puzzle || won || lost || hintActive) return;
    if (!useHintCharge() && !buyHint()) {
      Alert.alert(t('game.noBrainsTitle'), t('game.noBrainsBody'));
      return;
    }
    setHintsUsed((n) => n + 1);
    const deduction = findDeductions(puzzle, grid);
    if (deduction.xCells.length === 0 && !deduction.zombieCell) {
      // Nothing is obviously deducible from the board right now — rather
      // than let the hint do nothing, fall back to the old reveal-a-cell
      // behavior so the charge the player just spent isn't wasted.
      const row = firstUnsolvedRow();
      if (row === null) return;
      setHintDeduction({ xCells: [], zombieCell: { row, col: puzzle.solution[row] } });
    } else {
      setHintDeduction(deduction);
    }
    setHintActive(true);
    playIfEnabled('hint');
  }

  /** Commits everything the open hint overlay is highlighting — the ✕'s
   * and the forced zombie cell, if any — in one undo-able step. */
  function applyHint() {
    if (!hintDeduction) return;
    pushHistory();
    setGrid((prev) => {
      const next = prev.map((r) => r.slice());
      hintDeduction.xCells.forEach(({ row, col }) => {
        if (next[row][col] === 'empty') next[row][col] = 'x';
      });
      if (hintDeduction.zombieCell) {
        const { row, col } = hintDeduction.zombieCell;
        next[row][col] = 'zombie';
      }
      return next;
    });
    playIfEnabled('bonus');
    if (hintDeduction.zombieCell) {
      playIfEnabled('correct');
      triggerCelebration();
    }
    closeHint();
  }

  function closeHint() {
    setHintActive(false);
    setHintDeduction(null);
  }

  function handleAutoCat() {
    if (!puzzle || won || lost) return;
    const row = firstUnsolvedRow();
    if (row === null) return;
    if (!useAutoCatCharge() && !buyAutoCat()) {
      Alert.alert(t('game.noBrainsTitle'), t('game.noBrainsBody'));
      return;
    }
    setAutoCatsUsed((n) => n + 1);
    setCell(row, puzzle.solution[row], 'zombie');
    playIfEnabled('bonus');
    playIfEnabled('correct');
  }

  function sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  /** The bat bonus: marks 3 random cells ✕ that a player could have
   * marked themselves eventually (each is simply wrong for its row, not
   * some other deduced-safe cell) — a bat visibly swoops onto each one
   * and leaves the ✕ behind rather than the mark just appearing. */
  const [mouseBusy, setMouseBusy] = useState(false);

  async function handleMouse() {
    if (!puzzle || won || lost || mouseBusy) return;
    const candidates: Array<{ row: number; col: number }> = [];
    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.size; c++) {
        if (grid[r][c] === 'empty' && c !== puzzle.solution[r]) candidates.push({ row: r, col: c });
      }
    }
    if (candidates.length === 0) return;
    if (!useMouseCharge() && !buyMouse()) {
      Alert.alert(t('game.noBrainsTitle'), t('game.noBrainsBody'));
      return;
    }
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    const picks = candidates.slice(0, 3);

    setMouseBusy(true);
    setBatsUsed((n) => n + 1);
    pushHistory();
    for (const cell of picks) {
      setCritterCell(cell);
      playIfEnabled('swoosh');
      await sleep(CRITTER_POP_MS);
      setCell(cell.row, cell.col, 'x');
      playIfEnabled('bat');
      setCritterCell(null);
      await sleep(CRITTER_GAP_MS);
    }
    setMouseBusy(false);
  }

  const [adLoadingKey, setAdLoadingKey] = useState<'hint' | 'autoCat' | 'mouse' | null>(null);

  /** Watch a rewarded ad to both refill and immediately run one specific
   * bonus — each of the 3 power-ups gets its own ad prompt once it's out
   * of charges, rather than one shared "watch an ad" button. */
  async function handleWatchAdFor(kind: 'hint' | 'autoCat' | 'mouse') {
    if (adLoadingKey) return;
    setAdLoadingKey(kind);
    const rewarded = await showRewardedAd();
    setAdLoadingKey(null);
    if (!rewarded) return;
    if (kind === 'hint') {
      grantHint();
      handleHint();
    } else if (kind === 'autoCat') {
      grantAutoCat();
      handleAutoCat();
    } else {
      grantMouse();
      handleMouse();
    }
  }

  /** Shared badge/behavior for the 3 chargeable power buttons: a normal
   * red count while charges remain; once depleted, native swaps to a
   * green "▶" rewarded-ad prompt (tap refills *and* runs the bonus), web
   * (no ad SDK) keeps the old buy-with-brains/insufficient-funds path via
   * `onAction` itself. */
  function powerButtonProps(count: number, kind: 'hint' | 'autoCat' | 'mouse', onAction: () => void) {
    const showAdPrompt = count <= 0 && ADS_SUPPORTED;
    return {
      badge: showAdPrompt ? '▶' : count,
      badgeVariant: (showAdPrompt ? 'ad' : 'count') as 'ad' | 'count',
      onPress: showAdPrompt ? () => handleWatchAdFor(kind) : onAction,
      disabled: hintActive || adLoadingKey === kind || (kind === 'mouse' && mouseBusy),
    };
  }

  const shakeTranslate = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-8, 8],
  });

  if (alreadyDoneToday) {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.inner}>
            <TopBar titleLabel={t('game.alert')} titleValue={t('game.zombie')} score={score} onBack={onBack} onSettings={onSettings} />
            <View style={styles.doneCard}>
              <Text style={styles.doneEmoji}>🧟✅</Text>
              <Text style={styles.doneTitle}>{t('game.dailyDoneTitle')}</Text>
              <Text style={styles.doneSubtitle}>{t('game.dailyDoneBody')}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.shakeArea, { transform: [{ translateX: shakeTranslate }] }]}>
        <LockableScrollView ref={scrollRef} contentContainerStyle={styles.content}>
          <View style={styles.inner}>
            <View style={[styles.chromeGroup, hintActive && styles.dimmedChrome]}>
              <TopBar
                titleLabel={daily ? t('game.alert') : t('common.level')}
                titleValue={daily ? t('game.zombie') : String(activeLevel)}
                score={score}
                onBack={onBack}
                onSettings={onSettings}
              />

              <ProgressBadges
                zombiesPlaced={zombies.length}
                zombiesTotal={size}
                lives={lives}
                maxLives={MAX_LIVES}
                zen={zenActive}
              />

              {timerModeEnabled && (
                <Text style={styles.timer}>
                  ⏱ {Math.floor(elapsedSec / 60)}:{String(elapsedSec % 60).padStart(2, '0')}
                </Text>
              )}

              <RuleCards />
            </View>

            <View style={styles.boardArea}>
              <Celebration trigger={celebration} />
              {loading || !puzzle ? (
                <View style={styles.loading}>
                  <ActivityIndicator size="large" color={colors.accent} />
                </View>
              ) : (
                <Board
                  size={puzzle.size}
                  regions={puzzle.regions}
                  grid={grid}
                  conflictKeys={conflictKeys}
                  highlightXCells={hintDeduction?.xCells}
                  highlightZombieCell={hintDeduction?.zombieCell}
                  dimBoard={hintActive}
                  critterCell={critterCell}
                  onCellGestureStart={handleGestureStart}
                  onCellGestureMove={handleGestureMove}
                  onCellGestureEnd={handleGestureEnd}
                  revealKey={`${activeLevel}-${attempt}`}
                />
              )}
            </View>

            {hintActive && (
              <View style={styles.hintActionsRow}>
                <PressableScale style={styles.hintApplyButton} onPress={applyHint}>
                  <Text style={styles.hintApplyButtonText}>{t('common.apply')}</Text>
                </PressableScale>
                <PressableScale style={styles.hintCloseButton} onPress={closeHint}>
                  <Text style={styles.hintCloseButtonText}>{t('common.close')}</Text>
                </PressableScale>
              </View>
            )}

            <View style={[styles.powerRow, hintActive && styles.dimmedChrome]}>
              <PowerButton emoji="↩" onPress={handleUndo} disabled={!canUndo || hintActive} />
              <PowerButton emoji="🧟" {...powerButtonProps(autoCats, 'autoCat', handleAutoCat)} />
              <PowerButton emoji="💡" {...powerButtonProps(hints, 'hint', handleHint)} />
              <PowerButton emoji="🦇" {...powerButtonProps(mice, 'mouse', handleMouse)} />
            </View>
          </View>
        </LockableScrollView>
      </Animated.View>

      <WinModal
        visible={won}
        title={daily ? t('win.dailyTitle') : t('win.title', { n: activeLevel })}
        scoreEarned={lastReward.score}
        brainsEarned={lastReward.brains}
        primaryLabel={daily ? t('common.home') : t('win.next')}
        onPrimary={
          daily
            ? onBack
            : () => {
                setWon(false);
                setActiveLevel((l) => l + 1);
              }
        }
        secondaryLabel={daily ? undefined : t('common.home')}
        onSecondary={daily ? undefined : onBack}
        elapsedSeconds={timerModeEnabled ? lastElapsedSec : undefined}
        isNewRecord={isNewRecord}
        stats={winStats}
      />

      <LoseModal
        visible={lost}
        title={daily ? t('lose.dailyTitle') : t('lose.title', { n: activeLevel })}
        onRetry={() => {
          setLost(false);
          setAttempt((a) => a + 1);
        }}
        onHome={onBack}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  shakeArea: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    gap: 16,
  },
  chromeGroup: {
    gap: 16,
  },
  // The hint overlay's screen-dim: everything outside the board's own
  // per-cell highlighting fades out, drawing the eye to what's lit up.
  dimmedChrome: {
    opacity: 0.25,
  },
  hintActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  hintApplyButton: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  hintApplyButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  hintCloseButton: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  hintCloseButtonText: {
    color: colors.inkSoft,
    fontSize: 16,
    fontWeight: '700',
  },
  boardArea: {
    position: 'relative',
  },
  loading: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
  },
  timer: {
    alignSelf: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
  },
  doneCard: {
    marginTop: 48,
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 32,
  },
  doneEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  doneTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  doneSubtitle: {
    fontSize: 15,
    color: colors.inkSoft,
    textAlign: 'center',
  },
});
