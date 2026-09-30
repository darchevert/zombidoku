import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
} from 'react-native';
import { Cell } from './Cell';
import { colors } from '../theme/colors';
import type { CellState } from '../engine/types';

interface BoardProps {
  size: number;
  regions: number[][];
  grid: CellState[][];
  conflictKeys: Set<string>;
  /** Cells the hint overlay has deduced can be marked ✕. */
  highlightXCells?: Array<{ row: number; col: number }>;
  /** The one cell the hint overlay has deduced must be the zombie. */
  highlightZombieCell?: { row: number; col: number } | null;
  /** True while the hint overlay is open — dims every cell that isn't
   * part of the current highlight, approximating "the screen goes dark
   * except what you could have spotted yourself". */
  dimBoard?: boolean;
  /** The cell the mouse bonus's bat is currently swooping onto, mid
   * appear-then-✕ animation. */
  critterCell?: { row: number; col: number } | null;
  /** Fired once for the cell under the finger when a press starts (also
   * covers a plain tap, which is just a gesture that never moves). */
  onCellGestureStart: (row: number, col: number) => void;
  /** Fired for each new cell the finger enters while still pressed. */
  onCellGestureMove: (row: number, col: number) => void;
  onCellGestureEnd: () => void;
  /** Changes whenever a genuinely new puzzle is loaded (not on every move)
   * — re-triggers the staggered reveal animation below. */
  revealKey: string | number;
  /** Upper bound (px) for the board's side, so the whole game screen fits
   * without scrolling whatever the screen height. */
  maxSize?: number;
}

const REVEAL_DURATION_MS = 700;

export function Board({
  size,
  regions,
  grid,
  conflictKeys,
  highlightXCells,
  highlightZombieCell,
  dimBoard,
  critterCell,
  onCellGestureStart,
  onCellGestureMove,
  onCellGestureEnd,
  revealKey,
  maxSize,
}: BoardProps) {
  const { width } = useWindowDimensions();
  // Larger grids need every pixel they can get for touch targets to stay
  // usable, so bigger boards claim more of the screen width.
  const margin = size >= 12 ? 16 : 24;
  const boardMax = 320 + size * 14;
  const boardSize = Math.min(width - margin * 2, boardMax, maxSize ?? Infinity);
  const cellSize = useMemo(() => Math.floor(boardSize / size), [boardSize, size]);
  const xHighlightKeys = useMemo(
    () => new Set((highlightXCells ?? []).map((p) => `${p.row},${p.col}`)),
    [highlightXCells]
  );

  const reveal = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    reveal.setValue(0);
    Animated.timing(reveal, {
      toValue: 1,
      duration: REVEAL_DURATION_MS,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealKey]);

  // Touch handling lives on the board as a whole (rather than per-cell
  // Pressables) so a press-and-drag can paint across many cells in one
  // gesture: React Native's responder system locks onto whichever view
  // first claims a touch and keeps sending it move events even as the
  // finger slides over sibling views, so individual Cell components would
  // never see a drag that started elsewhere. Refs hold the latest props/
  // layout so the PanResponder (created once) never closes over stale
  // values.
  const boardRef = useRef<View>(null);
  const boardOrigin = useRef({ x: 0, y: 0 });
  const lastGestureCell = useRef<{ row: number; col: number } | null>(null);
  const propsRef = useRef({ size, cellSize, onCellGestureStart, onCellGestureMove, onCellGestureEnd });
  propsRef.current = { size, cellSize, onCellGestureStart, onCellGestureMove, onCellGestureEnd };

  function measureOrigin() {
    boardRef.current?.measureInWindow((x, y) => {
      boardOrigin.current = { x, y };
    });
  }

  function cellAt(pageX: number, pageY: number): { row: number; col: number } | null {
    const { size, cellSize } = propsRef.current;
    if (!cellSize) return null;
    const col = Math.floor((pageX - boardOrigin.current.x) / cellSize);
    const row = Math.floor((pageY - boardOrigin.current.y) / cellSize);
    if (row < 0 || row >= size || col < 0 || col >= size) return null;
    return { row, col };
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        // On web, a mousedown-then-drag over text nodes (the X/cat glyphs)
        // starts a native text-selection/drag gesture unless suppressed.
        // That doesn't break the *first* drag, but leaves the page in a
        // selection state that hijacks the *next* mousedown into a native
        // "drag the selection" operation instead of firing our move
        // handler — preventDefault here stops the selection from ever
        // starting.
        evt.preventDefault?.();
        measureOrigin();
        const { pageX, pageY } = evt.nativeEvent;
        const cell = cellAt(pageX, pageY);
        lastGestureCell.current = cell;
        if (cell) propsRef.current.onCellGestureStart(cell.row, cell.col);
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        evt.preventDefault?.();
        const { pageX, pageY } = evt.nativeEvent;
        const cell = cellAt(pageX, pageY);
        if (!cell) return;
        const last = lastGestureCell.current;
        if (last && last.row === cell.row && last.col === cell.col) return;
        lastGestureCell.current = cell;
        propsRef.current.onCellGestureMove(cell.row, cell.col);
      },
      onPanResponderRelease: () => {
        lastGestureCell.current = null;
        propsRef.current.onCellGestureEnd();
      },
      onPanResponderTerminate: () => {
        lastGestureCell.current = null;
        propsRef.current.onCellGestureEnd();
      },
    })
  ).current;

  return (
    <View
      ref={boardRef}
      onLayout={measureOrigin}
      style={[styles.board, { width: cellSize * size }]}
      {...panResponder.panHandlers}
    >
      {grid.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((cellState, c) => {
            // Cells wake up in a diagonal-ish sweep (row+col order) rather
            // than strict reading order, which reads more like a ripple
            // than a typewriter.
            const index = r + c;
            const maxIndex = 2 * (size - 1) || 1;
            const start = (index / maxIndex) * 0.55;
            const end = Math.min(1, start + 0.45);
            const opacity = reveal.interpolate({
              inputRange: [start, end],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            });
            const scale = reveal.interpolate({
              inputRange: [start, end],
              outputRange: [0.4, 1],
              extrapolate: 'clamp',
            });
            // A small rise-from-below on top of the fade/scale — cells
            // feel like they're climbing into place rather than just
            // materializing, a nod to the zombie theme.
            const translateY = reveal.interpolate({
              inputRange: [start, end],
              outputRange: [16, 0],
              extrapolate: 'clamp',
            });
            const isZombieHighlight = highlightZombieCell?.row === r && highlightZombieCell?.col === c;
            const isXHighlight = xHighlightKeys.has(`${r},${c}`);
            const highlight = isZombieHighlight ? 'zombie' : isXHighlight ? 'x' : null;
            return (
              <Animated.View key={c} style={{ opacity, transform: [{ scale }, { translateY }] }}>
                <Cell
                  state={cellState}
                  regionId={regions[r][c]}
                  conflict={conflictKeys.has(`${r},${c}`)}
                  highlight={highlight}
                  dimmed={!!dimBoard && !highlight}
                  showCritter={critterCell?.row === r && critterCell?.col === c}
                  size={cellSize}
                />
              </Animated.View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'center',
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
  },
});
