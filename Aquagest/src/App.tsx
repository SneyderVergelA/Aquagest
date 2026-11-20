import 'react-native-gesture-handler';
import React from 'react';
import { Alert, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './context/AuthContext';
import { Navigation } from './navigation';
import AvisoHost from './components/AvisoHost';

// En el navegador Alert.alert no hace nada: se reemplaza por los cuadros del navegador
if (Platform.OS === 'web') {
  (Alert as any).alert = (titulo: string, mensaje?: string, botones?: any[]) => {
    const texto = [titulo, mensaje].filter(Boolean).join('\n\n');
    if (botones && botones.length > 1) {
      const aceptar = botones.find((b) => b.style !== 'cancel');
      const cancelar = botones.find((b) => b.style === 'cancel');
      if (window.confirm(texto)) aceptar?.onPress?.();
      else cancelar?.onPress?.();
    } else {
      window.alert(texto);
      botones?.[0]?.onPress?.();
    }
  };
}

export function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="light" />
        <View style={{ flex: 1 }}>
          <Navigation />
          <AvisoHost />
        </View>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
