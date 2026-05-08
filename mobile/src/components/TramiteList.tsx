import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Text,
  RefreshControl,
} from 'react-native';
import { useStore } from '../store/useStore';
import { getTramites, getTotalCount } from '../db/database';
import { TramiteCard } from './ui/TramiteCard';
import { TramiteDetailModal } from './TramiteDetailModal';
import { usePagination } from '../hooks/usePagination';
import { LoadingTramitesSpinner } from './ui/LoadingTramitesSpinner';

const C_BG = "#0f1724";
const C_CARD = "#1e2a42";
const C_TEXT = "#eceff1";
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

  const [tramites, setTramites] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [selectedTramite, setSelectedTramite] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const { getPageInfo } = usePagination(pageSize);

  useEffect(() => {
    loadTramites();
  }, [currentPage, searchQuery, filterDesde, filterHasta, filterPartido, filterPartida]);

  useEffect(() => {
    flatListRef.current?.scrollToIndex({ index: 0, animated: true });
  }, [currentPage]);

  const loadTramites = async () => {
    setIsLoadingData(true);
    try {
      const count = await getTotalCount(
        searchQuery,
        filterDesde,
        filterHasta,
        filterPartido,
        filterPartida
      );
      setTotalCount(count);

      const pageInfo = getPageInfo(currentPage, count);
      const data = await getTramites(
        searchQuery,
        filterDesde,
        filterHasta,
        filterPartido,
        filterPartida,
        pageSize,
        pageInfo.offset
      );

      setTramites(data);
    } catch (error) {
      console.error('Error loading tramites:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleTramitePress = (tramite: any) => {
    setSelectedTramite(tramite);
    setModalVisible(true);
  };

  const renderTramite = ({ item }: { item: any }) => (
    <TramiteCard tramite={item} onPress={() => handleTramitePress(item)} />
  );

  if (isLoadingData || isSyncing) {
    return (
      <LoadingTramitesSpinner />
    );
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
            refreshing={isLoading || isLoadingData}
            onRefresh={onRefresh}
            colors={['#00bfa5']}
            tintColor="#00bfa5"
          />
        }
        onScrollToIndexFailed={() => {}}
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
  loadingText: {
    color: C_TEXT2,
    marginTop: 12,
    fontSize: 14,
  },
  emptyText: {
    color: C_TEXT2,
    fontSize: 16,
  },
});
