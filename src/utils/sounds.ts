import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useGameStore } from '../state/store';

const sources = {
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  win: require('../../assets/sounds/win.wav'),
  lose: require('../../assets/sounds/lose.wav'),
  mark: require('../../assets/sounds/mark.wav'),
  hint: require('../../assets/sounds/hint.wav'),
  bonus: require('../../assets/sounds/bonus.wav'),
  bat: require('../../assets/sounds/bat.wav'),
  swoosh: require('../../assets/sounds/swoosh.wav'),
} as const;

export type SoundKey = keyof typeof sources;

const players: Partial<Record<SoundKey, AudioPlayer>> = {};

function getPlayer(key: SoundKey): AudioPlayer {
  let player = players[key];
  if (!player) {
    player = createAudioPlayer(sources[key]);
    players[key] = player;
  }
  return player;
}

/** Plays a short effect from the start, even if it's already mid-playback
 * from a rapid previous trigger. Best-effort: sound is pure polish, so a
 * playback failure (e.g. an unsupported platform) never breaks gameplay. */
export async function playSound(key: SoundKey): Promise<void> {
  try {
    const player = getPlayer(key);
    player.volume = useGameStore.getState().sfxVolume;
    await player.seekTo(0);
    player.play();
  } catch {
    // ignore
  }
}
