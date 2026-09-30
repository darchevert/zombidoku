import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
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
  const sfxVolume = useGameStore((s) => s.sfxVolume);
  const musicVolume = useGameStore((s) => s.musicVolume);
  const setSfxVolume = useGameStore((s) => s.setSfxVolume);
  const setMusicVolume = useGameStore((s) => s.setMusicVolume);
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

          <ScrollView showsVerticalScrollIndicator={false}>
          <Row label={t('settings.sounds')} value={soundEnabled} onToggle={toggleSound} />
          <VolumeBar label={t('settings.sfxVolume')} value={sfxVolume} onChange={setSfxVolume} />
          <Row label={t('settings.music')} value={musicEnabled} onToggle={toggleMusic} />
          <VolumeBar label={t('settings.musicVolume')} value={musicVolume} onChange={setMusicVolume} />
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
          <Text style={styles.sectionLabel}>{t('settings.credits')}</Text>
          <Text style={styles.credits}>
            Alexandr Zhelanov (Doll House, WTF! Ghost!) · Alex McCulloch (Caper)
          </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** Ten tappable segments: tap the n-th to set the volume to n/10, tap the
 * speaker to mute. Deliberately not a drag slider, so it needs no native
 * dependency and can't be mis-set by a stray swipe inside the scrolling
 * settings card. */
function VolumeBar({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const level = Math.round(value * 10);
  return (
    <View style={styles.volumeBox}>
      <Text style={styles.volumeLabel}>{label}</Text>
      <View style={styles.volumeRow}>
        <PressableScale hitSlop={10} onPress={() => onChange(0)}>
          <Text style={styles.speaker}>{level === 0 ? '🔇' : '🔈'}</Text>
        </PressableScale>
        {Array.from({ length: 10 }).map((_, i) => (
          <PressableScale
            key={i}
            hitSlop={{ top: 12, bottom: 12 }}
            style={[styles.segment, i < level && styles.segmentOn]}
            onPress={() => onChange((i + 1) / 10)}
          />
        ))}
        <Text style={styles.speaker}>🔊</Text>
      </View>
    </View>
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
    maxHeight: '88%',
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
  volumeBox: {
    paddingHorizontal: 16,
    marginTop: -4,
    marginBottom: 12,
  },
  volumeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkSoft,
    marginBottom: 6,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  speaker: {
    fontSize: 16,
    marginHorizontal: 4,
  },
  segment: {
    flex: 1,
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  segmentOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  credits: {
    fontSize: 12,
    color: colors.inkSoft,
    marginBottom: 8,
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
