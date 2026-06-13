import React from 'react';
import { StyleSheet, View, Text, Modal, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectModalProps {
  visible: boolean;
  title: string;
  options: SelectOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export const SelectModal: React.FC<SelectModalProps> = ({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}) => {
  const { colores } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={[styles.selectMenu, { backgroundColor: colores.C_CARD }]}> 
          <Text style={[styles.selectMenuTitle, { color: colores.C_TEXT2 }]}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => {
              const isActive = selectedValue === item.value;
              return (
                <TouchableOpacity 
                  style={[
                    styles.selectOption,
                    { borderBottomColor: colores.C_SURFACE },
                    isActive && styles.selectOptionActive,
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    onClose();
                  }}
                >
                  <Text style={[
                    styles.selectOptionText,
                    { color: colores.C_TEXT },
                    isActive && { color: colores.C_PRIMARY, fontWeight: 'bold' },
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  selectMenu: {
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%',
  },
  selectMenuTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  selectOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  selectOptionActive: {
    backgroundColor: 'rgba(0, 191, 165, 0.1)', 
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  selectOptionText: {
    fontSize: 16,
  },
  selectOptionTextActive: {
    fontWeight: 'bold',
  }
});