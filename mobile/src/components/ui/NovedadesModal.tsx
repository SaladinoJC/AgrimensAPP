import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { BellRing, ArrowRight, FileText } from 'lucide-react-native';
import { Novedad } from '@/novedades/types';

import { useTheme } from '@/hooks/useTheme';
import { useStyles } from '@/hooks/useStyles';

const C_AMBER = "#ffca28"; 

interface NovedadesModalProps {
  novedades: Novedad[];
  onClose: () => void;
  onOpenNotificaciones: () => void;
}

export const NovedadesModal: React.FC<NovedadesModalProps> = ({ 
  novedades, 
  onClose, 
  onOpenNotificaciones 
}) => {
  const { colores } = useTheme();
  const styles = useStyles(createStyles);

  if (novedades.length === 0) return null;

  return (
    <Modal 
      visible={true} 
      transparent 
      animationType="fade" 
    >
      <View style={styles.modalBg}>
        <View style={styles.modalContent}>
          
          {/* Cabecera Compacta (Horizontal) */}
          <View style={styles.header}>
            <View style={styles.iconWrapper}>
              <BellRing color={C_AMBER} size={20} strokeWidth={2.5} />
            </View>
            <Text style={styles.modalTitle}>Nuevos Movimientos</Text>
          </View>

          {/* Lista de Novedades */}
          <FlatList
            data={novedades}
            keyExtractor={(item) => String(item.nro)} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.novedadItem}>
                
                {/* Título y Tipo de Trámite Compacto */}
                <View style={styles.novedadHeader}>
                  <FileText size={16} color={colores.C_PRIMARY} />
                  <View style={styles.novedadHeaderText}>
                    <Text style={styles.novedadTitle}>#{item.nro}</Text>
                    <Text style={styles.novedadTipo} numberOfLines={1}>
                      {item.tipo_tramite || "Trámite de Agrimensura"}
                    </Text>
                  </View>
                </View>

                {/* Transición de Estados Compacta */}
                <View style={styles.stateChangeContainer}>
                  <Text style={styles.stateTextViejo} numberOfLines={2}>
                    {item.viejo}
                  </Text>
                  
                  <View style={styles.arrowContainer}>
                    <ArrowRight size={14} color={colores.C_PRIMARY} strokeWidth={3} />
                  </View>
                  
                  <Text style={styles.stateTextNuevo} numberOfLines={2}>
                    {item.nuevo}
                  </Text>
                </View>
                
              </View>
            )}
          />

          {/* Botonera de Acción Compacta */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.btnSecondaryText}>Cerrar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.btnPrimary} 
              onPress={onOpenNotificaciones}
              activeOpacity={0.8}
            >
              <Text style={styles.btnPrimaryText}>Ir a Notificaciones</Text>
            </TouchableOpacity>
          </View>
          
        </View>
      </View>
    </Modal>
  );
};


const shadowBase = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 5,
};

const createStyles = (colores: any) => StyleSheet.create({
  modalBg: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.65)', 
    justifyContent: 'center', 
    padding: 16, 
  },
  modalContent: { 
    ...shadowBase,
    backgroundColor: colores.C_CARD, 
    borderRadius: 20, 
    padding: 20, 
    maxHeight: '75%', 
    borderWidth: 1,
    borderColor: colores.C_SURFACE,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16,
    gap: 12,
  },
  iconWrapper: {
    backgroundColor: 'rgba(255, 202, 40, 0.15)', 
    padding: 10, 
    borderRadius: 20,
  },
  modalTitle: { 
    color: colores.C_TEXT, 
    fontSize: 18, 
    fontWeight: '800',
    letterSpacing: -0.5,
    flex: 1,
  },
  listContent: {
    paddingBottom: 4,
  },
  novedadItem: { 
    backgroundColor: colores.C_SURFACE, 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colores.C_SURFACE,
  },
  novedadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, 
    borderBottomWidth: 1,
    borderBottomColor: colores.C_CARD,
    paddingBottom: 8,
  },
  novedadHeaderText: {
    marginLeft: 8,
    flex: 1,
  },
  novedadTitle: { 
    color: colores.C_TEXT, 
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: -0.3,
  },
  novedadTipo: {
    color: colores.C_TEXT2,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  stateChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  stateTextViejo: { 
    flex: 1,
    color: colores.C_TEXT2, 
    fontSize: 12, 
    fontWeight: '500',
  },
  arrowContainer: {
    backgroundColor: colores.C_CARD,
    padding: 4,
    borderRadius: 8,
  },
  stateTextNuevo: { 
    flex: 1,
    color: colores.C_PRIMARY, 
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 16, 
    gap: 12, 
  },
  btnSecondary: { 
    flex: 1,
    backgroundColor: colores.C_SURFACE, 
    paddingVertical: 12, 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  btnSecondaryText: { 
    color: colores.C_TEXT, 
    fontWeight: '700',
    fontSize: 14, 
  },
  btnPrimary: { 
    flex: 1.5, 
    backgroundColor: colores.C_PRIMARY, 
    paddingVertical: 12, 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center',
    ...shadowBase,
  },
  btnPrimaryText: { 
    color: colores.C_BG, 
    fontWeight: '800',
    fontSize: 14, 
  },
});