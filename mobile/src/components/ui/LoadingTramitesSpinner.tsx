import React from 'react';
import { 
  ActivityIndicator, 
  StyleSheet, 
  Text, 
  View 
} from "react-native";

import { useTheme } from '@/hooks/useTheme';
import { useStyles } from '@/hooks/useStyles';

export const LoadingTramitesSpinner: React.FC = () => {
  const { colores } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <View style={styles.centerContainer}>
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size="large" color={colores.C_PRIMARY} />
      </View>
      <Text style={styles.loadingText}>Cargando trámites...</Text>
    </View>
  );
};

const createStyles = (colores: any) => StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colores.C_BG,
  },
  spinnerContainer: {
    backgroundColor: colores.C_SURFACE,
    padding: 16,
    borderRadius: 50,
    marginBottom: 16,
    // Sombras suaves
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingText: {
    color: colores.C_TEXT2,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5, 
  }
});