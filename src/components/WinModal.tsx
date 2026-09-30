import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { colors } from '../theme/colors';
import { PressableScale } from './PressableScale';
import { useT } from '../i18n';

const confettiSource = require('../../assets/lottie/confetti.json');

/** How this win compares with the player's own earlier games on the same
 * grid size — never other players, there is no server to compare with. */
export interface WinStats {
  /** Share (0-100) of the player's previous games on this size that this
   * one beat, or null when there aren't enough previous games yet. */
  percent: number | null;
  /** How many previous games on this size the percentage is based on. */
  sample: number;
  size: number;
  mistakes: number;
  bonuses: number;
}

interface WinModalProps {
  visible: boolean;
  title: string;
  scoreEarned: number;
  brainsEarned: number;
  primaryLabel: string;
  onPrimary: () => void;
  /** Omit to show only the primary button (e.g. the daily challenge,
   * which has no "next level" to skip past). */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Only shown when timer mode is on. */
  elapsedSeconds?: number;
  isNewRecord?: boolean;
  stats?: WinStats;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** A number that counts up from 0 to `target` once `active` flips on. */
function useCountUp(target: number, active: boolean, delayMs: number, durationMs: number): number {
  const value = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = value.addListener(({ value: v }) => setShown(Math.round(v)));
    return () => value.removeListener(id);
  }, []);
  useEffect(() => {
    value.setValue(0);
    setShown(0);
    if (!active) return;
    const anim = Animated.timing(value, {
      toValue: target,
      duration: durationMs,
      delay: delayMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [active, target]);
  return shown;
}

const RAY_COUNT = 10;

export function WinModal({
  visible,
  title,
  scoreEarned,
  brainsEarned,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  elapsedSeconds,
  isNewRecord,
  stats,
}: WinModalProps) {
  const t = useT();
  const confettiRef = useRef<LottieView>(null);

  const cardScale = useRef(new Animated.Value(0.6)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const banner = useRef(new Animated.Value(0)).current;
  const chips = useRef([new Animated.Value(0), new Animated.Value(0)]).current;
  const stars = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const perf = useRef(new Animated.Value(0)).current;
  const buttons = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const word = useMemo(() => t(`celebration.${1 + Math.floor(Math.random() * 6)}`), [visible]);

  const flawless = !!stats && stats.mistakes === 0 && stats.bonuses === 0;
  const starCount = !stats ? 3 : flawless ? 3 : stats.mistakes + stats.bonuses <= 1 ? 2 : 1;

  const points = useCountUp(scoreEarned, visible, 650, 900);
  const percent = useCountUp(stats?.percent ?? 0, visible && stats?.percent != null, 1500, 1200);

  useEffect(() => {
    if (!visible) return;
    confettiRef.current?.play();
    [cardScale, cardOpacity, banner, perf, buttons].forEach((v) => v.setValue(0));
    cardScale.setValue(0.6);
    chips.forEach((v) => v.setValue(0));
    stars.forEach((v) => v.setValue(0));

    const pop = (v: Animated.Value, delay: number) =>
      Animated.spring(v, { toValue: 1, delay, useNativeDriver: true, speed: 12, bounciness: 14 });

    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }),
      pop(banner, 120),
      pop(chips[0], 450),
      pop(chips[1], 600),
      ...stars.slice(0, starCount).map((s, i) => pop(s, 800 + i * 220)),
      pop(perf, 1400),
      Animated.timing(buttons, { toValue: 1, duration: 350, delay: 1900, useNativeDriver: true }),
    ]).start();

    const loops = [
      Animated.loop(Animated.timing(spin, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true })),
      Animated.loop(
        Animated.sequence([
          Animated.timing(bob, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(bob, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
        ])
      ),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [visible]);

  const tierKey =
    !stats || stats.percent == null
      ? null
      : stats.percent >= 90
      ? 'win.tierLegend'
      : stats.percent >= 70
      ? 'win.tierGreat'
      : stats.percent >= 40
      ? 'win.tierGood'
      : 'win.tierKeep';

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.12] });
  const popStyle = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.confettiLayer} pointerEvents="none">
          <LottieView ref={confettiRef} source={confettiSource} loop={false} autoPlay={false} style={styles.confetti} />
        </View>

        <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
          <Animated.View
            style={[
              styles.bannerWrap,
              {
                opacity: banner,
                transform: [
                  { translateY: banner.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) },
                  { scale: banner.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
                ],
              },
            ]}
          >
            <Text style={styles.bannerText}>{word}</Text>
          </Animated.View>

          <View style={styles.hero}>
            <Animated.View style={[styles.rays, { transform: [{ rotate }] }]} pointerEvents="none">
              {Array.from({ length: RAY_COUNT }).map((_, i) => (
                <View key={i} style={[styles.ray, { transform: [{ rotate: `${(360 / RAY_COUNT) * i}deg` }] }]} />
              ))}
            </Animated.View>
            <Animated.View style={[styles.glow, { transform: [{ scale: glowScale }] }]} pointerEvents="none" />
            <Animated.Text style={[styles.heroEmoji, { transform: [{ translateY: bobY }] }]}>🧟</Animated.Text>
          </View>

          <Text style={styles.title}>{title}</Text>

          <View style={styles.starsRow}>
            {stars.map((s, i) => (
              <Animated.Text key={i} style={[styles.star, i >= starCount && styles.starOff, i < starCount && popStyle(s)]}>
                ★
              </Animated.Text>
            ))}
          </View>

          <View style={styles.chipsRow}>
            <Animated.View style={[styles.chip, popStyle(chips[0])]}>
              <Text style={styles.chipText}>{t('win.points', { n: points })}</Text>
            </Animated.View>
            <Animated.View style={[styles.chip, popStyle(chips[1])]}>
              <Text style={styles.chipText}>+{brainsEarned} 🧠</Text>
            </Animated.View>
          </View>

          {elapsedSeconds !== undefined && (
            <Text style={styles.timeText}>
              {t('win.time', { t: formatTime(elapsedSeconds) })}
              {isNewRecord ? t('win.record') : ''}
            </Text>
          )}

          {stats && (
            <Animated.View style={[styles.perfBox, popStyle(perf)]}>
              {stats.percent != null ? (
                <>
                  <Text style={styles.perfSmall}>{t('win.beatPre')}</Text>
                  <Text style={styles.perfPercent}>{percent}%</Text>
                  <Text style={styles.perfSmall}>{t('win.beatPost', { size: stats.size })}</Text>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${percent}%` }]} />
                  </View>
                  {tierKey && <Text style={styles.perfTier}>{t(tierKey)}</Text>}
                </>
              ) : (
                <Text style={styles.perfTier}>{stats.sample === 0 ? t('win.first') : t('win.few')}</Text>
              )}
              {flawless && <Text style={styles.flawless}>🧠 {t('win.flawless')}</Text>}
            </Animated.View>
          )}

          <Animated.View style={[styles.buttons, { opacity: buttons, transform: [{ translateY: buttons.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
            <PressableScale style={styles.primaryButton} onPress={onPrimary}>
              <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
            </PressableScale>
            {secondaryLabel && onSecondary && (
              <PressableScale style={styles.secondaryButton} onPress={onSecondary}>
                <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
              </PressableScale>
            )}
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 6, 16, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  confettiLayer: {
    position: 'absolute',
    width: 420,
    height: 420,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confetti: {
    width: '100%',
    height: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: colors.accentSecondary,
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: colors.accentSecondary,
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  bannerWrap: {
    position: 'absolute',
    top: -22,
    backgroundColor: colors.accentSecondary,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#B98B12',
    paddingVertical: 6,
    paddingHorizontal: 22,
  },
  bannerText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: 0.5,
  },
  hero: {
    width: 130,
    height: 110,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rays: {
    position: 'absolute',
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ray: {
    position: 'absolute',
    width: 8,
    height: 130,
    borderRadius: 4,
    backgroundColor: 'rgba(240, 194, 62, 0.28)',
  },
  glow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(139, 195, 74, 0.35)',
  },
  heroEmoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 6,
  },
  star: {
    fontSize: 34,
    color: colors.accentSecondary,
  },
  starOff: {
    color: colors.surfaceMuted,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  chip: {
    backgroundColor: 'rgba(63, 165, 90, 0.14)',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 16,
  },
  chipText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.success,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.inkSoft,
    marginTop: 8,
  },
  perfBox: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  perfSmall: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F0E9D4',
    textAlign: 'center',
  },
  perfPercent: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.accent,
    lineHeight: 50,
  },
  track: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    marginTop: 8,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  perfTier: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.accentSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  flawless: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.accent,
    marginTop: 6,
  },
  buttons: {
    width: '100%',
    alignItems: 'center',
    marginTop: 14,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 999,
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: colors.accentDark,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '900',
  },
  secondaryButton: {
    paddingVertical: 10,
    marginTop: 4,
  },
  secondaryButtonText: {
    color: colors.inkSoft,
    fontSize: 15,
    fontWeight: '600',
  },
});
