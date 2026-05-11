import React from 'react';
import { StyleSheet, View, Text, Modal, FlatList, TouchableOpacity } from 'react-native';

const C_CARD = "#1e2a42";
const C_SURFACE = "#182136";
const C_PRIMARY = "#00bfa5";
const C_TEXT = "#eceff1";
const C_TEXT2 = "#90a4ae";

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
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.selectMenu}>
          <Text style={styles.selectMenuTitle}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => {
              const isActive = selectedValue === item.value;
              return (
                <TouchableOpacity 
                  style={[styles.selectOption, isActive && styles.selectOptionActive]}
                  onPress={() => {
                    onSelect(item.value);
                    onClose();
                  }}
                >
                  <Text style={[styles.selectOptionText, isActive && styles.selectOptionTextActive]}>
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
    backgroundColor: C_CARD,
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%',
  },
  selectMenuTitle: {
    color: C_TEXT2,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  selectOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C_SURFACE,
  },
  selectOptionActive: {
    backgroundColor: 'rgba(0, 191, 165, 0.1)', 
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  selectOptionText: {
    color: C_TEXT,
    fontSize: 16,
  },
  selectOptionTextActive: {
    color: C_PRIMARY,
    fontWeight: 'bold',
  }
});