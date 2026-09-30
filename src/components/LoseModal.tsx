import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { PressableScale } from './PressableScale';
import { useT } from '../i18n';

interface LoseModalProps {
  visible: boolean;
  title: string;
  onRetry: () => void;
  onHome: () => void;
}

export function LoseModal({ visible, title, onRetry, onHome }: LoseModalProps) {
  const t = useT();
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.emoji}>🧟💀</Text>
          <Text style={styles.subtitle}>{t('lose.subtitle')}</Text>
          <PressableScale style={styles.primaryButton} onPress={onRetry}>
            <Text style={styles.primaryButtonText}>{t('common.retry')}</Text>
          </PressableScale>
          <PressableScale style={styles.secondaryButton} onPress={onHome}>
            <Text style={styles.secondaryButtonText}>{t('common.home')}</Text>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
  },
  emoji: {
    fontSize: 40,
  },
  subtitle: {
    fontSize: 15,
    color: colors.inkSoft,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 999,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: colors.inkSoft,
    fontSize: 15,
    fontWeight: '600',
  },
});
