import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { useGameStore } from '../state/store';
import { PressableScale } from './PressableScale';
import { milestoneForDay, nextMilestoneDay, type StreakReward } from '../utils/streakRewards';
import { useT } from '../i18n';

interface StreakModalProps {
  visible: boolean;
  onClose: () => void;
}

const CALENDAR_SPAN = 7;

export function StreakModal({ visible, onClose }: StreakModalProps) {
  const streak = useGameStore((s) => s.streak);
  const t = useT();
  const claimStreak = useGameStore((s) => s.claimStreak);
  const canClaimStreak = useGameStore((s) => s.canClaimStreak);
  const [claimed, setClaimed] = useState(false);
  const [wonReward, setWonReward] = useState<StreakReward | null>(null);

  const alreadyClaimedToday = !canClaimStreak();
  // The night the calendar should treat as "tonight": once claimed this
  // session `streak` already reflects it, so no +1 is needed.
  const displayDay = streak + (claimed ? 0 : 1);

  function handleTapMoon() {
    if (alreadyClaimedToday) {
      onClose();
      return;
    }
    const reward = claimStreak();
    setWonReward(reward);
    setClaimed(true);
  }

  const nextDay = nextMilestoneDay(displayDay);
  const daysUntilNext = nextDay - displayDay;
  const nextReward = milestoneForDay(nextDay);
  const calendarDays = Array.from({ length: CALENDAR_SPAN }, (_, i) => displayDay + i);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onDismiss={() => {
        setClaimed(false);
        setWonReward(null);
      }}
    >
      <Pressable style={styles.backdrop} onPress={claimed ? onClose : undefined}>
        <Text style={styles.star1}>✦</Text>
        <Text style={styles.star2}>✦</Text>
        <Text style={styles.star3}>✦</Text>

        <View style={styles.dayBadge}>
          <Text style={styles.dayNumber}>{streak + (claimed ? 0 : 1)}</Text>
        </View>

        <PressableScale style={styles.moonWrap} scaleTo={0.88} onPress={handleTapMoon}>
          <Text style={styles.moon}>🌙</Text>
        </PressableScale>

        <Text style={styles.caption}>
          {claimed
            ? t('streak.survived', { n: streak })
            : alreadyClaimedToday
            ? t('streak.alreadyClaimed')
            : t('streak.tapMoon')}
        </Text>

        {claimed && wonReward && (
          <View style={styles.rewardPill}>
            <Text style={styles.rewardText}>
              {wonReward.emoji} {t('streak.bonus', { label: t(wonReward.labelKey, wonReward.labelParams) })}
            </Text>
          </View>
        )}

        <View style={styles.calendarCard} pointerEvents="none">
          <Text style={styles.calendarTitle}>{t('streak.calendar')}</Text>
          <View style={styles.calendarRow}>
            {calendarDays.map((day, i) => {
              const dayReward = milestoneForDay(day);
              const isToday = i === 0;
              return (
                <View key={day} style={[styles.calendarCell, isToday && styles.calendarCellToday]}>
                  <Text style={styles.calendarEmoji}>{dayReward ? dayReward.emoji : '🌑'}</Text>
                  <Text style={[styles.calendarDayNumber, isToday && styles.calendarDayNumberToday]}>
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.calendarHint}>
            {daysUntilNext === 0 && nextReward
              ? t('streak.bonusTonight', { reward: `${nextReward.emoji} ${t(nextReward.labelKey, nextReward.labelParams)}` })
              : nextReward
              ? t('streak.next', {
                  n: daysUntilNext,
                  reward: `${nextReward.emoji} ${t(nextReward.labelKey, nextReward.labelParams)}`,
                })
              : null}
          </Text>
        </View>

        {claimed && (
          <PressableScale style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneButtonText}>{t('common.continue')}</Text>
          </PressableScale>
        )}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 24,
  },
  star1: {
    position: 'absolute',
    top: 90,
    left: 48,
    color: colors.accentSecondary,
    fontSize: 16,
    opacity: 0.7,
  },
  star2: {
    position: 'absolute',
    top: 150,
    right: 64,
    color: colors.accentSecondary,
    fontSize: 10,
    opacity: 0.5,
  },
  star3: {
    position: 'absolute',
    bottom: 140,
    left: 70,
    color: colors.accentSecondary,
    fontSize: 12,
    opacity: 0.6,
  },
  dayBadge: {
    position: 'absolute',
    top: 60,
    right: 32,
    opacity: 0.5,
  },
  dayNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.accent,
  },
  moonWrap: {
    padding: 16,
  },
  moon: {
    fontSize: 100,
  },
  caption: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.surface,
    textAlign: 'center',
  },
  rewardPill: {
    backgroundColor: colors.accentSecondary,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  rewardText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  calendarCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  calendarTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkSoft,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarCell: {
    alignItems: 'center',
    gap: 4,
    width: 36,
    paddingVertical: 6,
    borderRadius: 12,
  },
  calendarCellToday: {
    backgroundColor: colors.surfaceMuted,
  },
  calendarEmoji: {
    fontSize: 18,
  },
  calendarDayNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.inkSoft,
  },
  calendarDayNumberToday: {
    color: colors.ink,
  },
  calendarHint: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 999,
  },
  doneButtonText: {
    color: colors.background,
    fontSize: 17,
    fontWeight: '700',
  },
});
