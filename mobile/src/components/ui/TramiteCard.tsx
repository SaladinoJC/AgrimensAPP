import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Tramite } from '../../types/tramites-type';
import { getColor } from '../../utils/utils-tramite';

const C_CARD = "#1e2a42";
const C_PRIMARY = "#00bfa5";
const C_ACCENT = "#4fc3f7";
const C_TEXT = "#eceff1";
const C_TEXT2 = "#90a4ae";
const C_RED = "#ef5350";
const C_BG = "#0f1724";


interface TramiteCardProps {
  tramite: Tramite;
  onPress: () => void;
}

export const TramiteCard: React.FC<TramiteCardProps> = ({ tramite, onPress }) => {
  const col = getColor(tramite.estado);
  const fgCol = col === C_RED ? "#ffffff" : C_BG;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.expediente}>#{tramite.nroExpediente}</Text>
        <ChevronRight size={20} color={C_TEXT2} />
      </View>
      
      <Text style={styles.cardSubtitle}>{tramite.tipo_tramite}</Text>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Partido:</Text>
        <Text style={styles.infoValue}>{tramite.partido}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Partida:</Text>
        <Text style={styles.infoValue}>{tramite.partida}</Text>
      </View>

      {tramite.fecha_movimiento && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Última actualización:</Text>
          <Text style={styles.infoValue}>{tramite.fecha_movimiento}</Text>
        </View>
      )}

      <View style={styles.badgeContainer}>
        <View style={[styles.badge, { backgroundColor: col }]}>
          <Text style={[styles.badgeText, { color: fgCol }]}>{tramite.estado || '—'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: C_CARD,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 6,
    borderLeftColor: C_PRIMARY,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expediente: {
    fontSize: 16,
    fontWeight: 'bold',
    color: C_PRIMARY,
  },
  cardSubtitle: {
    color: C_ACCENT,
    fontSize: 13,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: C_TEXT2,
    fontWeight: '500',
    flex: 0.4,
  },
  infoValue: {
    fontSize: 12,
    color: C_TEXT,
    flex: 0.6,
    textAlign: 'right',
  },
  badgeContainer: {
    marginTop: 10,
    alignItems: 'flex-start',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontWeight: 'bold',
    fontSize: 11,
  },
});