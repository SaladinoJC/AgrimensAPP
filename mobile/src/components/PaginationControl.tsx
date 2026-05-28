import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useStore } from '@/store/useStore';

const C_CARD = "#1e2a42";
const C_PRIMARY = "#00bfa5";
const C_TEXT2 = "#90a4ae";

interface PaginationControlProps {
  totalCount: number;
  pageSize: number;
}

export const PaginationControl: React.FC<PaginationControlProps> = ({
  totalCount,
  pageSize,
}) => {
  const { currentPage, setCurrentPage } = useStore();

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const handlePrevious = () => {
    if (hasPrevPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, !hasPrevPage && styles.buttonDisabled]}
        onPress={handlePrevious}
        disabled={!hasPrevPage}
        activeOpacity={0.7}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <ChevronLeft size={30} color={hasPrevPage ? C_PRIMARY : C_TEXT2} />
      </TouchableOpacity>

      <View style={styles.pageInfo}>
        <Text style={styles.pageText}>
          Página {currentPage} de {totalPages}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, !hasNextPage && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={!hasNextPage}
        activeOpacity={0.7}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <ChevronRight size={30} color={hasNextPage ? C_PRIMARY : C_TEXT2} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: C_CARD,
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 8,
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  pageInfo: {
    alignItems: 'center',
  },
  pageText: { 
    color: C_TEXT2, 
    fontSize: 14, 
    marginHorizontal: 20,
    fontWeight: '500',
  },
});