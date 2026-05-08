import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useStore } from '../store/useStore';
import { Search, Filter, X, Calendar, Trash } from 'lucide-react-native';

const C_BG = "#0f1724";
const C_SURFACE = "#182136";
const C_CARD = "#1e2a42";
const C_PRIMARY = "#00bfa5";
const C_ACCENT = "#4fc3f7";
const C_TEXT = "#eceff1";
const C_TEXT2 = "#90a4ae";

interface SearchFiltersProps {
  onSearch: () => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ onSearch }) => {
  const {
    searchQuery,
    filterDesde,
    filterHasta,
    filterPartido,
    filterPartida,
    setSearchQuery,
    setFilterDesde,
    setFilterHasta,
    setFilterPartido,
    setFilterPartida,
    clearFilters,
  } = useStore();

  const [showDesdeModal, setShowDesdeModal] = useState(false);
  const [showHastaModal, setShowHastaModal] = useState(false);

  const handleDesdeChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFilterDesde(dateString);
      onSearch();
    }
    setShowDesdeModal(false);
  };

  const handleHastaChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFilterHasta(dateString);
      onSearch();
    }
    setShowHastaModal(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Search size={20} color={C_TEXT2} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nro, partido, estado..."
          placeholderTextColor={C_TEXT2}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={onSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={20} color={C_TEXT2} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDesdeModal(true)}
        >
          <Calendar size={16} color={C_PRIMARY} />
          <Text style={styles.dateButtonText}>
            {filterDesde || 'Desde'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowHastaModal(true)}
        >
          <Calendar size={16} color={C_PRIMARY} />
          <Text style={styles.dateButtonText}>
            {filterHasta || 'Hasta'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <TextInput
          style={[styles.filterInput, { flex: 1, marginRight: 8 }]}
          placeholder="Partido"
          placeholderTextColor={C_TEXT2}
          value={filterPartido}
          onChangeText={setFilterPartido}
        />
        <TextInput
          style={[styles.filterInput, { flex: 1 }]}
          placeholder="Partida"
          placeholderTextColor={C_TEXT2}
          value={filterPartida}
          onChangeText={setFilterPartida}
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={onSearch}
        >
          <Search size={16} color={C_BG} />
          <Text style={styles.searchButtonText}>BUSCAR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearFilters}
        >
          <Trash size={16} color={C_TEXT} />
          <Text style={styles.clearButtonText}>LIMPIAR</Text>
        </TouchableOpacity>
      </View>

      {showDesdeModal && (
        <DateTimePicker
          value={filterDesde ? new Date(filterDesde) : new Date()}
          mode="date"
          onChange={handleDesdeChange}
        />
      )}

      {showHastaModal && (
        <DateTimePicker
          value={filterHasta ? new Date(filterHasta) : new Date()}
          mode="date"
          onChange={handleHastaChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: C_CARD,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C_SURFACE,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: C_TEXT,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  dateButton: {
    flex: 1,
    backgroundColor: C_SURFACE,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButtonText: {
    color: C_TEXT,
    marginLeft: 8,
    fontSize: 14,
  },
  filterInput: {
    backgroundColor: C_SURFACE,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: C_TEXT,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchButton: {
    flex: 1,
    backgroundColor: C_PRIMARY,
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: C_BG,
    marginLeft: 6,
    fontWeight: 'bold',
    fontSize: 14,
  },
  clearButton: {
    paddingHorizontal: 14,
    backgroundColor: C_SURFACE,
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: C_TEXT,
    marginLeft: 6,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
