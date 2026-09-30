import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Switch, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { useGameStore } from '../state/store';
import { privacyOptionsRequired, showPrivacyOptions } from '../utils/ads';
import { PressableScale } from './PressableScale';
import { LANGUAGES, useLanguage, useT } from '../i18n';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const musicEnabled = useGameStore((s) => s.musicEnabled);
  const hapticsEnabled = useGameStore((s) => s.hapticsEnabled);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const toggleMusic = useGameStore((s) => s.toggleMusic);
  const toggleHaptics = useGameStore((s) => s.toggleHaptics);
  const zenModeEnabled = useGameStore((s) => s.zenModeEnabled);
  const toggleZenMode = useGameStore((s) => s.toggleZenMode);
  const timerModeEnabled = useGameStore((s) => s.timerModeEnabled);
  const toggleTimerMode = useGameStore((s) => s.toggleTimerMode);
  const t = useT();
  const language = useGameStore((s) => s.language);
  const setLanguage = useGameStore((s) => s.setLanguage);
  const currentLang = useLanguage();
  const [showPrivacy, setShowPrivacy] = useState(false);
  useEffect(() => {
    if (visible) privacyOptionsRequired().then(setShowPrivacy);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('settings.title')}</Text>
            <PressableScale onPress={onClose} hitSlop={20}>
              <Text style={styles.close}>✕</Text>
            </PressableScale>
          </View>

          <Row label={t('settings.sounds')} value={soundEnabled} onToggle={toggleSound} />
          <Row label={t('settings.music')} value={musicEnabled} onToggle={toggleMusic} />
          <Row label={t('settings.haptics')} value={hapticsEnabled} onToggle={toggleHaptics} />
          <Row label={t('settings.zen')} value={zenModeEnabled} onToggle={toggleZenMode} />
          <Row label={t('settings.timer')} value={timerModeEnabled} onToggle={toggleTimerMode} />
          <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
          <View style={styles.langWrap}>
            {LANGUAGES.map((l) => (
              <PressableScale
                key={l.id}
                style={[styles.langChip, currentLang === l.id && styles.langChipActive]}
                onPress={() => setLanguage(l.id)}
              >
                <Text style={[styles.langText, currentLang === l.id && styles.langTextActive]}>{l.label}</Text>
              </PressableScale>
            ))}
          </View>
          {showPrivacy && (
            <PressableScale style={styles.row} onPress={showPrivacyOptions}>
              <Text style={styles.rowLabel}>{t('settings.privacy')}</Text>
            </PressableScale>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Row({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ true: colors.accent, false: '#ccc' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.inkSoft,
    marginTop: 4,
    marginBottom: 8,
  },
  langWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  langChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
  },
  langChipActive: {
    backgroundColor: colors.accent,
  },
  langText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  langTextActive: {
    color: colors.background,
  },
  close: {
    padding: 8,
    fontSize: 20,
    color: colors.ink,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
  },
});
