import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Search, X, Calendar, Trash2, ChevronDown } from "lucide-react-native";
import { useStore } from "@/store/useStore";
import { SelectModal } from "@/components/ui/SelectModal";
import { ESTADOS_OPC, TIPOS_OPC } from "@/tramites/tramites.type";

const C_SURFACE = "#182136";
const C_CARD = "#1e2a42";
const C_PRIMARY = "#00bfa5";
const C_TEXT = "#eceff1";
const C_TEXT2 = "#90a4ae";
const C_RED = "#ef5350"; // Un rojo sutil para el botón de limpiar


export const SearchFilters = () => {
  const filtros = useStore((state) => state.filtros);
  const setFiltro = useStore((state) => state.setFiltro);
  const setFiltroFecha = useStore((state) => state.setFiltroFecha);
  const clearFiltros = useStore((state) => state.clearFiltros);

  const [showDesdeModal, setShowDesdeModal] = useState(false);
  const [showHastaModal, setShowHastaModal] = useState(false);
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [showTipoModal, setShowTipoModal] = useState(false);

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Calculamos la fecha actual para usarla como default
  const hoyStr = formatLocalDate(new Date());
  // Si no hay filtro 'hasta' guardado, usamos la fecha de hoy
  const displayHasta = filtros.fecha.hasta || hoyStr;

  const handleDesdeChange = (event: any, selectedDate?: Date) => {
    setShowDesdeModal(false);
    if (event.type === "set" && selectedDate) {
      // Usamos la función dedicada
      setFiltroFecha("desde", formatLocalDate(selectedDate));
    }
  };

  const handleHastaChange = (event: any, selectedDate?: Date) => {
    setShowHastaModal(false);
    if (event.type === "set" && selectedDate) {
      // Usamos la función dedicada
      setFiltroFecha("hasta", formatLocalDate(selectedDate));
    }
  };

  const estadoSeleccionado =
    ESTADOS_OPC.find((e) => e.value === filtros.estado) || ESTADOS_OPC[0];
  const tipoSeleccionado =
    TIPOS_OPC.find((e) => e.value === filtros.tipo_tramite) || TIPOS_OPC[0];

  return (
    <View style={styles.container}>
      {/* FILA 1: BÚSQUEDA Y BOTÓN LIMPIAR */}
      <View style={styles.topRow}>
        <View style={styles.searchBar}>
          <Search size={20} color={C_TEXT2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar nro, partido..."
            placeholderTextColor={C_TEXT2}
            value={filtros.query}
            onChangeText={(text) => setFiltro("query", text)}
            returnKeyType="search"
          />
          {filtros.query.length > 0 && (
            <TouchableOpacity
              onPress={() => setFiltro("query", "")}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <X size={20} color={C_TEXT2} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.clearFiltersBtn}
          onPress={clearFiltros}
          activeOpacity={0.7}
        >
          <Trash2 size={20} color={C_RED} />
        </TouchableOpacity>
      </View>

      {/* FILA 2: FECHAS */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDesdeModal(true)}
        >
          <Calendar size={16} color={C_PRIMARY} />
          <Text style={styles.dateButtonText}>
            {filtros.fecha.desde || "Desde"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowHastaModal(true)}
        >
          <Calendar size={16} color={C_PRIMARY} />
          {/* Mostramos dinámicamente la fecha calculada si está vacío */}
          <Text
            style={[
              styles.dateButtonText,
              !filtros.fecha.hasta && { color: C_PRIMARY },
            ]}
          >
            {displayHasta}
          </Text>
        </TouchableOpacity>
      </View>

      {/* FILA 3: PARTIDO Y PARTIDA */}
      <View style={styles.filterRow}>
        <TextInput
          style={[styles.filterInput, { flex: 1, marginRight: 8 }]}
          placeholder="Partido"
          placeholderTextColor={C_TEXT2}
          value={filtros.partido}
          onChangeText={(text) => setFiltro("partido", text)}
        />
        <TextInput
          style={[styles.filterInput, { flex: 1 }]}
          placeholder="Partida"
          placeholderTextColor={C_TEXT2}
          value={filtros.partida}
          onChangeText={(text) => setFiltro("partida", text)}
        />
      </View>

      {/* FILA 4: TIPO DE TRÁMITE Y ESTADO */}
      <View style={[styles.filterRow, { marginBottom: 0 }]}>
        <TouchableOpacity
          style={[
            styles.filterInput,
            {
              flex: 1,
              marginRight: 8,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            },
          ]}
          onPress={() => setShowTipoModal(true)}
        >
          <Text
            style={{
              color: filtros.tipo_tramite ? C_TEXT : C_TEXT2,
              fontSize: 13,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {filtros.tipo_tramite ? tipoSeleccionado.label : "Tipo Trámite"}
          </Text>
          <ChevronDown size={16} color={C_TEXT2} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterInput,
            {
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            },
          ]}
          onPress={() => setShowEstadoModal(true)}
        >
          <Text
            style={{
              color: filtros.estado ? C_TEXT : C_TEXT2,
              fontSize: 13,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {filtros.estado ? estadoSeleccionado.label : "Estado"}
          </Text>
          <ChevronDown size={16} color={C_TEXT2} />
        </TouchableOpacity>
      </View>

      {/* MODALES DE FECHA */}
      {showDesdeModal && (
        <DateTimePicker
          value={
            filtros.fecha.desde
              ? new Date(filtros.fecha.desde + "T12:00:00")
              : new Date()
          }
          mode="date"
          onChange={handleDesdeChange}
        />
      )}
      {showHastaModal && (
        <DateTimePicker
          value={new Date(displayHasta + "T12:00:00")} // Usa la variable procesada
          mode="date"
          onChange={handleHastaChange}
        />
      )}

      {/* MODAL DE ESTADO */}
      <SelectModal
        visible={showEstadoModal}
        title="Filtrar por Estado"
        options={ESTADOS_OPC}
        selectedValue={filtros.estado}
        onSelect={(valor) => setFiltro("estado", valor)}
        onClose={() => setShowEstadoModal(false)}
      />

      {/* MODAL DE TIPO DE TRÁMITE */}
      <SelectModal
        visible={showTipoModal}
        title="Filtrar por Tipo"
        options={TIPOS_OPC}
        selectedValue={filtros.tipo_tramite}
        onSelect={(valor) => setFiltro("tipo_tramite", valor)}
        onClose={() => setShowTipoModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: C_CARD,
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 12,
    marginVertical: 4,
  },
  topRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C_SURFACE,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: C_TEXT,
    fontSize: 14,
  },
  clearFiltersBtn: {
    width: 48,
    backgroundColor: C_SURFACE,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 83, 80, 0.2)", // Borde rojo sutil
  },
  filterRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dateButton: {
    flex: 1,
    backgroundColor: C_SURFACE,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
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
});
