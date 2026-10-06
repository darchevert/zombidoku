import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { PressableScale } from './PressableScale';

interface PowerButtonProps {
  emoji: string;
  /** Omit for a free action with no charge count (e.g. undo) — hides the
   * badge instead of showing a meaningless number. A string renders as
   * badge text as-is (used for the "▶" rewarded-ad prompt when a
   * power-up is out of charges). */
  badge?: string | number;
  /** 'ad' gives the badge a distinct color from the normal charge-count
   * red, so a depleted power-up's "watch an ad" state doesn't look like
   * just another number. */
  badgeVariant?: 'count' | 'ad';
  onPress: () => void;
  disabled?: boolean;
}

export function PowerButton({ emoji, badge, badgeVariant = 'count', onPress, disabled }: PowerButtonProps) {
  return (
    <PressableScale
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Text style={styles.emoji}>{emoji}</Text>
      {badge !== undefined && (
        <View style={[styles.badge, badgeVariant === 'ad' && styles.badgeAd]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  emoji: {
    fontSize: 28,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeAd: {
    backgroundColor: colors.accent,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
