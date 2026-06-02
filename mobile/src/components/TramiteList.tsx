import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Text,
} from 'react-native';
import { useStore } from '@/store/useStore';
import { getTramites } from '@/db/database';
import { TramiteCard } from '@/components/ui/TramiteCard';
import { TramiteDetailModal } from '@/components/TramiteDetailModal';
import { LoadingTramitesSpinner } from '@/components/ui/LoadingTramitesSpinner';

const C_BG = "#0f1724";
const C_TEXT2 = "#90a4ae";

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
        <Text style={styles.emptyText}>No hay trámites para mostrar</Text>
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
      />

      <TramiteDetailModal
        visible={modalVisible}
        tramite={selectedTramite}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C_BG,
  },
  emptyText: {
    color: C_TEXT2,
    fontSize: 16,
  },
});