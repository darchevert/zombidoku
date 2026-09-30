import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { colors } from '../theme/colors';
import { PressableScale } from './PressableScale';
import { useT } from '../i18n';

const confettiSource = require('../../assets/lottie/confetti.json');

interface WinModalProps {
  visible: boolean;
  title: string;
  scoreEarned: number;
  brainsEarned: number;
  primaryLabel: string;
  onPrimary: () => void;
  /** Omit to show only the primary button (e.g. the daily challenge,
   * which has no "next level" to skip past). */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Only shown when timer mode is on. */
  elapsedSeconds?: number;
  isNewRecord?: boolean;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function WinModal({
  visible,
  title,
  scoreEarned,
  brainsEarned,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  elapsedSeconds,
  isNewRecord,
}: WinModalProps) {
  const t = useT();
  const confettiRef = useRef<LottieView>(null);
  const cardScale = useRef(new Animated.Value(0.7)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    confettiRef.current?.play();
    cardScale.setValue(0.7);
    cardOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 140, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }),
    ]).start();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.confettiLayer} pointerEvents="none">
          <LottieView
            ref={confettiRef}
            source={confettiSource}
            loop={false}
            autoPlay={false}
            style={styles.confetti}
          />
        </View>
        <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.emoji}>🧟🎉</Text>
          <View style={styles.rewardsRow}>
            <Text style={styles.reward}>{t('win.points', { n: scoreEarned })}</Text>
            <Text style={styles.reward}>+{brainsEarned} 🧠</Text>
          </View>
          {elapsedSeconds !== undefined && (
            <Text style={styles.timeText}>
              {t('win.time', { t: formatTime(elapsedSeconds) })}
              {isNewRecord ? t('win.record') : ''}
            </Text>
          )}
          <PressableScale style={styles.primaryButton} onPress={onPrimary}>
            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
          </PressableScale>
          {secondaryLabel && onSecondary && (
            <PressableScale style={styles.secondaryButton} onPress={onSecondary}>
              <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
            </PressableScale>
          )}
        </Animated.View>
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
  confettiLayer: {
    position: 'absolute',
    width: 380,
    height: 380,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confetti: {
    width: '100%',
    height: '100%',
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
  rewardsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 8,
  },
  reward: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.inkSoft,
    marginTop: -6,
    marginBottom: 4,
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
