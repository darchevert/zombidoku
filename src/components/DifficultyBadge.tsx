import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DIFFICULTY_COLORS, levelDifficulty } from '../utils/levelConfig';
import { useT } from '../i18n';

/** A colored pill with a level's difficulty (green easy, yellow medium, red
 * hard, purple expert) and a flame when it is a boss level. */
export function DifficultyBadge({ level, compact }: { level: number; compact?: boolean }) {
  const t = useT();
  const { difficulty, boss } = levelDifficulty(level);
  const { bg, text } = DIFFICULTY_COLORS[difficulty];
  return (
    <View style={[styles.pill, compact && styles.compact, { backgroundColor: bg }]}>
      <Text style={[styles.text, compact && styles.textCompact, { color: text }]}>
        {boss ? `🔥 ${t('diff.boss')} · ` : ''}
        {t(`diff.${difficulty}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'center',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  compact: {
    paddingVertical: 2,
    paddingHorizontal: 10,
  },
  text: {
    fontSize: 13,
    fontWeight: '800',
  },
  textCompact: {
    fontSize: 11,
  },
});
