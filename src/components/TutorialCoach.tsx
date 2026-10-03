import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { PressableScale } from './PressableScale';

interface TutorialCoachProps {
  /** The zombie coach's message. */
  text: string;
  /** Emphasise the message (the player touched something that isn't asked for). */
  nudge?: boolean;
  /** Optional button under the message. */
  buttonLabel?: string;
  onButton?: () => void;
}

/** The speech bubble that guides the first levels: what to do next, why. */
export function TutorialCoach({ text, nudge, buttonLabel, onButton }: TutorialCoachProps) {
  return (
    <View style={[styles.card, nudge && styles.cardNudge]}>
      <Text style={styles.avatar}>🧟</Text>
      <View style={styles.body}>
        <Text style={styles.text}>{text}</Text>
        {buttonLabel && onButton && (
          <PressableScale style={styles.button} onPress={onButton}>
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </PressableScale>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.accentSecondary,
    padding: 12,
    marginHorizontal: 4,
  },
  cardNudge: {
    borderColor: colors.accent,
  },
  avatar: {
    fontSize: 30,
  },
  body: {
    flex: 1,
    gap: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    color: colors.ink,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderBottomWidth: 3,
    borderBottomColor: colors.accentDark,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.background,
  },
});
