import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useStore } from '../store/useStore';
import { getTotalCount } from '../db/database';
import { SearchFilters } from './SearchFilters';
import { SyncButton } from './ui/SyncButton';
import { TramiteList } from './TramiteList';
import { PaginationControl } from './PaginationControl';

const C_BG = "#0f1724";

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
    refreshKey,
  } = useStore();

  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
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

  // Cargar estadísticas al montar el componente 
  // y recalcular si los filtros globales del store cambian.
  useEffect(() => {
    loadStats();
  }, [searchQuery, filterDesde, filterHasta, filterPartido, filterPartida,refreshKey]);

  const handleSearch = async () => {
    // Si los filtros cambian en el SearchFilters y actualizan el store,
    // el useEffect de arriba ya se encarga de llamar a loadStats automáticamente
    await loadStats();
  };

  const handleRefresh = async () => {
    await loadStats();
  };

  return (
    <View style={styles.container}>
      {/* Botón de sincronización */}
      <SyncButton onSync={onSync} onCancel={onSyncCancel} />

      {/* Filtros de búsqueda */}
      <SearchFilters onSearch={handleSearch} />

      <View style={styles.content}>
        {/* Lista de tramites */}
        <View style={styles.listContainer}>
          <TramiteList 
            key={refreshKey} 
            onRefresh={handleRefresh} 
            isLoading={isLoadingStats} 
          />
        </View>
        
        {/* Control de paginación */}
        <PaginationControl 
          key={`pag-${refreshKey}`} 
          totalCount={totalCount} 
          pageSize={pageSize} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C_BG,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
});