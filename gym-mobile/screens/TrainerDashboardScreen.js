import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { themes } from '../Theme';

export default function TrainerDashboardScreen({ navigation }) {
  const theme = themes.dark;

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgMainDark }]}>
      <View style={styles.content}>
        <Ionicons name="stopwatch" size={60} color={theme.accentColor} />
        <Text style={[styles.text, { color: theme.textPrimary }]}>Panel de Entrenador</Text>
        <Text style={[styles.subtext, { color: theme.textSecondary }]}>Próximamente</Text>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.dangerColor }]} 
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', padding: 20 },
  text: { fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  subtext: { fontSize: 16, marginTop: 10, marginBottom: 40 },
  button: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: 'bold' }
});