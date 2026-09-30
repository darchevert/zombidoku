import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions } from 'react-native';
import { colors } from '../theme/colors';
import { useGameStore } from '../state/store';
import { privacyOptionsRequired, showPrivacyOptions } from '../utils/ads';
import { PressableScale } from './PressableScale';
import { PopCard } from './PopCard';
import { LANGUAGES, useLanguage, useT } from '../i18n';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const hapticsEnabled = useGameStore((s) => s.hapticsEnabled);
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
  const { height: windowHeight } = useWindowDimensions();
  const short = windowHeight < 640; // tighter spacing so it still fits
  const [langOpen, setLangOpen] = useState(false);
  const [boxHeight, setBoxHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [showPrivacy, setShowPrivacy] = useState(false);
  useEffect(() => {
    if (visible) privacyOptionsRequired().then(setShowPrivacy);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <PopCard style={[styles.card, short && styles.cardShort]}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('settings.title')}</Text>
            <PressableScale onPress={onClose} hitSlop={20}>
              <Text style={styles.close}>✕</Text>
            </PressableScale>
          </View>

          {/* Only scrolls if the content really is taller than the card (tiny
           * screens); otherwise everything is simply visible. */}
          <ScrollView
            style={{ flexShrink: 1 }}
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
            scrollEnabled={contentHeight > boxHeight + 1}
            onLayout={(e) => setBoxHeight(e.nativeEvent.layout.height)}
            onContentSizeChange={(_, h) => setContentHeight(h)}
          >
          <VolumeBar label={t('settings.sfxVolume')} value={sfxVolume} onChange={setSfxVolume} />
          <VolumeBar label={t('settings.musicVolume')} value={musicVolume} onChange={setMusicVolume} />
          <Row short={short} label={t('settings.haptics')} value={hapticsEnabled} onToggle={toggleHaptics} />
          <Row short={short} label={t('settings.zen')} value={zenModeEnabled} onToggle={toggleZenMode} />
          <Row short={short} label={t('settings.timer')} value={timerModeEnabled} onToggle={toggleTimerMode} />
          <PressableScale
            style={[styles.row, short && { paddingVertical: 4, marginBottom: 4 }]}
            onPress={() => setLangOpen(true)}
          >
            <Text style={styles.rowLabel}>{t('settings.language')}</Text>
            <Text style={styles.langValue}>
              {LANGUAGES.find((l) => l.id === currentLang)?.label} ▾
            </Text>
          </PressableScale>
          {showPrivacy && (
            <PressableScale style={styles.row} onPress={showPrivacyOptions}>
              <Text style={styles.rowLabel}>{t('settings.privacy')}</Text>
            </PressableScale>
          )}
          <Text style={styles.sectionLabel}>{t('settings.credits')}</Text>
          <Text style={styles.credits}>
            Alexandr Zhelanov (Doll House, WTF! Ghost!) · Alex McCulloch (Caper) · neonarkade (Ends of the Earth)
          </Text>
          </ScrollView>
        </PopCard>

        {/* The language "drop-down": a small list floating over the settings. */}
        <Modal visible={langOpen} transparent animationType="fade" onRequestClose={() => setLangOpen(false)}>
          <Pressable style={styles.dropBackdrop} onPress={() => setLangOpen(false)}>
            <View style={styles.dropList}>
              {LANGUAGES.map((l) => (
                <PressableScale
                  key={l.id}
                  style={[styles.dropItem, currentLang === l.id && styles.dropItemActive]}
                  onPress={() => {
                    setLanguage(l.id);
                    setLangOpen(false);
                  }}
                >
                  <Text style={[styles.dropText, currentLang === l.id && styles.dropTextActive]}>{l.label}</Text>
                  {currentLang === l.id && <Text style={styles.dropCheck}>✓</Text>}
                </PressableScale>
              ))}
            </View>
          </Pressable>
        </Modal>
      </View>
    </Modal>
  );
}

/** Ten tappable segments: tap the n-th to set the volume to n/10, tap the
 * speaker to mute (and again to come back at half volume). Volume 0 is
 * the only "off" state. Deliberately not a drag slider, so it needs no native
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
        <PressableScale hitSlop={10} onPress={() => onChange(level === 0 ? 0.5 : 0)}>
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
  short,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
  short?: boolean;
}) {
  return (
    <View style={[styles.row, short && { paddingVertical: 4, marginBottom: 4 }]}>
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
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  cardShort: {
    padding: 12,
    maxHeight: '95%',
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
  langValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.inkSoft,
  },
  dropBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 6, 16, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dropList: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 6,
  },
  dropItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  dropItemActive: {
    backgroundColor: colors.accent,
  },
  dropText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
  },
  dropTextActive: {
    color: colors.background,
    fontWeight: '800',
  },
  dropCheck: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.background,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
  },
});
