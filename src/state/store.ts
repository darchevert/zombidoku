import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { todayKey } from '../utils/date';
import { SHOP_PRODUCTS } from '../config/revenuecat';
import { rollTomb, TOMB_RULES, type BonusKind, type Reward, type TombKind } from '../utils/rewards';
import { milestoneForDay, type StreakReward } from '../utils/streakRewards';
import type { Lang } from '../i18n/translations';

export const AVATARS = [
  'zombie',
  'ghost',
  'pumpkin',
  'skull',
  'vampire',
  'bat',
  'ogre',
  'troll',
] as const;
export type AvatarId = (typeof AVATARS)[number];

export const AVATAR_EMOJI: Record<AvatarId, string> = {
  zombie: '🧟',
  ghost: '👻',
  pumpkin: '🎃',
  skull: '💀',
  vampire: '🧛',
  bat: '🦇',
  ogre: '👹',
  troll: '🧌',
};

export const FRAMES = ['none', 'green', 'gold', 'blue', 'pink'] as const;
export type FrameId = (typeof FRAMES)[number];

function randomPlayerId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

interface GameState {
  // Profile
  playerId: string;
  avatar: AvatarId;
  frame: FrameId;
  setAvatar: (avatar: AvatarId) => void;
  setFrame: (frame: FrameId) => void;

  // Progression
  level: number;
  score: number;
  /** The currency — "brains", earned by clearing levels/the daily
   * challenge and spent on power-ups or feeding the companion. */
  brains: number;
  hints: number;
  autoCats: number;
  mice: number;
  completeLevel: (params: { scoreEarned: number; brainsEarned: number; bonuses?: BonusKind[] }) => void;

  // Tombs — a small free one per day, extra ones for a rewarded ad or
  // brains, and a big chest (see utils/rewards for the odds).
  tombDay: string;
  tombUsage: { smallFree: number; smallAd: number; chestAd: number };
  /** How many free / ad openings are left today for each tomb. */
  tombStatus: () => { smallFreeLeft: number; smallAdLeft: number; chestAdLeft: number };
  /** Opens a tomb and grants its reward; null if the payment isn't
   * allowed (limit reached / not enough brains). The caller shows the ad
   * first for payment 'ad'. */
  openTomb: (kind: TombKind, payment: 'free' | 'ad' | 'brains') => Reward | null;

  // In-app purchases: transaction ids already granted, so a purchase is
  // never credited twice.
  processedPurchases: string[];
  /** True once "remove ads" was bought: no more interstitials. */
  adsRemoved: boolean;
  setAdsRemoved: () => void;
  /** Credits the content of a purchased product; false if unknown or already granted. */
  grantPurchase: (productId: string, transactionId: string) => boolean;

  // Daily challenge — a single shared puzzle per calendar day, separate
  // from level progression (doesn't advance `level`).
  dailyChallengeCompletedDate: string | null;
  hasCompletedDailyToday: () => boolean;
  completeDailyChallenge: (params: { scoreEarned: number; brainsEarned: number; bonuses?: BonusKind[] }) => void;

  // Power-ups
  useHint: () => boolean;
  useAutoCat: () => boolean;
  useMouse: () => boolean;
  buyHint: () => boolean;
  buyAutoCat: () => boolean;
  buyMouse: () => boolean;
  /** Free charges earned by watching a rewarded ad — unlike the buy*
   * actions, never cost brains. One per power-up so watching an ad for
   * a depleted mouse bonus doesn't hand out a hint instead. */
  grantHint: () => void;
  grantAutoCat: () => void;
  grantMouse: () => void;

  // Streak
  streak: number;
  bestStreak: number;
  lastStreakClaimDate: string | null;
  canClaimStreak: () => boolean;
  /** Claims tonight's streak day, applying its milestone bonus (if any)
   * on top of the flat +2 brains every night gives. Returns that bonus so
   * the UI can show what was won, or `null` on a plain (non-bonus) night
   * — see utils/streakRewards for the schedule. */
  claimStreak: () => StreakReward | null;

  // Settings
  /** Explicit UI language, or null to follow the device language. */
  language: Lang | null;
  setLanguage: (lang: Lang | null) => void;
  soundEnabled: boolean;
  musicEnabled: boolean;
  /** 0..1 — sound effects and background music levels. */
  sfxVolume: number;
  musicVolume: number;
  setSfxVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
  hapticsEnabled: boolean;
  toggleSound: () => void;
  toggleMusic: () => void;
  toggleHaptics: () => void;

  // Zen mode — level play with no lives/lose condition, off by default so
  // the default experience keeps its stakes. Never applies to the daily
  // challenge (see GameScreen), which is meant to stay a real one-shot.
  zenModeEnabled: boolean;
  toggleZenMode: () => void;

