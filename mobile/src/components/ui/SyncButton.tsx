import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { RefreshCw, X } from 'lucide-react-native';
import { useStore } from '@/store/useStore';

const C_PRIMARY = "#00bfa5";
const C_RED = "#ef5350";
const C_BG = "#0f1724";

interface SyncButtonProps {
  onSync: () => void;
  onCancel: () => void;
}

export const SyncButton: React.FC<SyncButtonProps> = ({ onSync, onCancel }) => {
  const { isSyncing } = useStore();

  return (
    <TouchableOpacity
      style={[styles.fab, isSyncing && styles.buttonSyncing]}
      onPress={isSyncing ? onCancel : onSync}
      activeOpacity={0.8}
    >
      {isSyncing ? (
        <X size={24} color={C_BG} />
      ) : (
        <RefreshCw size={24} color={C_BG} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 60,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonSyncing: {
    backgroundColor: C_RED,
  },
});