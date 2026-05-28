import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Search, X, Calendar, Trash, ChevronDown } from 'lucide-react-native';
import { useStore } from '@/store/useStore';
import { SelectModal } from '@/components/ui/SelectModal';

const C_SURFACE = "#182136";
const C_CARD = "#1e2a42";
const C_PRIMARY = "#00bfa5";
const C_TEXT = "#eceff1";
const C_TEXT2 = "#90a4ae";

const ESTADOS_OPC = [
  { label: 'Todos los estados', value: '' },
  { label: 'Finalizado', value: 'FINALIZADO' },
  { label: 'Pendiente', value: 'PENDIENTE' },
  { label: 'En Curso', value: 'EN CURSO' },
  { label: 'Rechazado', value: 'RECHAZADO' },
]


export const SearchFilters = () => {
  const {
    searchQuery,
    filterDesde,
    filterHasta,
    filterPartido,
    filterPartida,
    filterEstado,
    setSearchQuery,
    setFilterDesde,
    setFilterHasta,
    setFilterPartido,
    setFilterPartida,
    setFilterEstado,
    clearFilters,
  } = useStore();

  const [showDesdeModal, setShowDesdeModal] = useState(false);
  const [showHastaModal, setShowHastaModal] = useState(false);
  const [showEstadoModal, setShowEstadoModal] = useState(false);

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDesdeChange = (event: any, selectedDate?: Date) => {
    setShowDesdeModal(false);
    if (event.type === 'set' && selectedDate) setFilterDesde(formatLocalDate(selectedDate));
  };

  const handleHastaChange = (event: any, selectedDate?: Date) => {
    setShowHastaModal(false);
    if (event.type === 'set' && selectedDate) setFilterHasta(formatLocalDate(selectedDate));
  };

  const estadoSeleccionado = ESTADOS_OPC.find(e => e.value === filterEstado) || ESTADOS_OPC[0];

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
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <X size={20} color={C_TEXT2} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDesdeModal(true)}>
          <Calendar size={16} color={C_PRIMARY} />
          <Text style={styles.dateButtonText}>{filterDesde || 'Desde'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowHastaModal(true)}>
          <Calendar size={16} color={C_PRIMARY} />
          <Text style={styles.dateButtonText}>{filterHasta || 'Hasta'}</Text>
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
          style={[styles.filterInput, { flex: 1, marginRight: 8 }]}
          placeholder="Partida"
          placeholderTextColor={C_TEXT2}
          value={filterPartida}
          onChangeText={setFilterPartida}
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.filterInput, { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
          onPress={() => setShowEstadoModal(true)}
        >
          <Text style={{ color: filterEstado ? C_TEXT : C_TEXT2, fontSize: 14 }} numberOfLines={1}>
            {filterEstado ? estadoSeleccionado.label : 'Estado'}
          </Text>
          <ChevronDown size={16} color={C_TEXT2} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.clearButton}  
          onPress={clearFilters}
          activeOpacity={0.8}
        >
          <Trash size={16} color={C_TEXT} />
          <Text style={styles.clearButtonText}>LIMPIAR</Text>
        </TouchableOpacity>
      </View>

      {
        showDesdeModal &&
        <DateTimePicker
          value={filterDesde ?
            new Date(filterDesde + 'T12:00:00')
            : new Date()}
          mode="date"
          onChange={handleDesdeChange}
        />
      }
      {
        showHastaModal &&
        <DateTimePicker
          value={filterHasta
            ? new Date(filterHasta + 'T12:00:00')
            : new Date()}
          mode="date"
          onChange={handleHastaChange}
        />
      }


      <SelectModal
        visible={showEstadoModal}
        title="Filtrar por Estado"
        options={ESTADOS_OPC}
        selectedValue={filterEstado}
        onSelect={(valor) => setFilterEstado(valor)}
        onClose={() => setShowEstadoModal(false)}
      />

    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: C_CARD,
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 12,
    marginVertical: 4,
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