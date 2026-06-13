import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { useStore } from '@/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { useStyles } from '@/hooks/useStyles';

interface PaginationControlProps {
  totalCount: number;
  pageSize: number;
}

export const PaginationControl: React.FC<PaginationControlProps> = ({
  totalCount,
  pageSize,
}) => {
  const currentPage = useStore((state) => state.paginacion.page);
  const setPaginacion = useStore((state) => state.setPaginacion);

  const { colores } = useTheme();
  const styles = useStyles(createStyles);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const handlePrevious = () => {
    if (hasPrevPage) {
      setPaginacion("page", currentPage - 1);
    }
  };

  const handleNext = () => {
    if (hasNextPage) {
      setPaginacion("page", currentPage + 1);
    }
  };

  if (totalCount === 0) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, !hasPrevPage && styles.buttonDisabled]}
        onPress={handlePrevious}
        disabled={!hasPrevPage}
        activeOpacity={0.7}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <ChevronLeft size={20} color={hasPrevPage ? colores.C_PRIMARY : colores.C_TEXT2} />
      </TouchableOpacity>

      <View style={styles.pageInfo}>
        <Text style={styles.pageText}>
          Página <Text style={styles.pageHighlight}>{currentPage}</Text> de {totalPages}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, !hasNextPage && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={!hasNextPage}
        activeOpacity={0.7}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <ChevronRight size={20} color={hasNextPage ? colores.C_PRIMARY : colores.C_TEXT2} />
      </TouchableOpacity>
    </View>
  );
};

const shadowBase = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 3,
  elevation: 2,
};

const createStyles = (colores: any) => StyleSheet.create({
  container: {
    ...shadowBase,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6, 
    paddingVertical: 6,   
    backgroundColor: colores.C_CARD,
    borderRadius: 10,
    marginHorizontal: 8,
    marginBottom: 4,    
    borderWidth: 1,
    borderColor: colores.C_SURFACE,
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,   
    borderRadius: 8,
    backgroundColor: colores.C_SURFACE,
  },
  buttonDisabled: {
    backgroundColor: 'transparent',
    opacity: 0.5,
  },
  pageInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageText: { 
    color: colores.C_TEXT2, 
    fontSize: 14, 
    fontWeight: '500',
  },
  pageHighlight: {
    color: colores.C_TEXT,
    fontWeight: '800',
  }
});