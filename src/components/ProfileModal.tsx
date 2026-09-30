import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import {
  AVATARS,
  AVATAR_EMOJI,
  FRAMES,
  type AvatarId,
  type FrameId,
  useGameStore,
} from '../state/store';
import { PressableScale } from './PressableScale';
import { PopCard } from './PopCard';
import { useT } from '../i18n';

const FRAME_COLORS: Record<FrameId, string> = {
  none: 'transparent',
  green: '#7BC77E',
  gold: '#E8C34A',
  blue: '#6FA8DC',
  pink: '#E893C3',
};

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ProfileModal({ visible, onClose }: ProfileModalProps) {
  const t = useT();
  const playerId = useGameStore((s) => s.playerId);
  const avatar = useGameStore((s) => s.avatar);
  const frame = useGameStore((s) => s.frame);
  const setAvatar = useGameStore((s) => s.setAvatar);
  const setFrame = useGameStore((s) => s.setFrame);

  const [tab, setTab] = useState<'avatar' | 'frame'>('avatar');
  const [pendingAvatar, setPendingAvatar] = useState<AvatarId>(avatar);
  const [pendingFrame, setPendingFrame] = useState<FrameId>(frame);

  // Closing with ✕ discards the unconfirmed picks: start from the saved
  // profile every time the modal opens.
  useEffect(() => {
    if (visible) {
      setPendingAvatar(avatar);
      setPendingFrame(frame);
      setTab('avatar');
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <PopCard style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('profile.title')}</Text>
            <PressableScale onPress={onClose} hitSlop={20}>
              <Text style={styles.close}>✕</Text>
            </PressableScale>
          </View>

          <View style={styles.identityRow}>
            <View
              style={[
                styles.avatarPreview,
                { borderColor: FRAME_COLORS[pendingFrame] },
              ]}
            >
              <Text style={styles.avatarPreviewEmoji}>{AVATAR_EMOJI[pendingAvatar]}</Text>
            </View>
            <View style={styles.idBox}>
              <Text style={styles.idText}>{playerId}</Text>
            </View>
          </View>

          <View style={styles.tabRow}>
            <PressableScale
              style={[styles.tab, tab === 'avatar' && styles.tabActive]}
              onPress={() => setTab('avatar')}
            >
              <Text style={[styles.tabText, tab === 'avatar' && styles.tabTextActive]}>
                {t('profile.avatar')}
              </Text>
            </PressableScale>
            <PressableScale
              style={[styles.tab, tab === 'frame' && styles.tabActive]}
              onPress={() => setTab('frame')}
            >
              <Text style={[styles.tabText, tab === 'frame' && styles.tabTextActive]}>
                {t('profile.frame')}
              </Text>
            </PressableScale>
          </View>

          <ScrollView contentContainerStyle={styles.grid}>
            {tab === 'avatar'
              ? AVATARS.map((id) => (
                  <PressableScale
                    key={id}
                    style={styles.gridItem}
                    onPress={() => setPendingAvatar(id)}
                  >
                    <Text style={styles.gridEmoji}>{AVATAR_EMOJI[id]}</Text>
                    {id === pendingAvatar && (
                      <View style={styles.checkBadge}>
                        <Text style={styles.checkText}>✓</Text>
                      </View>
                    )}
                  </PressableScale>
                ))
              : FRAMES.map((id) => (
                  <PressableScale
                    key={id}
                    style={[styles.gridItem, { borderColor: FRAME_COLORS[id], borderWidth: 3 }]}
                    onPress={() => setPendingFrame(id)}
                  >
                    <Text style={styles.gridEmoji}>⬚</Text>
                    {id === pendingFrame && (
                      <View style={styles.checkBadge}>
                        <Text style={styles.checkText}>✓</Text>
                      </View>
                    )}
                  </PressableScale>
                ))}
          </ScrollView>

          <PressableScale
            style={styles.confirmButton}
            onPress={() => {
              setAvatar(pendingAvatar);
              setFrame(pendingFrame);
              onClose();
            }}
          >
            <Text style={styles.confirmText}>{t('common.confirm')}</Text>
          </PressableScale>
        </PopCard>
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
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
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
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatarPreview: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 3,
    backgroundColor: '#4A3B66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPreviewEmoji: {
    fontSize: 32,
  },
  idBox: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  idText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: 1,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.inkSoft,
  },
  tabText: {
    fontWeight: '700',
    color: colors.inkSoft,
  },
  tabTextActive: {
    color: '#fff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 8,
  },
  gridItem: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridEmoji: {
    fontSize: 30,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  confirmButton: {
    marginTop: 12,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  confirmText: {
    color: colors.background,
    fontSize: 17,
    fontWeight: '700',
  },
});
