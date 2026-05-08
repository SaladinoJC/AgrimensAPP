import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Text,
  RefreshControl,
} from 'react-native';
import { useStore } from '../store/useStore';
import { getTramites } from '../db/database';
import { TramiteCard } from './ui/TramiteCard';
import { TramiteDetailModal } from './TramiteDetailModal';
import { LoadingTramitesSpinner } from './ui/LoadingTramitesSpinner';

const C_BG = "#0f1724";
const C_PRIMARY = "#00bfa5";
const C_TEXT2 = "#90a4ae";

interface TramiteListProps {
  onRefresh: () => void;
  isLoading?: boolean;
}

export const TramiteList: React.FC<TramiteListProps> = ({ onRefresh, isLoading = false }) => {
  const {
    searchQuery,
    filterDesde,
    filterHasta,
    filterPartido,
    filterPartida,
    currentPage,
    pageSize,
    isSyncing,
  } = useStore();

  const [tramites, setTramites] = useState<any>([]);
  const [isLoadingData, setIsLoadingData] = useState(true); 
  const [selectedTramite, setSelectedTramite] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadTramites();
  }, [currentPage, searchQuery, filterDesde, filterHasta, filterPartido, filterPartida]);

  useEffect(() => {
    if (tramites.length > 0) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [currentPage]);

  const loadTramites = async () => {
    setIsLoadingData(true);
    try {
      const offset = (currentPage - 1) * pageSize;

      const data = await getTramites(
        searchQuery,
        filterDesde,
        filterHasta,
        filterPartido,
        filterPartida,
        pageSize,
        offset
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

  const renderTramite = useCallback(({ item }: { item: any }) => (
    <TramiteCard tramite={item} onPress={() => handleTramitePress(item)} />
  ), [handleTramitePress]);


  if (isLoadingData || isSyncing) {
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
        refreshControl={
          <RefreshControl
            refreshing={isLoading || isLoadingData || isSyncing}
            onRefresh={onRefresh}
            colors={[C_PRIMARY]}
            tintColor={C_PRIMARY}
          />
        }
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