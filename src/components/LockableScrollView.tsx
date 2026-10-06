import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Platform, ScrollView, type ScrollViewProps } from 'react-native';

export interface LockableScrollViewHandle {
  lock: (locked: boolean) => void;
}

/** A ScrollView whose scrolling can be frozen from outside (the board
 * paints under the finger instead of scrolling the page). The lock lives
 * in this wrapper's own state, so toggling it re-renders only the wrapper:
 * `children` keeps the same element identity, so React skips the screen
 * content and nothing on the board flickers. */
export const LockableScrollView = forwardRef<LockableScrollViewHandle, ScrollViewProps>(
  function LockableScrollView(props, ref) {
    const [locked, setLocked] = useState(false);
    // On web a mouse drag never scrolls the page, and disabling scrolling
    // there hides the scrollbar, which shifts the layout on every click.
    useImperativeHandle(ref, () => ({ lock: (l: boolean) => Platform.OS !== 'web' && setLocked(l) }), []);
    return <ScrollView {...props} scrollEnabled={!locked} />;
  }
);
