import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useGameStore } from '../state/store';

// Halloween ambience; credits in assets/music/CREDITS.md and in Settings.
const tracks = [
  require('../../assets/music/caper.mp3'),
  require('../../assets/music/doll-house-soft.mp3'),
  require('../../assets/music/doll-house-bright.mp3'),
  require('../../assets/music/wtf-ghost.mp3'),
];

let player: AudioPlayer | null = null;
let lastIndex = -1;

/** Starts a random track (never the same one twice in a row), looping,
 * at the player's music volume. No-op when music is switched off.
 * Best-effort: music is polish, playback failures never break the game. */
export function playRandomMusic(): void {
  stopMusic();
  const { musicEnabled, musicVolume } = useGameStore.getState();
  if (!musicEnabled || musicVolume <= 0) return;
  try {
    let index = Math.floor(Math.random() * tracks.length);
    if (tracks.length > 1 && index === lastIndex) index = (index + 1) % tracks.length;
    lastIndex = index;
    player = createAudioPlayer(tracks[index]);
    player.loop = true;
    player.volume = musicVolume;
    player.play();
  } catch {
    player = null;
  }
}

export function stopMusic(): void {
  if (!player) return;
  try {
    player.pause();
    player.remove();
  } catch {
    // ignore
  }
  player = null;
}

// Follow the volume slider live while a track is playing.
useGameStore.subscribe((state) => {
  if (!player) return;
  try {
    player.volume = state.musicVolume;
  } catch {
    // ignore
  }
});
