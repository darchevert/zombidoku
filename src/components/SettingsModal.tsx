import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Switch, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { useGameStore } from '../state/store';
import { privacyOptionsRequired, showPrivacyOptions } from '../utils/ads';
import { PressableScale } from './PressableScale';

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
  const [showPrivacy, setShowPrivacy] = useState(false);
  useEffect(() => {
    if (visible) privacyOptionsRequired().then(setShowPrivacy);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Réglages</Text>
            <PressableScale onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </PressableScale>
          </View>

          <Row label="Sons" value={soundEnabled} onToggle={toggleSound} />
          <Row label="Musique" value={musicEnabled} onToggle={toggleMusic} />
          <Row label="Vibrations" value={hapticsEnabled} onToggle={toggleHaptics} />
          <Row label="Mode Zen (sans vies)" value={zenModeEnabled} onToggle={toggleZenMode} />
          <Row label="Mode chrono" value={timerModeEnabled} onToggle={toggleTimerMode} />
          {showPrivacy && (
            <PressableScale style={styles.row} onPress={showPrivacyOptions}>
              <Text style={styles.rowLabel}>Confidentialité et publicités</Text>
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
  close: {
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
