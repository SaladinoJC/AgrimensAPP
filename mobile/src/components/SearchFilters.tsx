import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Search, X, Calendar, Trash2, ChevronDown } from "lucide-react-native";

import { useStore } from "@/store/useStore";
import { ESTADOS_OPC, TIPOS_OPC } from "@/tramites/tramites.type";
import { SelectModal } from "@/components/ui/SelectModal";

import { useTheme } from "@/hooks/useTheme";
import { useStyles } from "@/hooks/useStyles";

export const SearchFilters = () => {
  const filtros = useStore((state) => state.filtros);
  const setFiltro = useStore((state) => state.setFiltro);
  const setFiltroFecha = useStore((state) => state.setFiltroFecha);
  const clearFiltros = useStore((state) => state.clearFiltros);
  
  const { colores } = useTheme();
  const styles = useStyles(createStyles);

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

  const hoyStr = formatLocalDate(new Date());
  const displayHasta = filtros.fecha.hasta || hoyStr;

  const handleDesdeChange = (event: any, selectedDate?: Date) => {
    setShowDesdeModal(false);
    if (event.type === "set" && selectedDate) {
      setFiltroFecha("desde", formatLocalDate(selectedDate));
    }
  };

  const handleHastaChange = (event: any, selectedDate?: Date) => {
    setShowHastaModal(false);
    if (event.type === "set" && selectedDate) {
      setFiltroFecha("hasta", formatLocalDate(selectedDate));
    }
  };

  const estadoSeleccionado = ESTADOS_OPC.find((e) => e.value === filtros.estado) || ESTADOS_OPC[0];
  const tipoSeleccionado = TIPOS_OPC.find((e) => e.value === filtros.tipo_tramite) || TIPOS_OPC[0];

  return (
    <View style={styles.container}>
      
      {/* FILA 1: BÚSQUEDA Y LIMPIAR (Compacto) */}
      <View style={styles.topRow}>
        <View style={styles.searchBar}>
          <Search size={18} color={colores.C_TEXT2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar nro, partido..."
            placeholderTextColor={colores.C_TEXT2}
            value={filtros.query}
            onChangeText={(text) => setFiltro("query", text)}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
          />
          {filtros.query.length > 0 && (
            <TouchableOpacity
              onPress={() => setFiltro("query", "")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={colores.C_TEXT2} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.clearFiltersBtn}
          onPress={clearFiltros}
          activeOpacity={0.7}
        >
          <Trash2 size={18} color={colores.C_RED} />
        </TouchableOpacity>
      </View>

      {/* FILA 2: FECHAS */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.controlElement}
          onPress={() => setShowDesdeModal(true)}
          activeOpacity={0.7}
        >
          <Calendar size={16} color={filtros.fecha.desde ? colores.C_PRIMARY : colores.C_TEXT2} />
          <Text style={[styles.controlText, !filtros.fecha.desde && styles.placeholderText]}>
            {filtros.fecha.desde || "Desde"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlElement}
          onPress={() => setShowHastaModal(true)}
          activeOpacity={0.7}
        >
          <Calendar size={16} color={colores.C_PRIMARY} />
          <Text style={[styles.controlText]}>
            {filtros.fecha.hasta ? displayHasta : hoyStr}
          </Text>
        </TouchableOpacity>
      </View>

      {/* FILA 3: PARTIDO Y PARTIDA */}
      <View style={styles.filterRow}>
        <TextInput
          style={styles.inputElement}
          placeholder="Partido"
          placeholderTextColor={colores.C_TEXT2}
          value={filtros.partido}
          onChangeText={(text) => setFiltro("partido", text)}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.inputElement}
          placeholder="Partida"
          placeholderTextColor={colores.C_TEXT2}
          value={filtros.partida}
          onChangeText={(text) => setFiltro("partida", text)}
          keyboardType="numeric"
        />
      </View>

      {/* FILA 4: TIPO DE TRÁMITE Y ESTADO */}
      <View style={styles.filterRowLast}>
        <TouchableOpacity
          style={styles.controlElementSpace}
          onPress={() => setShowTipoModal(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.controlTextSpace, !filtros.tipo_tramite && styles.placeholderText]}
            numberOfLines={1}
          >
            {filtros.tipo_tramite ? tipoSeleccionado.label : "Tipo Trámite"}
          </Text>
          <ChevronDown size={16} color={colores.C_TEXT2} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlElementSpace}
          onPress={() => setShowEstadoModal(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.controlTextSpace, !filtros.estado && styles.placeholderText]}
            numberOfLines={1}
          >
            {filtros.estado ? estadoSeleccionado.label : "Estado"}
          </Text>
          <ChevronDown size={16} color={colores.C_TEXT2} />
        </TouchableOpacity>
      </View>

      {/* MODALES */}
      {showDesdeModal && (
        <DateTimePicker
          value={filtros.fecha.desde ? new Date(filtros.fecha.desde + "T12:00:00") : new Date()}
          mode="date"
          onChange={handleDesdeChange}
        />
      )}
      {showHastaModal && (
        <DateTimePicker
          value={new Date(displayHasta + "T12:00:00")}
          mode="date"
          onChange={handleHastaChange}
        />
      )}
      <SelectModal
        visible={showEstadoModal}
        title="Filtrar por Estado"
        options={ESTADOS_OPC}
        selectedValue={filtros.estado}
        onSelect={(valor) => setFiltro("estado", valor)}
        onClose={() => setShowEstadoModal(false)}
      />
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

const shadowBase = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
};

const createStyles = (colores: any) => StyleSheet.create({
  container: {
    ...shadowBase,
    backgroundColor: colores.C_CARD,
    borderRadius: 12,
    padding: 10, 
    marginHorizontal: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colores.C_SURFACE,
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
    backgroundColor: colores.C_SURFACE,
    borderRadius: 8, 
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colores.C_SURFACE,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 6, 
    paddingHorizontal: 8,
    fontSize: 13,
    color: colores.C_TEXT,
  },
  clearFiltersBtn: {
    width: 40, 
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(239, 83, 80, 0.1)",
    borderRadius: 8,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  filterRowLast: {
    flexDirection: "row",
    gap: 8,
  },
  controlElement: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colores.C_SURFACE,
    borderRadius: 8,
    paddingVertical: 8, 
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colores.C_SURFACE,
  },
  controlText: {
    marginLeft: 8,
    fontSize: 13,
    color: colores.C_TEXT,
    fontWeight: "500",
  },
  inputElement: {
    flex: 1,
    backgroundColor: colores.C_SURFACE,
    color: colores.C_TEXT,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6, 
    fontSize: 13,
    borderWidth: 1,
    borderColor: colores.C_SURFACE,
  },
  controlElementSpace: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colores.C_SURFACE,
    borderRadius: 8,
    paddingVertical: 8, 
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colores.C_SURFACE,
  },
  controlTextSpace: {
    color: colores.C_TEXT,
    fontSize: 13,
    flex: 1,
    fontWeight: "500",
    marginRight: 6,
  },
  placeholderText: {
    color: colores.C_TEXT2,
    fontWeight: "400",
  },
});