import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { SettingsModal } from './src/components/SettingsModal';
import { colors } from './src/theme/colors';

type Screen = 'home' | 'game' | 'daily';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [showSettings, setShowSettings] = useState(false);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {screen === 'home' ? (
          <HomeScreen onPlay={() => setScreen('game')} onPlayDaily={() => setScreen('daily')} />
        ) : (
          <GameScreen
            daily={screen === 'daily'}
            onBack={() => setScreen('home')}
            onSettings={() => setShowSettings(true)}
          />
        )}
        <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
        <StatusBar style="light" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
