import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { AVATAR_EMOJI, useGameStore } from '../state/store';
import { DAILY_CHALLENGE_UNLOCK_LEVEL } from '../utils/levelConfig';
import { companionProgress, companionTier, ACCESSORIES } from '../utils/companion';
import { milestoneForDay, nextMilestoneDay } from '../utils/streakRewards';
import { ProfileModal } from '../components/ProfileModal';
import { StreakModal } from '../components/StreakModal';
import { SettingsModal } from '../components/SettingsModal';
import { CompanionModal } from '../components/CompanionModal';
import { PressableScale } from '../components/PressableScale';
import { MAX_CONTENT_WIDTH } from '../theme/layout';
import { useT } from '../i18n';

interface HomeScreenProps {
  onPlay: () => void;
  onPlayDaily: () => void;
}

export function HomeScreen({ onPlay, onPlayDaily }: HomeScreenProps) {
  const t = useT();
  const level = useGameStore((s) => s.level);
  const avatar = useGameStore((s) => s.avatar);
  const streak = useGameStore((s) => s.streak);
  const dailyDoneToday = useGameStore((s) => s.hasCompletedDailyToday());
  const companionXp = useGameStore((s) => s.companionXp);
  const equippedAccessory = useGameStore((s) => s.equippedAccessory);
  const [showProfile, setShowProfile] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCompanion, setShowCompanion] = useState(false);

  // The next not-yet-secured night — whether tonight's already claimed or
  // not, this is always the soonest one still up for grabs.
  const upcomingNight = streak + 1;
  const nextBonusDay = nextMilestoneDay(upcomingNight);
  const nextBonusReward = milestoneForDay(nextBonusDay);
  const nightsUntilBonus = nextBonusDay - upcomingNight;

  const dailyUnlocked = level >= DAILY_CHALLENGE_UNLOCK_LEVEL;
  const tier = companionTier(companionXp);
  const progress = companionProgress(companionXp);
  const equippedEmoji = ACCESSORIES.find((a) => a.id === equippedAccessory)?.emoji;

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <PressableScale style={styles.avatarButton} onPress={() => setShowProfile(true)}>
            <Text style={styles.avatarEmoji}>{AVATAR_EMOJI[avatar]}</Text>
          </PressableScale>
          <PressableScale style={styles.settingsButton} onPress={() => setShowSettings(true)}>
            <Text style={styles.settingsIcon}>⚙</Text>
          </PressableScale>
        </View>

        <View style={styles.cardsRow}>
          <PressableScale
            style={[styles.card, styles.dailyCard]}
            onPress={onPlayDaily}
            disabled={!dailyUnlocked}
          >
            <Text style={styles.cardTitle}>{t('home.alertTitle')}</Text>
            {dailyUnlocked ? (
              <Text style={styles.cardIcon}>{dailyDoneToday ? '✅' : '🎯'}</Text>
            ) : (
              <>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.cardSubtitle}>
                  {t('home.unlockAt', { n: DAILY_CHALLENGE_UNLOCK_LEVEL })}
                </Text>
              </>
            )}
          </PressableScale>

          <PressableScale style={[styles.card, styles.streakCard]} onPress={() => setShowStreak(true)}>
            <Text style={[styles.cardTitle, styles.streakTitle]}>{t('home.nights')}</Text>
            <Text style={styles.cardIcon}>🌙</Text>
            <View style={styles.streakPill}>
              <Text style={styles.streakValue}>{streak}</Text>
            </View>
            {nextBonusReward && (
              <Text style={styles.streakBonusHint}>
                {nightsUntilBonus === 0
                  ? `${nextBonusReward.emoji} ${t('home.tonight')}`
                  : `${nextBonusReward.emoji} ${t('home.inDays', { n: nightsUntilBonus })}`}
              </Text>
            )}
          </PressableScale>
        </View>

        <PressableScale style={styles.companionBanner} onPress={() => setShowCompanion(true)}>
          <View style={styles.companionEmojiRow}>
            <Text style={styles.companionBannerEmoji}>{tier.emoji}</Text>
            {equippedEmoji && <Text style={styles.companionAccessory}>{equippedEmoji}</Text>}
          </View>
          <View style={styles.companionInfo}>
            <Text style={styles.companionBannerName}>{t(`tier.${tier.level}`)}</Text>
            <View style={styles.companionProgressTrack}>
              <View
                style={[styles.companionProgressFill, { width: `${Math.round(progress * 100)}%` }]}
              />
            </View>
          </View>
          <Text style={styles.companionChevron}>›</Text>
        </PressableScale>

        <View style={styles.logoBlock}>
          <Text style={styles.logoLine}>
            Z<Text style={styles.logoAccent}>O</Text>MBI
          </Text>
          <Text style={styles.logoLine}>
            D<Text style={styles.logoSecondary}>O</Text>KU
          </Text>
        </View>

        <PressableScale style={styles.playButton} onPress={onPlay}>
          <Text style={styles.playButtonText}>{t('home.levelButton', { n: level })}</Text>
        </PressableScale>
      </ScrollView>

      <ProfileModal visible={showProfile} onClose={() => setShowProfile(false)} />
      <StreakModal visible={showStreak} onClose={() => setShowStreak(false)} />
      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
      <CompanionModal visible={showCompanion} onClose={() => setShowCompanion(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  scroll: {
    // The screen centres its children, so without an explicit width the
    // ScrollView shrink-wraps its content and the 100%-wide rows overflow.
    width: '100%',
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  avatarButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#4A3B66',
    borderWidth: 3,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  settingsIcon: {
    fontSize: 20,
    color: colors.ink,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
    width: '100%',
  },
  card: {
    flex: 1,
    // Taller than a plain square so the streak card's extra "next bonus"
    // line has room — flexbox's space-between doesn't grow the box to
    // fit content, so too-short a ratio here overflows text past the
    // card's rounded corner instead of clipping or wrapping it.
    aspectRatio: 0.72,
    borderRadius: 22,
    padding: 16,
    alignItems: 'center',
  },
  dailyCard: {
    backgroundColor: '#4A3B66',
    justifyContent: 'space-between',
  },
  streakCard: {
    backgroundColor: '#3A3550',
    borderWidth: 2,
    borderColor: 'rgba(240, 194, 62, 0.35)',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.surface,
    textAlign: 'center',
  },
  streakTitle: {
    color: colors.accentSecondary,
    alignSelf: 'flex-start',
  },
  cardIcon: {
    fontSize: 44,
  },
  lockIcon: {
    fontSize: 36,
    color: colors.surface,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.surface,
    textAlign: 'center',
  },
  streakPill: {
    backgroundColor: colors.accentSecondary,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  streakValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3A2C10',
  },
  streakBonusHint: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accentSecondary,
    marginTop: 6,
  },
  companionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  companionEmojiRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  companionBannerEmoji: {
    fontSize: 38,
  },
  companionAccessory: {
    fontSize: 18,
    marginLeft: -6,
    marginBottom: 4,
  },
  companionInfo: {
    flex: 1,
    gap: 6,
  },
  companionBannerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  companionProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  companionProgressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  companionChevron: {
    fontSize: 22,
    color: colors.inkSoft,
  },
  logoBlock: {
    marginTop: 32,
    alignItems: 'center',
  },
  logoLine: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.surface,
    letterSpacing: 2,
  },
  logoAccent: {
    color: colors.accent,
  },
  logoSecondary: {
    color: colors.accentSecondary,
  },
  playButton: {
    marginTop: 36,
    backgroundColor: colors.accent,
    paddingVertical: 18,
    paddingHorizontal: 56,
    borderRadius: 999,
    shadowColor: colors.accentDark,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  playButtonText: {
    color: colors.background,
    fontSize: 22,
    fontWeight: '800',
  },
});