  // Timer mode — off by default (a visible clock adds pressure some
  // players don't want). Best time is kept per board size since regular
  // levels regenerate a fresh board of that size each time, so "the
  // level" isn't a stable thing to compare across attempts — the size is.
  timerModeEnabled: boolean;
  toggleTimerMode: () => void;
  bestTimeBySize: Record<number, number>;
  /** Per grid size, the "cost" (lower is better: mistakes, bonuses used and
   * seconds taken) of the player's recent wins — the yardstick for "you
   * beat X% of your own earlier games". Never compared with other players. */
  performanceHistory: Record<number, number[]>;
  /** Stores this win and returns how it ranks against the earlier ones. */
  recordPerformance: (size: number, cost: number) => { percent: number | null; sample: number };
  /** Returns true if this run beat (or set) the record for that size. */
  recordBestTime: (size: number, seconds: number) => boolean;

  // Companion — a persistent pet fed with brains, giving them a use
  // beyond the hint/auto-cat shop. XP-based level with emoji tiers, plus
  // separately unlockable/equippable cosmetic accessories.
  companionXp: number;
  unlockedAccessories: string[];
  equippedAccessory: string | null;
  feedCompanion: () => boolean;
  unlockAccessory: (id: string, cost: number) => boolean;
  equipAccessory: (id: string | null) => void;
}

const HINT_COST_BRAINS = 3;
const AUTOCAT_COST_BRAINS = 3;
const MOUSE_COST_BRAINS = 3;
/** The stock updates that add a list of bonuses to the player's counts. */
function addBonuses(
  s: { hints: number; autoCats: number; mice: number },
  bonuses: BonusKind[]
): { hints: number; autoCats: number; mice: number } {
  return {
    hints: s.hints + bonuses.filter((b) => b === 'hint').length,
    autoCats: s.autoCats + bonuses.filter((b) => b === 'autoCat').length,
    mice: s.mice + bonuses.filter((b) => b === 'bat').length,
  };
}

