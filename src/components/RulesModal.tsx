import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { useT } from '../i18n';
import { PressableScale } from './PressableScale';
import { PopCard } from './PopCard';

interface RulesModalProps {
  visible: boolean;
  onClose: () => void;
}

const SECTIONS = ['goal', 'touch', 'tap', 'lives', 'powers', 'brains'] as const;
const ICONS: Record<(typeof SECTIONS)[number], string> = {
  goal: '🎯',
  touch: '🚫',
  tap: '👆',
  lives: '❤️',
  powers: '✨',
  brains: '🧠',
};

/** The game rules, opened from the "?" button on the home screen. */
export function RulesModal({ visible, onClose }: RulesModalProps) {
  const t = useT();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <PopCard style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('help.title')}</Text>
            <PressableScale onPress={onClose} hitSlop={20}>
              <Text style={styles.close}>✕</Text>
            </PressableScale>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
            {SECTIONS.map((key) => (
              <View key={key} style={styles.row}>
                <Text style={styles.icon}>{ICONS[key]}</Text>
                <Text style={styles.text}>{t(`help.${key}`)}</Text>
              </View>
            ))}
          </ScrollView>
          <PressableScale style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>{t('help.close')}</Text>
          </PressableScale>
        </PopCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 6, 16, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.accentSecondary,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
    textAlign: 'center',
    lineHeight: 34,
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    overflow: 'hidden',
  },
  list: {
    gap: 12,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    padding: 12,
  },
  icon: {
    fontSize: 24,
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
    fontWeight: '600',
  },
  button: {
    marginTop: 10,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: colors.accentDark,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.background,
  },
});
