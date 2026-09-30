import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

export interface CelebrationTrigger {
  /** Bumped on every trigger so the same word picked twice in a row still
   * replays the animation. */
  id: number;
  word: string;
}

interface CelebrationProps {
  trigger: CelebrationTrigger | null;
}

const HOLD_MS = 950;
const FADE_MS = 220;

/** A gold pill ("👏 Excellent ! 👏") that pops over the top of the board when
 * a zombie is correctly guessed. Solid background and border so it reads on
 * any cell color, and drawn above the board; it never blocks input. */
export function Celebration({ trigger }: CelebrationProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const [word, setWord] = useState<string | null>(null);

  useEffect(() => {
    if (!trigger) return;
    setWord(trigger.word);
    anim.setValue(0);
    Animated.sequence([
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 14 }),
      Animated.delay(HOLD_MS),
      Animated.timing(anim, { toValue: 0, duration: FADE_MS, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setWord(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger?.id]);

  if (!word) return null;

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { opacity: anim, transform: [{ scale }, { translateY }] }]}
    >
      <Animated.View style={styles.pill}>
        <Text style={styles.clap}>👏</Text>
        <Text style={styles.word}>{word}</Text>
        <Text style={styles.clap}>👏</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
    elevation: 50,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accentSecondary,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#B98B12',
    paddingVertical: 6,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  clap: {
    fontSize: 22,
  },
  word: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: 0.3,
  },
});
