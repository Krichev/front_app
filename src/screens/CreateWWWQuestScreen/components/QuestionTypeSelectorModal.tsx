// src/screens/CreateWWWQuestScreen/components/QuestionTypeSelectorModal.tsx

import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Assuming QuestionType is available from a central types file
import { QuestionType } from '../../../services/wwwGame/questionService'; 

interface QuestionTypeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: QuestionType) => void;
}

const optionData = [
  { type: 'TEXT' as QuestionType, icon: 'text-box-outline', label: 'Text Question', description: 'A standard text-based question.' },
  { type: 'IMAGE' as QuestionType, icon: 'image-outline', label: 'Image Question', description: 'Question with a visual element.' },
  { type: 'VIDEO' as QuestionType, icon: 'video-outline', label: 'Video Question', description: 'Question based on a video clip.' },
  { type: 'AUDIO' as QuestionType, icon: 'microphone-outline', label: 'Audio Challenge', description: 'Opens the full audio editor.', opensNewScreen: true },
];

const QuestionTypeSelectorModal: React.FC<QuestionTypeSelectorModalProps> = ({ visible, onClose, onSelect }) => {
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
            <Text style={styles.headerTitle}>Select Question Type</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.optionsGrid}>
            {optionData.map((option) => (
              <TouchableOpacity key={option.type} style={styles.optionCard} onPress={() => onSelect(option.type)}>
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
