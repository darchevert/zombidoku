import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { useGameStore } from '../state/store';
import { useT } from '../i18n';
import { showRewardedAd } from '../utils/ads';
import {
  BONUS_EMOJI,
  TOMB_ODDS,
  TOMB_RULES,
  countBonuses,
  type Reward,
  type TombKind,
} from '../utils/rewards';
import { PressableScale } from './PressableScale';
import { PopCard } from './PopCard';
import { ShopModal } from './ShopModal';

const ADS_SUPPORTED = Platform.OS !== 'web';
const TOMB_EMOJI: Record<TombKind, string> = { small: '🪦', chest: '⚰️' };

interface TombsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TombsModal({ visible, onClose }: TombsModalProps) {
  const t = useT();
  const brains = useGameStore((s) => s.brains);
  const tombUsage = useGameStore((s) => s.tombUsage); // re-render when a tomb is used
  const tombDay = useGameStore((s) => s.tombDay);
  const tombStatus = useGameStore((s) => s.tombStatus);
  const openTomb = useGameStore((s) => s.openTomb);
  void tombUsage;
  void tombDay;

  const status = tombStatus();
  const [showShop, setShowShop] = useState(false);
  const [busy, setBusy] = useState<TombKind | null>(null);
  const [opening, setOpening] = useState<TombKind | null>(null);
  const [reveal, setReveal] = useState<{ kind: TombKind; reward: Reward } | null>(null);

