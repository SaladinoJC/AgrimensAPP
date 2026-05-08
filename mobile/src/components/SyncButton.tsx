import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { RefreshCw, X } from 'lucide-react-native';
import { useStore } from '../store/useStore';

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
      disabled={false}
    >
      {isSyncing ? (
        <>
          {/* <ActivityIndicator color={C_BG} size={20} /> */}
          <X size={20} color={C_BG} />
        </>
      ) : (
        <>
          <RefreshCw size={20} color={C_BG} />
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonSyncing: {
    backgroundColor: C_RED,
  },
  text: {
    color: C_BG,
    marginHorizontal: 8,
    fontWeight: 'bold',
    fontSize: 14,
  },
  textCancel: {
    fontSize: 12,
  },
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
    elevation: 5, 
    zIndex: 1
  },
});
