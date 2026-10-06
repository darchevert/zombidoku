import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';
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
  const card = useRef(new Animated.Value(0)).current;
  const content = useRef(new Animated.Value(0)).current;
  const wobble = useRef(new Animated.Value(0)).current;
  const brains = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    card.setValue(0);
    content.setValue(0);
    brains.forEach((b) => b.setValue(0));
    Animated.parallel([
      Animated.spring(card, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 12 }),
      Animated.timing(content, { toValue: 1, duration: 400, delay: 250, useNativeDriver: true }),
      ...brains.map((b, i) =>
        Animated.timing(b, { toValue: 1, duration: 450, delay: 500 + i * 250, easing: Easing.in(Easing.quad), useNativeDriver: true })
      ),
    ]).start();
    const loops = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(wobble, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(wobble, { toValue: -1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(wobble, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [visible]);

  const tilt = wobble.interpolate({ inputRange: [-1, 1], outputRange: ['-9deg', '9deg'] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: card,
              transform: [
                { translateY: card.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) },
                { scale: card.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
              ],
            },
          ]}
        >
          <Animated.Text style={[styles.emoji, { transform: [{ rotate: tilt }] }]}>🧟</Animated.Text>
          <View style={styles.brainsRow}>
            {brains.map((b, i) => (
              <Animated.Text
                key={i}
                style={[
                  styles.brain,
                  {
                    opacity: b.interpolate({ inputRange: [0, 1], outputRange: [1, 0.2] }),
                    transform: [
                      { translateY: b.interpolate({ inputRange: [0, 1], outputRange: [0, 14] }) },
                      { rotate: b.interpolate({ inputRange: [0, 1], outputRange: ['0deg', i % 2 ? '25deg' : '-25deg'] }) },
                    ],
                  },
                ]}
              >
                🧠
              </Animated.Text>
            ))}
          </View>
          <Text style={styles.title}>{title}</Text>
          <Animated.View style={{ opacity: content, alignItems: 'center', width: '100%' }}>
            <Text style={styles.subtitle}>{t('lose.subtitle')}</Text>
            <Text style={styles.encourage}>{t('lose.encourage')}</Text>
            <Animated.View style={{ width: '100%', transform: [{ scale: pulseScale }] }}>
              <PressableScale style={styles.primaryButton} onPress={onRetry}>
                <Text style={styles.primaryButtonText}>{t('common.retry')}</Text>
              </PressableScale>
            </Animated.View>
            <PressableScale style={styles.secondaryButton} onPress={onHome}>
              <Text style={styles.secondaryButtonText}>{t('common.home')}</Text>
            </PressableScale>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 6, 16, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: colors.danger,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: 'center',
    shadowColor: colors.danger,
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  emoji: {
    fontSize: 72,
  },
  brainsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
    height: 36,
  },
  brain: {
    fontSize: 26,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.inkSoft,
    marginTop: 6,
    textAlign: 'center',
  },
  encourage: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
    marginTop: 6,
    marginBottom: 16,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 15,
    borderRadius: 999,
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: colors.accentDark,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '900',
  },
  secondaryButton: {
    paddingVertical: 12,
    marginTop: 2,
  },
  secondaryButtonText: {
    color: colors.inkSoft,
    fontSize: 15,
    fontWeight: '600',
  },
});
