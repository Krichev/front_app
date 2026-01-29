// src/screens/CreateWWWQuestScreen/components/QuestionTypeSelectorModal.tsx

import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { QuestionCategory } from '../types/question.types';

interface QuestionTypeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: QuestionCategory) => void;
}

const QuestionTypeSelectorModal: React.FC<QuestionTypeSelectorModalProps> = ({ visible, onClose, onSelect }) => {
  const { t } = useTranslation();

  const optionData = [
    { 
      category: 'REGULAR' as QuestionCategory, 
      icon: 'help-circle-outline', 
      label: t('createQuest.typeSelector.regularQuestion'), 
      description: t('createQuest.typeSelector.regularDescription') 
    },
    { 
      category: 'KARAOKE' as QuestionCategory, 
      icon: 'microphone-variant', 
      label: t('createQuest.typeSelector.karaokeQuestion'), 
      description: t('createQuest.typeSelector.karaokeDescription'), 
      opensNewScreen: true 
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('createQuest.typeSelector.title')}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.optionsGrid}>
            {optionData.map((option) => (
              <TouchableOpacity 
                key={option.category} 
                style={styles.optionCard} 
                onPress={() => onSelect(option.category)}
              >
                <MaterialCommunityIcons name={option.icon} size={32} color="#007AFF" />
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
                {option.opensNewScreen && (
                  <View style={styles.newScreenIndicator}>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingTop: 16,
    },
    optionCard: {
        width: '48%',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        minHeight: 140,
        justifyContent: 'center',
        position: 'relative',
    },
    optionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginTop: 12,
        textAlign: 'center',
    },
    optionDescription: {
        fontSize: 11,
        color: '#666',
        textAlign: 'center',
        marginTop: 4,
    },
    newScreenIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
});

export default QuestionTypeSelectorModal;