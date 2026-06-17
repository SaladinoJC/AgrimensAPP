import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useStore } from '@/store/useStore';
import { getTotalCount } from '@/db/database';
import { SearchFilters } from '@/components/SearchFilters';
import { SyncButton } from '@/components/ui/SyncButton';
import { TramiteList } from '@/components/TramiteList';
import { PaginationControl } from '@/components/PaginationControl';
import { useStyles } from '@/hooks/useStyles';

interface DashboardScreenProps {
  onSync: () => void;
  onSyncCancel: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onSync,
  onSyncCancel,
}) => {
  const { filtros, paginacion, refreshKey } = useStore();  
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const styles = useStyles(createStyles);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const count = await getTotalCount(
        filtros.query,
        filtros.fecha.desde,
        filtros.fecha.hasta,
        filtros.partido,
        filtros.partida,
        filtros.estado,
        filtros.tipo_tramite,
      );
      setTotalCount(count);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [filtros, refreshKey]);

  return (
    <View style={styles.container}> 
      {/* Botón de sincronización */}
      <SyncButton onSync={onSync} onCancel={onSyncCancel} />

      {/* Filtros de búsqueda */}
      <SearchFilters />

      <View style={styles.content}>
        {/* Lista de tramites */}
        <View style={styles.listContainer}>
          <TramiteList
            key={refreshKey}
            isLoading={isLoadingStats}
          />
        </View>

        {/* Control de paginación */}
        <PaginationControl
          key={`pag-${refreshKey}`}
          totalCount={totalCount}
          pageSize={paginacion.size}
        />
      </View>
    </View>
  );
};

const createStyles = (colores: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colores.C_BG,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
});