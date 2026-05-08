import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { useBiometric } from '../hooks/useBiometric';
import { Lock, Fingerprint, Eye, EyeOff } from 'lucide-react-native';

const C_BG = "#0f1724";
const C_SURFACE = "#182136";
const C_CARD = "#1e2a42";
const C_PRIMARY = "#00bfa5";
const C_RED = "#ef5350";
const C_TEXT = "#eceff1";
const C_TEXT2 = "#90a4ae";

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [cuit, setCuit] = useState('');
  const [cit, setCit] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBiometricButton, setShowBiometricButton] = useState(false);

  const { setCuit: storeCuit, setCit: storeCit, setIsLoggedIn } = useStore();
  const { checkBiometricAvailability, authenticate, isLoading: bioLoading } = useBiometric();

  useEffect(() => {
    checkBiometricAvailability().then((result) => {
      setShowBiometricButton(result.available);
    });
  }, [checkBiometricAvailability]);

  const handleBiometricLogin = async () => {
    const authResult = await authenticate();
    if (authResult.success) {
      try {
        const savedCuit = await SecureStore.getItemAsync('cuit');
        const savedCit = await SecureStore.getItemAsync('cit');
        
        if (savedCuit && savedCit) {
          storeCuit(savedCuit);
          storeCit(savedCit);
          setIsLoggedIn(true);
          await AsyncStorage.setItem('isLoggedIn', 'true');
          onLoginSuccess();
        } else {
          Alert.alert('Error', 'No hay credenciales guardadas');
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudieron obtener las credenciales');
      }
    } else {
      Alert.alert('Autenticación', authResult.error || 'La autenticación falló');
    }
  };

  const handleLogin = async () => {
    if (!cuit.trim() || !cit.trim()) {
      Alert.alert('Error', 'Por favor completa CUIT y CIT');
      return;
    }

    setIsLoading(true);
    try {
      await SecureStore.setItemAsync('cuit', cuit);
      await SecureStore.setItemAsync('cit', cit);
      
      storeCuit(cuit);
      storeCit(cit);
      setIsLoggedIn(true);
      await AsyncStorage.setItem('isLoggedIn', 'true');
      
      onLoginSuccess();
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar las credenciales');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C_BG} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <View style={styles.header}>
          <Lock size={48} color={C_PRIMARY} />
          <Text style={styles.title}>AgrimensAPP</Text>
          <Text style={styles.subtitle}>Sistema de Monitoreo de Trámites ARBA</Text>
        </View>

        <View style={styles.card}>
          {showBiometricButton && !bioLoading && (
            <>
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                disabled={bioLoading}
              >
                <Fingerprint size={40} color={C_PRIMARY} />
                <Text style={styles.biometricText}>
                  {bioLoading ? 'Autenticando...' : 'Ingresar con Huella/Rostro'}
                </Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>O</Text>
                <View style={styles.line} />
              </View>
            </>
          )}

          <Text style={styles.label}>CUIT</Text>
          <TextInput
            style={styles.input}
            placeholder="23123456780"
            placeholderTextColor={C_TEXT2}
            value={cuit}
            onChangeText={setCuit}
            editable={!isLoading}
            keyboardType="numeric"
            maxLength={11}
          />

          <Text style={styles.label}>CIT (Contraseña)</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Contraseña"
              placeholderTextColor={C_TEXT2}
              value={cit}
              onChangeText={setCit}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff size={20} color={C_TEXT2} />
              ) : (
                <Eye size={20} color={C_TEXT2} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={C_BG} />
            ) : (
              <Text style={styles.loginButtonText}>GUARDAR Y CONTINUAR</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.warningText}>
            ⚠️ Tus credenciales se guardan de forma segura en el dispositivo
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C_BG,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: C_TEXT,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: C_TEXT2,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: C_CARD,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  biometricButton: {
    backgroundColor: C_SURFACE,
    borderColor: C_PRIMARY,
    borderWidth: 2,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  biometricText: {
    color: C_TEXT,
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: C_TEXT2,
  },
  dividerText: {
    marginHorizontal: 12,
    color: C_TEXT2,
    fontSize: 14,
  },
  label: {
    color: C_TEXT,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: C_SURFACE,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: C_TEXT,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C_SURFACE,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    color: C_TEXT,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: C_PRIMARY,
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 24,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: C_BG,
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningText: {
    color: C_TEXT2,
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
});
