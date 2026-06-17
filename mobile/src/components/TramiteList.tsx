import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Text,
} from 'react-native';
import { FileQuestion } from 'lucide-react-native';

import { useStore } from '@/store/useStore';
import { getTramites } from '@/db/database';
import { TramiteCard } from '@/components/ui/TramiteCard';
import { TramiteDetailModal } from '@/components/TramiteDetailModal';
import { LoadingTramitesSpinner } from '@/components/ui/LoadingTramitesSpinner';

import { useTheme } from '@/hooks/useTheme';
import { useStyles } from '@/hooks/useStyles';

interface TramiteListProps {
  isLoading?: boolean;
}

export const TramiteList: React.FC<TramiteListProps> = ({ isLoading = false }) => {
  const filtros = useStore((state) => state.filtros);
  const paginacion = useStore((state) => state.paginacion);
  const setPaginacion = useStore((state) => state.setPaginacion);
  const isSyncing = useStore((state) => state.isSyncing);

  const [tramites, setTramites] = useState<any>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedTramite, setSelectedTramite] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  
  const { colores } = useTheme();
  const styles = useStyles(createStyles);

  useEffect(() => {
    loadTramites();
  }, [filtros, paginacion.page, paginacion.size]);

  useEffect(() => {
    setPaginacion("page", 1);
  }, [filtros]);

  useEffect(() => {
    if (tramites.length > 0) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [filtros, paginacion.page]);

  const loadTramites = async () => {
    setIsLoadingData(true);
    try {
      const offset = (paginacion.page - 1) * paginacion.size;

      const data = await getTramites(
        filtros.query,
        filtros.fecha.desde,
        filtros.fecha.hasta,
        filtros.oblea,
        filtros.partido,
        filtros.partida,
        filtros.estado,
        filtros.tipo_tramite,
        paginacion.size,
        offset,
      );

      setTramites(data);
    } catch (error) {
      console.error('Error loading tramites:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleTramitePress = useCallback((tramite: any) => {
    setSelectedTramite(tramite);
    setModalVisible(true);
  }, []);

  const renderTramite = useCallback(
    ({ item }: { item: any }) => (
      <TramiteCard tramite={item} onPress={() => handleTramitePress(item)} />
    ),
    [handleTramitePress],
  );

  if (isLoading || isLoadingData || isSyncing) {
    return <LoadingTramitesSpinner />;
  }

  if (tramites.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.emptyIconContainer}>
          <FileQuestion size={48} color={colores.C_TEXT2} strokeWidth={1.5} />
        </View>
        <Text style={styles.emptyTitle}>Sin resultados</Text>
        <Text style={styles.emptyText}>
          No encontramos expedientes que coincidan con los filtros aplicados.
        </Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        ref={flatListRef}
        data={tramites}
        renderItem={renderTramite}
        keyExtractor={(item) => item.nroExpediente}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      <TramiteDetailModal
        visible={modalVisible}
        tramite={selectedTramite}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};


const createStyles = (colores: any) => StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colores.C_BG,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colores.C_CARD,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colores.C_SURFACE,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colores.C_TEXT,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyText: {
    color: colores.C_TEXT2,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 20,
  }
});