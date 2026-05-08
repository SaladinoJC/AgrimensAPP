import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { getStats, getTotalCount } from '../db/database';
import { SearchFilters } from './SearchFilters';
import { SyncButton } from './ui/SyncButton';
import { TramiteList } from './TramiteList';
import { PaginationControl } from './PaginationControl';
import { usePagination } from '../hooks/usePagination';

const C_BG = "#0f1724";
const C_CARD = "#1e2a42";
const C_TEXT = "#eceff1";
const C_TEXT2 = "#90a4ae";

interface DashboardScreenProps {
  onSync: () => void;
  onSyncCancel: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onSync,
  onSyncCancel,
}) => {
  const {
    pageSize,
    searchQuery,
    filterDesde,
    filterHasta,
    filterPartido,
    filterPartida,
  } = useStore();

  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      // const statsData = await getStats();
      // setStats(statsData);

      const count = await getTotalCount(
        searchQuery,
        filterDesde,
        filterHasta,
        filterPartido,
        filterPartida
      );
      setTotalCount(count);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleSearch = async () => {
    await loadStats();
  };

  const handleRefresh = async () => {
    setRefreshKey((prev) => prev + 1);
    await loadStats();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Botón de sincronización */}
      <SyncButton onSync={onSync} onCancel={onSyncCancel} />

      {/* Filtros de búsqueda */}
      <SearchFilters onSearch={handleSearch} />

      <View style={[styles.scrollView, { flex: 1 }]}>
        {/* Lista de tramites */}
        <View style={styles.listContainer}>
          <TramiteList key={refreshKey} onRefresh={handleRefresh} isLoading={isLoadingStats} />
        </View>
        {/* Control de paginación */}
        <PaginationControl key={refreshKey} totalCount={totalCount} pageSize={pageSize} />
      </View>

     
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C_BG,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    paddingVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  listContainer: {
    flex: 1,
    minHeight: 400,
  },
  bottomSpacer: {
    height: 20,
  },
});