  const shake = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setReveal(null);
      setOpening(null);
      setBusy(null);
    }
  }, [visible]);

  /** Shakes the tomb, then reveals what was inside. */
  function playOpening(kind: TombKind, reward: Reward) {
    setOpening(kind);
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: true }),
    ]).start(() => {
      setOpening(null);
      setReveal({ kind, reward });
      pop.setValue(0);
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 14 }).start();
    });
  }

  async function handleOpen(kind: TombKind, payment: 'free' | 'ad' | 'brains') {
    if (busy || opening) return;
    if (payment === 'brains' && brains < TOMB_RULES[kind].brainCost) {
      Alert.alert(t('game.noBrainsTitle'), t('game.noBrainsBody'));
      return;
    }
    setBusy(kind);
    if (payment === 'ad') {
      const rewarded = await showRewardedAd();
      if (!rewarded) {
        setBusy(null);
        Alert.alert(t('tombs.adFailed'));
        return;
      }
    }
    const reward = openTomb(kind, payment);
    setBusy(null);
    if (reward) playOpening(kind, reward);
  }

  /** The best way to open a tomb right now: free, then a rewarded ad. */
  function primary(kind: TombKind): { payment: 'free' | 'ad'; label: string } | null {
    if (kind === 'small' && status.smallFreeLeft > 0) return { payment: 'free', label: t('tombs.openFree') };
    const adLeft = kind === 'small' ? status.smallAdLeft : status.chestAdLeft;
    if (ADS_SUPPORTED && adLeft > 0) return { payment: 'ad', label: t('tombs.openAd') };
    return null;
  }

  function counters(kind: TombKind): string {
    const adLeft = kind === 'small' ? status.smallAdLeft : status.chestAdLeft;
    const parts: string[] = [];
    if (kind === 'small') parts.push(t('tombs.freeLeft', { n: Math.max(0, status.smallFreeLeft) }));
    if (ADS_SUPPORTED) parts.push(t('tombs.adLeft', { n: Math.max(0, adLeft) }));
    return parts.join(' · ');
  }

  function odds(kind: TombKind): string {
    const o = TOMB_ODDS[kind];
    return t('tombs.odds', {
      bonus: o.guaranteedBonuses,
      pct: Math.round(o.extraBonusChance * 100),
      next: kind === 'small' ? 2 : 3,
    });
  }

  const shakeRotate = shake.interpolate({
    inputRange: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    outputRange: ['0deg', '-8deg', '8deg', '-10deg', '10deg', '-12deg', '12deg', '-14deg', '14deg', '-6deg', '0deg'],
  });
  const shakeScale = shake.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <PopCard style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('tombs.title')}</Text>
            <View style={styles.brainsChip}>
              <Text style={styles.brainsText}>{brains} 🧠</Text>
            </View>
            <PressableScale onPress={onClose} hitSlop={20}>
              <Text style={styles.close}>✕</Text>
            </PressableScale>
          </View>

          {reveal ? (
            <Animated.View
              style={[
                styles.revealBox,
                { opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] },
              ]}
            >
              <Text style={styles.revealEmoji}>✨{TOMB_EMOJI[reveal.kind]}✨</Text>
              <Text style={styles.revealTitle}>{t('tombs.found')}</Text>
              <View style={styles.chips}>
                {reveal.reward.brains > 0 && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>+{reveal.reward.brains} 🧠</Text>
                  </View>
                )}
                {countBonuses(reveal.reward.bonuses).map(({ kind, n }) => (
                  <View key={kind} style={[styles.chip, styles.chipBonus]}>
                    <Text style={styles.chipText}>
                      +{n} {BONUS_EMOJI[kind]}
                    </Text>
                  </View>
                ))}
              </View>
              <PressableScale style={styles.primaryButton} onPress={() => setReveal(null)}>
                <Text style={styles.primaryText}>{t('tombs.ok')}</Text>
              </PressableScale>
            </Animated.View>
          ) : (
            (['small', 'chest'] as TombKind[]).map((kind) => {
              const main = primary(kind);
              const isOpening = opening === kind;
              return (
                <View key={kind} style={styles.tombCard}>
                  <Animated.Text
                    style={[
                      styles.tombEmoji,
                      isOpening && { transform: [{ rotate: shakeRotate }, { scale: shakeScale }] },
                    ]}
                  >
                    {TOMB_EMOJI[kind]}
                  </Animated.Text>
                  <View style={styles.tombInfo}>
                    <Text style={styles.tombName}>{t(kind === 'small' ? 'tombs.small' : 'tombs.chest')}</Text>
                    <Text style={styles.tombOdds}>{odds(kind)}</Text>
                    {counters(kind) !== '' && <Text style={styles.tombCounters}>{counters(kind)}</Text>}
                    <View style={styles.buttonsRow}>
                      {main && (
                        <PressableScale
                          style={[styles.primaryButton, styles.tombButton, main.payment === 'ad' && styles.adButton]}
                          disabled={!!busy || !!opening}
                          onPress={() => handleOpen(kind, main.payment)}
                        >
                          <Text style={[styles.primaryText, main.payment === 'ad' && styles.adText]}>
                            {main.payment === 'ad' ? '▶ ' : ''}
                            {main.label}
                          </Text>
                        </PressableScale>
                      )}
                      <PressableScale
                        style={[
                          styles.brainButton,
                          main && styles.tombButtonSmall,
                          brains < TOMB_RULES[kind].brainCost && styles.brainButtonOff,
                        ]}
                        disabled={!!busy || !!opening}
                        onPress={() => handleOpen(kind, 'brains')}
                      >
                        <Text style={styles.brainText}>{t('tombs.openBrains', { n: TOMB_RULES[kind].brainCost })}</Text>
                      </PressableScale>
                    </View>
                  </View>
                </View>
              );
            })
          )}
          {!reveal && ADS_SUPPORTED && (
            <PressableScale style={styles.shopButton} onPress={() => setShowShop(true)}>
              <Text style={styles.shopText}>🛒 {t('shop.title')}</Text>
            </PressableScale>
          )}
        </PopCard>
        <ShopModal visible={showShop} onClose={() => setShowShop(false)} />
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
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#6B4F7D',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
  },
  brainsChip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  brainsText: {
    fontSize: 14,
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
  tombCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  tombEmoji: {
    fontSize: 46,
  },
  tombInfo: {
    flex: 1,
    gap: 3,
  },
  tombName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.ink,
  },
  tombOdds: {
    fontSize: 12,
    color: colors.inkSoft,
  },
  tombCounters: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  buttonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: colors.accentDark,
  },
  tombButton: {
    flexGrow: 1,
  },
  adButton: {
    backgroundColor: colors.accentSecondary,
    borderBottomColor: '#B98B12',
  },
  primaryText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.background,
  },
  adText: {
    color: colors.ink,
  },
  brainButton: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.inkSoft,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    flexGrow: 1,
  },
  tombButtonSmall: {
    flexGrow: 0,
  },
  brainButtonOff: {
    opacity: 0.45,
  },
  brainText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
  },
  shopButton: {
    marginTop: 10,
    alignSelf: 'stretch',
    backgroundColor: colors.accentSecondary,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#B98B12',
  },
  shopText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.ink,
  },
  footnote: {
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  revealBox: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  revealEmoji: {
    fontSize: 60,
  },
  revealTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(63, 165, 90, 0.14)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  chipBonus: {
    backgroundColor: 'rgba(240, 194, 62, 0.28)',
  },
  chipText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.ink,
  },
});
