import React, { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

/** The card of a popup: springs in (scale + fade) when the popup opens, so
 * every popup shares the same lively entrance instead of just appearing. */
export function PopCard({ style, children }: { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }).start();
  }, []);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim.interpolate({ inputRange: [0, 0.6], outputRange: [0, 1], extrapolate: 'clamp' }),
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
