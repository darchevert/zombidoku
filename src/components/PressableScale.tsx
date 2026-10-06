import React, { useRef } from 'react';
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/** A drop-in Pressable that scales down slightly on press and springs
 * back on release — the tactile "button" feedback used everywhere in the
 * app instead of the flatter opacity-only default.
 *
 * Animates the Pressable itself (via Animated.createAnimatedComponent)
 * rather than wrapping it in a second styled box: an earlier version
 * duplicated `style` onto both an outer Pressable and an inner
 * Animated.View, which doubled up any padding-driven sizing (e.g. a pill
 * button with paddingHorizontal) into a visibly nested "pill inside a
 * pill". A single animated element has no such layering to get wrong. */
export function PressableScale({
  scaleTo = 0.94,
  style,
  onPressIn,
  onPressOut,
  disabled,
  children,
  ...rest
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn(e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
    onPressIn?.(e);
  }

  function handlePressOut(e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
    onPressOut?.(e);
  }

  return (
    <AnimatedPressable
      style={[style, { transform: [{ scale }] }]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
