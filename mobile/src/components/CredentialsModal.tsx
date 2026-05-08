import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useStore } from '../store/useStore';
import { X, LogOut, User } from 'lucide-react-native';

const C_BG = "#0f1724";
const C_SURFACE = "#182136";
const C_CARD = "#1e2a42";
const C_PRIMARY = "#00bfa5";
const C_RED = "#ef5350";
const C_TEXT = "#eceff1";
const C_TEXT2 = "#90a4ae";
const C_WHITE = "#ffffff";

interface CredentialsModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const CredentialsModal: React.FC<CredentialsModalProps> = ({
  visible,
  onClose,
  onLogout,
}) => {
  const { cuit, logout } = useStore();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar la sesión?',
      [
        { 
          text: 'Cancelar', 
          onPress: () => {}, 
          style: 'cancel' 
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive', 
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('isLoggedIn');
              await SecureStore.deleteItemAsync('cuit');
              await SecureStore.deleteItemAsync('cit');
              logout();
              onLogout();
              onClose();
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar la sesión');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
          <TouchableOpacity 
            onPress={onClose} 
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <X size={28} color={C_TEXT} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.profileCard}>
            <View style={styles.iconContainer}>
              <User size={40} color={C_PRIMARY} />
            </View>
            <Text style={styles.cuitLabel}>CUIT:</Text>
            <Text style={styles.cuitValue}>{cuit}</Text>
            <Text style={styles.credentialNote}>
              Credencial guardada de forma segura en tu dispositivo
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Seguridad</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🔐 Estado:</Text>
              <Text style={styles.infoValue}>Sesión Activa</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>💾 Almacenamiento:</Text>
              <Text style={styles.infoValue}>Local (Encriptado)</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={20} color={C_WHITE} />
          <Text style={styles.logoutButtonText}>CERRAR SESIÓN</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C_BG,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: C_CARD,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: C_TEXT,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    backgroundColor: C_CARD,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderTopColor: C_PRIMARY,
    borderTopWidth: 3,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C_SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cuitLabel: {
    fontSize: 12,
    color: C_TEXT2,
    fontWeight: '600',
    marginTop: 8,
  },
  cuitValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: C_PRIMARY,
    marginTop: 4,
    marginBottom: 12,
  },
  credentialNote: {
    fontSize: 12,
    color: C_TEXT2,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: C_CARD,
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: C_TEXT,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomColor: C_SURFACE,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: C_TEXT2,
  },
  infoValue: {
    fontSize: 13,
    color: C_PRIMARY,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: C_RED,
    borderRadius: 8,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: C_WHITE,
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});