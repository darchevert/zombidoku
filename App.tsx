import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { SettingsModal } from './src/components/SettingsModal';
import { colors } from './src/theme/colors';

SplashScreen.preventAutoHideAsync();

type Screen = 'home' | 'game' | 'daily';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [showSettings, setShowSettings] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const onLayout = useCallback(async () => {
    if (ready) await SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <View style={styles.root} onLayout={onLayout}>
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
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