const FEED_COST_BRAINS = 2;
const FEED_XP_GAIN = 10;

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      playerId: randomPlayerId(),
      avatar: 'zombie',
      frame: 'green',
      setAvatar: (avatar) => set({ avatar }),
      setFrame: (frame) => set({ frame }),

      level: 1,
      score: 0,
      brains: 10,
      hints: 5,
      autoCats: 5,
      mice: 5,
      completeLevel: ({ scoreEarned, brainsEarned, bonuses = [] }) =>
        set((s) => ({
          level: s.level + 1,
          score: s.score + scoreEarned,
          brains: s.brains + brainsEarned,
          ...addBonuses(s, bonuses),
        })),

      processedPurchases: [],
      adsRemoved: false,
      setAdsRemoved: () => set({ adsRemoved: true }),
      grantPurchase: (productId, transactionId) => {
        const product = SHOP_PRODUCTS.find((p) => p.id === productId);
        if (!product || get().processedPurchases.includes(transactionId)) return false;
        if (product.removeAds) {
          set((s) => ({
            processedPurchases: [...s.processedPurchases, transactionId].slice(-200),
            adsRemoved: true,
          }));
          return true;
        }
        set((s) => ({
          processedPurchases: [...s.processedPurchases, transactionId].slice(-200),
          brains: s.brains + product.grant.brains,
          hints: s.hints + product.grant.hints,
          autoCats: s.autoCats + product.grant.autoCats,
          mice: s.mice + product.grant.mice,
        }));
        return true;
      },

      tombDay: todayKey(),
      tombUsage: { smallFree: 0, smallAd: 0, chestAd: 0 },
      tombStatus: () => {
        const usage = get().tombDay === todayKey() ? get().tombUsage : { smallFree: 0, smallAd: 0, chestAd: 0 };
        return {
          smallFreeLeft: TOMB_RULES.small.freePerDay - usage.smallFree,
          smallAdLeft: TOMB_RULES.small.adsPerDay - usage.smallAd,
          chestAdLeft: TOMB_RULES.chest.adsPerDay - usage.chestAd,
        };
      },
      openTomb: (kind, payment) => {
        const today = todayKey();
        const state = get();
        const usage = state.tombDay === today ? { ...state.tombUsage } : { smallFree: 0, smallAd: 0, chestAd: 0 };
        let brainCost = 0;
        if (payment === 'free') {
          if (kind !== 'small' || usage.smallFree >= TOMB_RULES.small.freePerDay) return null;
          usage.smallFree += 1;
        } else if (payment === 'ad') {
          if (kind === 'small') {
            if (usage.smallAd >= TOMB_RULES.small.adsPerDay) return null;
            usage.smallAd += 1;
          } else {
            if (usage.chestAd >= TOMB_RULES.chest.adsPerDay) return null;
            usage.chestAd += 1;
          }
        } else {
          brainCost = TOMB_RULES[kind].brainCost;
          if (state.brains < brainCost) return null;
        }
        const reward = rollTomb(kind);
        set((s) => ({
          tombDay: today,
          tombUsage: usage,
          brains: s.brains - brainCost + reward.brains,
          ...addBonuses(s, reward.bonuses),
        }));
        return reward;
      },

      dailyChallengeCompletedDate: null,
      hasCompletedDailyToday: () => get().dailyChallengeCompletedDate === todayKey(),
      completeDailyChallenge: ({ scoreEarned, brainsEarned, bonuses = [] }) => {
        const today = todayKey();
        if (get().dailyChallengeCompletedDate === today) return;
        set((s) => ({
          dailyChallengeCompletedDate: today,
          score: s.score + scoreEarned,
          brains: s.brains + brainsEarned,
          ...addBonuses(s, bonuses),
        }));
      },

      useHint: () => {
        const { hints } = get();
        if (hints <= 0) return false;
        set({ hints: hints - 1 });
        return true;
      },
      useAutoCat: () => {
        const { autoCats } = get();
        if (autoCats <= 0) return false;
        set({ autoCats: autoCats - 1 });
        return true;
      },
      useMouse: () => {
        const { mice } = get();
        if (mice <= 0) return false;
        set({ mice: mice - 1 });
        return true;
      },
      buyHint: () => {
        const { brains } = get();
        if (brains < HINT_COST_BRAINS) return false;
        set((s) => ({ brains: s.brains - HINT_COST_BRAINS, hints: s.hints + 1 }));
        return true;
      },
      buyAutoCat: () => {
        const { brains } = get();
        if (brains < AUTOCAT_COST_BRAINS) return false;
        set((s) => ({ brains: s.brains - AUTOCAT_COST_BRAINS, autoCats: s.autoCats + 1 }));
        return true;
      },
      buyMouse: () => {
        const { brains } = get();
        if (brains < MOUSE_COST_BRAINS) return false;
        set((s) => ({ brains: s.brains - MOUSE_COST_BRAINS, mice: s.mice + 1 }));
        return true;
      },
      grantHint: () => set((s) => ({ hints: s.hints + 1 })),
      grantAutoCat: () => set((s) => ({ autoCats: s.autoCats + 1 })),
      grantMouse: () => set((s) => ({ mice: s.mice + 1 })),

      streak: 0,
      bestStreak: 0,
      lastStreakClaimDate: null,
      canClaimStreak: () => get().lastStreakClaimDate !== todayKey(),
      claimStreak: () => {
        const { lastStreakClaimDate, streak, bestStreak } = get();
        const today = todayKey();
        if (lastStreakClaimDate === today) return null;

        const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
        const nextStreak = lastStreakClaimDate === yesterday ? streak + 1 : 1;
        const milestone = milestoneForDay(nextStreak);
        set((s) => ({
          streak: nextStreak,
          bestStreak: Math.max(bestStreak, nextStreak),
          lastStreakClaimDate: today,
          brains: s.brains + 2 + (milestone?.brains ?? 0),
          hints: s.hints + (milestone?.hints ?? 0),
          autoCats: s.autoCats + (milestone?.autoCats ?? 0),
          mice: s.mice + (milestone?.mice ?? 0),
        }));
        return milestone;
      },

      language: null,
      setLanguage: (language) => set({ language }),
      soundEnabled: true,
      musicEnabled: true,
      sfxVolume: 0.7,
      musicVolume: 0.4,
      setSfxVolume: (sfxVolume) => set({ sfxVolume }),
      setMusicVolume: (musicVolume) => set({ musicVolume }),
      hapticsEnabled: true,
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleMusic: () => set((s) => ({ musicEnabled: !s.musicEnabled })),
      toggleHaptics: () => set((s) => ({ hapticsEnabled: !s.hapticsEnabled })),

      zenModeEnabled: false,
      toggleZenMode: () => set((s) => ({ zenModeEnabled: !s.zenModeEnabled })),

      timerModeEnabled: false,
      toggleTimerMode: () => set((s) => ({ timerModeEnabled: !s.timerModeEnabled })),
      bestTimeBySize: {},
      performanceHistory: {},
      recordPerformance: (size, cost) => {
        const previous = get().performanceHistory[size] ?? [];
        const worse = previous.filter((c) => c > cost).length;
        const equal = previous.filter((c) => c === cost).length;
        const percent = previous.length >= 3 ? Math.round(((worse + equal / 2) / previous.length) * 100) : null;
        set((s) => ({
          performanceHistory: { ...s.performanceHistory, [size]: [...previous, cost].slice(-40) },
        }));
        return { percent, sample: previous.length };
      },
      recordBestTime: (size, seconds) => {
        const current = get().bestTimeBySize[size];
        if (current !== undefined && current <= seconds) return false;
        set((s) => ({ bestTimeBySize: { ...s.bestTimeBySize, [size]: seconds } }));
        return true;
      },

      companionXp: 0,
      unlockedAccessories: [],
      equippedAccessory: null,
      feedCompanion: () => {
        const { brains } = get();
        if (brains < FEED_COST_BRAINS) return false;
        set((s) => ({ brains: s.brains - FEED_COST_BRAINS, companionXp: s.companionXp + FEED_XP_GAIN }));
        return true;
      },
      unlockAccessory: (id, cost) => {
        const { brains, unlockedAccessories } = get();
        if (unlockedAccessories.includes(id)) return true;
        if (brains < cost) return false;
        set((s) => ({
          brains: s.brains - cost,
          unlockedAccessories: [...s.unlockedAccessories, id],
        }));
        return true;
      },
      equipAccessory: (id) => set({ equippedAccessory: id }),
    }),
    {
      name: 'zombidoku-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
