import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useGameStore } from '../state/store';

// Halloween ambience; credits in assets/music/CREDITS.md and in Settings.
const tracks = [
  require('../../assets/music/caper.mp3'),
  require('../../assets/music/doll-house-soft.mp3'),
  require('../../assets/music/doll-house-bright.mp3'),
  require('../../assets/music/wtf-ghost.mp3'),
];

const INTRO_MS = 2000; // fade-in when a level's music starts
const CROSSFADE_S = 3; // the loop restarts this long before the end, overlapping
const OUTRO_MS = 600; // fade-out when the music is stopped
const TICK_MS = 100;

interface Voice {
  player: AudioPlayer;
  startedAt: number;
}

let current: Voice | null = null; // the track being heard
let next: Voice | null = null; // the same track, fading in for the loop
let crossStart = 0;
let dying: Array<{ player: AudioPlayer; from: number; startedAt: number }> = [];
let timer: ReturnType<typeof setInterval> | null = null;

// One track per level: the pick is remembered by level key, so retries,
// toggling music off/on or reopening Settings never swap it for another.
let chosen: { key: string | number; index: number } | null = null;
let lastIndex = -1; // last track used, to avoid repeating it on the next level

function safe(fn: () => void) {
  try {
    fn();
  } catch {
    // Music is polish; a playback failure must never break the game.
  }
}

function makeVoice(index: number, volume: number): Voice {
  const player = createAudioPlayer(tracks[index]);
  player.loop = false; // looping is done by the crossfade below
  player.volume = volume;
  player.play();
  return { player, startedAt: Date.now() };
}

function disposeVoice(player: AudioPlayer) {
  safe(() => {
    player.pause();
    player.remove();
  });
}

function tick() {
  const now = Date.now();
  const target = useGameStore.getState().musicVolume;

  // Voices being faded out after a stop.
  dying = dying.filter((d) => {
    const p = Math.min(1, (now - d.startedAt) / OUTRO_MS);
    safe(() => {
      d.player.volume = d.from * (1 - p);
    });
    if (p >= 1) disposeVoice(d.player);
    return p < 1;
  });

  if (current) {
    const cur = current;
    if (next) {
      // Crossfade: old track out, its own restart in.
      const p = Math.min(1, (now - crossStart) / (CROSSFADE_S * 1000));
      safe(() => {
        cur.player.volume = target * (1 - p);
        next!.player.volume = target * p;
      });
      if (p >= 1) {
        disposeVoice(cur.player);
        current = next;
        next = null;
      }
    } else {
      const intro = Math.min(1, (now - cur.startedAt) / INTRO_MS);
      safe(() => {
        cur.player.volume = target * intro;
        const { duration, currentTime } = cur.player;
        if (duration > CROSSFADE_S * 2 && duration - currentTime <= CROSSFADE_S && chosen) {
          next = makeVoice(chosen.index, 0);
          crossStart = now;
        }
      });
    }
  }

  if (!current && !next && dying.length === 0 && timer) {
    clearInterval(timer);
    timer = null;
  }
}

function ensureTimer() {
  if (!timer) timer = setInterval(tick, TICK_MS);
}

/** Plays the music for a level: a random track picked once per level key
 * (never the same as the previous level's), faded in and looped with a
 * crossfade. Calling it again for the same key while playing is a no-op,
 * so nothing ever swaps the track mid-level. No-op when music is off. */
export function playMusicForLevel(key: string | number): void {
  const { musicEnabled, musicVolume } = useGameStore.getState();
  if (!musicEnabled || musicVolume <= 0) return;
  if (current && chosen?.key === key) return;

  stopMusic();
  if (!chosen || chosen.key !== key) {
    let index = Math.floor(Math.random() * tracks.length);
    if (tracks.length > 1 && index === lastIndex) index = (index + 1) % tracks.length;
    lastIndex = index;
    chosen = { key, index };
  }
  safe(() => {
    current = makeVoice(chosen!.index, 0);
    ensureTimer();
  });
}

/** Fades the music out and stops it. The level's track choice is kept, so
 * turning music back on resumes the same track. */
export function stopMusic(): void {
  const now = Date.now();
  const target = useGameStore.getState().musicVolume;
  for (const voice of [current, next]) {
    if (voice) dying.push({ player: voice.player, from: target, startedAt: now });
  }
  current = null;
  next = null;
  if (dying.length > 0) ensureTimer();
}

/** Forget the level's track: the next level that starts gets a new one. */
export function resetMusicChoice(): void {
  chosen = null;
}
