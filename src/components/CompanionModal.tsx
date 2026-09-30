import React, { useRef } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { colors } from '../theme/colors';
import { useGameStore } from '../state/store';
import { PressableScale } from './PressableScale';
import {
  ACCESSORIES,
  COMPANION_MAX_LEVEL,
  companionProgress,
  companionTier,
  companionXpInLevel,
} from '../utils/companion';
import { useT } from '../i18n';

const heartPopSource = require('../../assets/lottie/heart-pop.json');

interface CompanionModalProps {
  visible: boolean;
  onClose: () => void;
}

const FEED_COST_BRAINS = 2;

export function CompanionModal({ visible, onClose }: CompanionModalProps) {
  const brains = useGameStore((s) => s.brains);
  const t = useT();
  const companionXp = useGameStore((s) => s.companionXp);
  const unlockedAccessories = useGameStore((s) => s.unlockedAccessories);
  const equippedAccessory = useGameStore((s) => s.equippedAccessory);
  const feedCompanion = useGameStore((s) => s.feedCompanion);
  const unlockAccessory = useGameStore((s) => s.unlockAccessory);
  const equipAccessory = useGameStore((s) => s.equipAccessory);

  const tier = companionTier(companionXp);
  const progress = companionProgress(companionXp);
  const xpInLevel = companionXpInLevel(companionXp);
  const equippedEmoji = ACCESSORIES.find((a) => a.id === equippedAccessory)?.emoji;

  const heartRef = useRef<LottieView>(null);
  const bounceAnim = useRef(new Animated.Value(1)).current;

  /** A little squish-bounce on the companion itself plus a heart popping
   * up above it — much quieter than the win confetti, but still gives
   * feeding a tactile "it worked" moment instead of just a number
   * changing. */
  function handleFeed() {
    if (!feedCompanion()) return;
    heartRef.current?.play();
    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: 1.18, duration: 90, useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 12 }),
    ]).start();
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('companion.title')}</Text>
            <PressableScale onPress={onClose} hitSlop={20}>
              <Text style={styles.close}>✕</Text>
            </PressableScale>
          </View>

          <View style={styles.showcase}>
            <View style={styles.heartLayer} pointerEvents="none">
              <LottieView ref={heartRef} source={heartPopSource} loop={false} autoPlay={false} style={styles.heart} />
            </View>
            <Animated.View style={[styles.companionRow, { transform: [{ scale: bounceAnim }] }]}>
              <Text style={styles.companionEmoji}>{tier.emoji}</Text>
              {equippedEmoji && <Text style={styles.accessoryOverlay}>{equippedEmoji}</Text>}
            </Animated.View>
            <Text style={styles.companionName}>{t(`tier.${tier.level}`)}</Text>
            <View style={styles.levelPill}>
              <Text style={styles.levelPillText}>
                {t('companion.level', { n: tier.level })}
                {tier.level >= COMPANION_MAX_LEVEL ? ' · ' + t('companion.max') : ` · ${xpInLevel.current}/${xpInLevel.needed} XP`}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>

            <PressableScale
              style={[styles.feedButton, brains < FEED_COST_BRAINS && styles.feedButtonDisabled]}
              onPress={handleFeed}
              disabled={brains < FEED_COST_BRAINS}
            >
              <Text style={styles.feedButtonText}>{t('companion.feed', { n: FEED_COST_BRAINS })}</Text>
            </PressableScale>
          </View>

          <Text style={styles.sectionTitle}>{t('companion.accessories')}</Text>
          <ScrollView contentContainerStyle={styles.grid}>
            {ACCESSORIES.map((item) => {
              const unlocked = unlockedAccessories.includes(item.id);
              const equipped = equippedAccessory === item.id;
              return (
                <PressableScale
                  key={item.id}
                  style={[styles.gridItem, equipped && styles.gridItemEquipped]}
                  onPress={() => {
                    if (unlocked) {
                      equipAccessory(equipped ? null : item.id);
                    } else {
                      unlockAccessory(item.id, item.cost);
                    }
                  }}
                >
                  <Text style={[styles.gridEmoji, !unlocked && styles.gridEmojiLocked]}>
                    {item.emoji}
                  </Text>
                  <Text style={styles.gridLabel}>
                    {unlocked ? t(`acc.${item.id}`) : `${item.cost} 🧠`}
                  </Text>
                  {equipped && (
                    <View style={styles.checkBadge}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
                </PressableScale>
              );
            })}
          </ScrollView>
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
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
  },
  close: {
    padding: 8,
    fontSize: 20,
    color: colors.ink,
  },
  showcase: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    paddingVertical: 20,
    marginBottom: 16,
    gap: 8,
    position: 'relative',
  },
  heartLayer: {
    position: 'absolute',
    top: -30,
    width: 120,
    height: 120,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heart: {
    width: '100%',
    height: '100%',
  },
  companionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  companionEmoji: {
    fontSize: 72,
  },
  accessoryOverlay: {
    fontSize: 32,
    marginBottom: 8,
  },
  levelPill: {
    alignSelf: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  levelPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.background,
  },
  companionName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.ink,
  },
  progressTrack: {
    width: '80%',
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 5,
  },
  feedButton: {
    marginTop: 8,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  feedButtonDisabled: {
    opacity: 0.4,
  },
  feedButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.inkSoft,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 4,
  },
  gridItem: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  gridItemEquipped: {
    borderWidth: 3,
    borderColor: colors.success,
  },
  gridEmoji: {
    fontSize: 26,
  },
  gridEmojiLocked: {
    opacity: 0.35,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.inkSoft,
  },
  checkBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
