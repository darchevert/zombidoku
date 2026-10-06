import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { useT } from '../i18n';

interface ProgressBadgesProps {
  zombiesPlaced: number;
  zombiesTotal: number;
  lives: number;
  maxLives: number;
  /** Replaces the lives pill with a "no stakes" badge — used for zen-mode
   * level play, where wrong guesses don't cost anything. */
  zen?: boolean;
}

export function ProgressBadges({ zombiesPlaced, zombiesTotal, lives, maxLives, zen }: ProgressBadgesProps) {
  const t = useT();
  return (
    <View style={styles.row}>
      <View style={styles.pill}>
        <Text style={styles.emoji}>🧟</Text>
        <Text style={styles.count}>
          {zombiesPlaced}/{zombiesTotal}
        </Text>
      </View>
      {zen ? (
        <View style={styles.pill}>
          <Text style={styles.emoji}>🧘</Text>
          <Text style={styles.count}>{t('common.zen')}</Text>
        </View>
      ) : (
        <View style={styles.pill}>
          {Array.from({ length: maxLives }).map((_, i) => (
            <Text key={i} style={[styles.brain, i >= lives && styles.brainLost]}>
              🧠
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  emoji: {
    fontSize: 16,
  },
  brain: {
    fontSize: 16,
  },
  brainLost: {
    opacity: 0.2,
  },
  count: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },
});
