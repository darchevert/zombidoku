import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { useT } from '../i18n';

type MiniCell = 'x' | 'zombie' | 'blank';

interface RuleCardProps {
  grid: MiniCell[][];
  text: string;
}

export function RuleCard({ grid, text }: RuleCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.mini}>
        {grid.map((row, r) => (
          <View key={r} style={styles.miniRow}>
            {row.map((cell, c) => (
              <View key={c} style={styles.miniCell}>
                {cell === 'zombie' && <Text style={styles.miniZombie}>🧟</Text>}
                {cell === 'x' && <Text style={styles.miniX}>✕</Text>}
              </View>
            ))}
          </View>
        ))}
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const RULE_ONE_PER_COLOR: MiniCell[][] = [
  ['x', 'x', 'x'],
  ['x', 'zombie', 'x'],
  ['x', 'blank', 'blank'],
];
const RULE_ONE_PER_LINE: MiniCell[][] = [
  ['x', 'x', 'zombie'],
  ['x', 'zombie', 'x'],
  ['zombie', 'x', 'x'],
];
const RULE_NO_TOUCH: MiniCell[][] = [
  ['x', 'x', 'x'],
  ['x', 'zombie', 'x'],
  ['x', 'x', 'x'],
];

export function RuleCards() {
  const t = useT();
  return (
    <View style={styles.row}>
      <RuleCard grid={RULE_ONE_PER_COLOR} text={t('rules.color')} />
      <RuleCard grid={RULE_ONE_PER_LINE} text={t('rules.line')} />
      <RuleCard grid={RULE_NO_TOUCH} text={t('rules.touch')} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    padding: 8,
    gap: 8,
  },
  mini: {
    width: 36,
    height: 36,
  },
  miniRow: {
    flexDirection: 'row',
    flex: 1,
  },
  miniCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent + '33',
    margin: 0.5,
    borderRadius: 2,
  },
  miniZombie: {
    fontSize: 8,
  },
  miniX: {
    fontSize: 8,
    color: colors.inkSoft,
    fontWeight: '700',
  },
  text: {
    flex: 1,
    fontSize: 11,
    color: colors.ink,
    lineHeight: 14,
  },
});
