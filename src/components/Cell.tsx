import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, regionColor } from '../theme/colors';
import type { CellState } from '../engine/types';
import { useT } from '../i18n';

interface CellProps {
  state: CellState;
  regionId: number;
  conflict: boolean;
  /** 'x' = this cell can be safely marked ✕ (deduced from the visible
   * board, not the hidden solution); 'zombie' = this is the one cell
   * this row/column/cemetery has left, i.e. the zombie's spot. */
  highlight?: 'x' | 'zombie' | null;
  /** Everything not part of the current hint's highlight dims — the
   * "the rest of the screen goes dark" effect, done per-cell rather
   * than as one screen-wide mask (see GameScreen for why). */
  dimmed?: boolean;
  /** The mouse bonus's bat flies onto this cell and back off before the
   * ✕ actually lands — this cell is mid-animation, not yet marked. */
  showCritter?: boolean;
  size: number;
}

/** A chunky, rounded-stroke X built from two crossed bars, matching the
 * reference game's thick icon-style cross rather than a thin text glyph. */
function XMark({ size, color }: { size: number; color: string }) {
  const barLength = size * 0.62;
  const barThickness = Math.max(4, size * 0.17);
  const barStyle = {
    position: 'absolute' as const,
    width: barLength,
    height: barThickness,
    borderRadius: barThickness / 2,
    backgroundColor: color,
  };
  return (
    <View style={styles.markWrap} pointerEvents="none">
      <View style={[barStyle, { transform: [{ rotate: '45deg' }] }]} />
      <View style={[barStyle, { transform: [{ rotate: '-45deg' }] }]} />
    </View>
  );
}

/** A bat that pops in, hangs for a moment, then pops back out — the
 * mouse bonus's "something swoops in and marks this cell" flourish. */
function CritterPop({ size }: { size: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 14 }),
      Animated.delay(220),
      Animated.timing(anim, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start();
  }, []);
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  return (
    <Animated.Text
      style={[styles.critter, { fontSize: size * 0.56, opacity: anim, transform: [{ scale }] }]}
      pointerEvents="none"
    >
      🦇
    </Animated.Text>
  );
}

/** Purely presentational — the whole board's touches are handled by a
 * single PanResponder in Board (so a press-and-drag can paint across
 * cells), so this has no onPress of its own. */
export function Cell({ state, regionId, conflict, highlight, dimmed, showCritter, size }: CellProps) {
  const t = useT();
  const bg = regionColor(regionId);
  const gap = Math.max(1.5, size * 0.035);
  const radius = size * 0.22;
  const isWrong = state === 'wrong';

  // The hint highlight pulses rather than sitting as a static border —
  // a fixed ring is easy to miss on a busy board, a breathing one draws
  // the eye without being distracting.
  const pulseAnim = useRef(new Animated.Value(0.1)).current;
  useEffect(() => {
    if (!highlight) return;
    pulseAnim.setValue(0.1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [highlight]);

  return (
    <View
      style={[styles.hitArea, { width: size, height: size, padding: gap }]}
      accessible
      accessibilityLabel={
        state === 'zombie'
          ? t('cell.zombie')
          : state === 'wrong'
          ? t('cell.wrong')
          : state === 'x'
          ? t('cell.x')
          : t('cell.empty')
      }
    >
      <View
        style={[styles.inner, { backgroundColor: bg, borderRadius: radius }, conflict && styles.conflict]}
      >
        {state === 'zombie' && (
          <Text style={[styles.zombieEmoji, { fontSize: size * 0.58 }]}>🧟</Text>
        )}
        {state === 'x' && <XMark size={size} color="rgba(255,255,255,0.92)" />}
        {isWrong && <XMark size={size} color={colors.danger} />}
        {showCritter && <CritterPop size={size} />}
        {/* Ghost preview of what "Appliquer" will place, fading in and out
         * on the same pulse as the ring. */}
        {highlight === 'x' && state === 'empty' && (
          <Animated.View style={[styles.markWrap, styles.ghost, { opacity: pulseAnim }]} pointerEvents="none">
            <XMark size={size} color="rgba(255,255,255,0.92)" />
          </Animated.View>
        )}
        {highlight === 'zombie' && state !== 'zombie' && (
          <Animated.Text
            style={[styles.zombieEmoji, styles.ghost, { fontSize: size * 0.58, opacity: pulseAnim }]}
            pointerEvents="none"
          >
            🧟
          </Animated.Text>
        )}
        {highlight && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.hintRing,
              {
                borderRadius: radius,
                opacity: pulseAnim,
                borderColor: highlight === 'zombie' ? colors.accentSecondary : colors.accentDark,
              },
            ]}
          />
        )}
        {dimmed && <View pointerEvents="none" style={[styles.dimOverlay, { borderRadius: radius }]} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conflict: {
    borderWidth: 3,
    borderColor: colors.danger,
  },
  hintRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
  },
  dimOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 6, 16, 0.72)',
  },
  markWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zombieEmoji: {
    textAlign: 'center',
  },
  critter: {
    position: 'absolute',
  },
  ghost: {
    position: 'absolute',
  },
});
