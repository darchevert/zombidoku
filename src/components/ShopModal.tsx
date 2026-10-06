import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { useGameStore } from '../state/store';
import { useT } from '../i18n';
import { buyItem, hasRemovedAds, loadShop, type ShopItem, type ShopState } from '../utils/purchases';
import { PressableScale } from './PressableScale';
import { PopCard } from './PopCard';

interface ShopModalProps {
  visible: boolean;
  onClose: () => void;
}

/** What a product contains, as short chips text: "+60 🧠", "+5 💡 +5 🧟 +5 🦇". */
function contents(item: ShopItem): string {
  const g = item.grant;
  return [
    g.brains > 0 ? `+${g.brains} 🧠` : '',
    g.hints > 0 ? `+${g.hints} 💡` : '',
    g.autoCats > 0 ? `+${g.autoCats} 🧟` : '',
    g.mice > 0 ? `+${g.mice} 🦇` : '',
  ]
    .filter(Boolean)
    .join('  ');
}

export function ShopModal({ visible, onClose }: ShopModalProps) {
  const t = useT();
  const grantPurchase = useGameStore((s) => s.grantPurchase);
  const adsRemoved = useGameStore((s) => s.adsRemoved);
  const setAdsRemoved = useGameStore((s) => s.setAdsRemoved);
  const [restoring, setRestoring] = useState(false);
  const [state, setState] = useState<ShopState | 'loading'>('loading');
  const [items, setItems] = useState<ShopItem[]>([]);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setState('loading');
    loadShop().then((shop) => {
      if (cancelled) return;
      setItems(shop.items);
      setState(shop.state);
    });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  async function handleBuy(item: ShopItem) {
    if (buying) return;
    setBuying(item.id);
    const result = await buyItem(item);
    setBuying(null);
    if (result.status === 'success') {
      grantPurchase(item.id, result.transactionId);
      Alert.alert(t('shop.thanks'), item.removeAds ? t('shop.removeAds') : contents(item));
    } else if (result.status === 'error') {
      Alert.alert(t('shop.error'));
    }
  }

  async function handleRestore() {
    if (restoring) return;
    setRestoring(true);
    const bought = await hasRemovedAds(true);
    setRestoring(false);
    if (bought) setAdsRemoved();
    Alert.alert(bought ? t('shop.restored') : t('shop.nothingToRestore'));
  }

  // "Remove ads" disappears from the shop once it is bought.
  const shown = items.filter((item) => !(item.removeAds && adsRemoved));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <PopCard style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>🛒 {t('shop.title')}</Text>
            <PressableScale onPress={onClose} hitSlop={20}>
              <Text style={styles.close}>✕</Text>
            </PressableScale>
          </View>

          {state === 'loading' && <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />}
          {state === 'unavailable' && <Text style={styles.empty}>{t('shop.unavailable')}</Text>}
          {state === 'ready' && (
            <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
              {shown.map((item) => (
                <View key={item.id} style={styles.product}>
                  <Text style={styles.emoji}>{item.emoji}</Text>
                  <Text style={styles.name}>{t(item.titleKey)}</Text>
                  <Text style={styles.content}>{item.removeAds ? t('shop.removeAdsDesc') : contents(item)}</Text>
                  <PressableScale
                    style={styles.buy}
                    disabled={!!buying}
                    onPress={() => handleBuy(item)}
                  >
                    {buying === item.id ? (
                      <ActivityIndicator color={colors.background} />
                    ) : (
                      <Text style={styles.buyText}>{item.priceString}</Text>
                    )}
                  </PressableScale>
                </View>
              ))}
            </ScrollView>
          )}
          <PressableScale onPress={handleRestore} disabled={restoring}>
            <Text style={styles.restore}>{restoring ? '…' : t('shop.restore')}</Text>
          </PressableScale>
          <Text style={styles.footnote}>{t('shop.fixed')}</Text>
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
    maxHeight: '92%',
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
    marginBottom: 10,
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
  loader: {
    marginVertical: 40,
  },
  empty: {
    fontSize: 15,
    color: colors.inkSoft,
    textAlign: 'center',
    marginVertical: 30,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    paddingBottom: 6,
  },
  product: {
    width: '47%',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  emoji: {
    fontSize: 34,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  content: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
    textAlign: 'center',
    minHeight: 30,
  },
  buy: {
    alignSelf: 'stretch',
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: colors.accentDark,
  },
  buyText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.background,
  },
  restore: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 10,
  },
  footnote: {
    fontSize: 11,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 8,
  },
});
