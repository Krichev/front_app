// src/shared/ui/TopicSelector/CreateTopicModal.tsx
import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CreateTopicRequest } from '../../../entities/TopicState/model/types/topic.types';

interface CreateTopicModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (topic: CreateTopicRequest) => void;
    initialParentId?: number;
    isLoading?: boolean;
}

const CreateTopicModal: React.FC<CreateTopicModalProps> = ({
    visible,
    onClose,
    onSubmit,
    initialParentId,
    isLoading = false,
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        // Validate name
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a topic name');
            return;
        }

        if (name.trim().length < 2) {
            Alert.alert('Error', 'Topic name must be at least 2 characters');
            return;
        }

        if (name.trim().length > 100) {
            Alert.alert('Error', 'Topic name must be less than 100 characters');
            return;
        }

        // Submit topic
        const request: CreateTopicRequest = {
            name: name.trim(),
            description: description.trim() || undefined,
            parentId: initialParentId,
        };

        onSubmit(request);
    };

    const handleClose = () => {
        setName('');
        setDescription('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose} disabled={isLoading}>
                        <MaterialCommunityIcons
                            name="close"
                            size={24}
                            color={isLoading ? '#999' : '#007AFF'}
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Create New Topic</Text>
                    <TouchableOpacity onPress={handleSubmit} disabled={isLoading}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#007AFF" />
                        ) : (
                            <Text style={styles.submitButton}>Create</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    {/* Warning about validation */}
                    <View style={styles.warningBox}>
                        <MaterialCommunityIcons name="information" size={20} color="#FF9800" />
                        <Text style={styles.warningText}>
                            New topics require moderator approval before becoming public.
                        </Text>
                    </View>

                    {/* Name field */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Topic Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Machine Learning"
                            placeholderTextColor="#999"
                            value={name}
                            onChangeText={setName}
                            maxLength={100}
                            autoFocus
                        />
                        <Text style={styles.helperText}>
                            Choose a clear, specific name for your topic
                        </Text>
                    </View>

                    {/* Description field */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Description (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Briefly describe what this topic covers..."
                            placeholderTextColor="#999"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            maxLength={500}
                            textAlignVertical="top"
                        />
                        <Text style={styles.helperText}>
                            Help others understand what questions belong in this topic
                        </Text>
                    </View>

                    {/* Parent topic info */}
                    {initialParentId && (
                        <View style={styles.infoBox}>
                            <MaterialCommunityIcons name="file-tree" size={20} color="#007AFF" />
                            <Text style={styles.infoText}>
                                This topic will be created as a subtopic
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    submitButton: {
        fontSize: 17,
        fontWeight: '600',
        color: '#007AFF',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFF3E0',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        color: '#E65100',
        lineHeight: 20,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: '#000',
    },
    textArea: {
        minHeight: 100,
        paddingTop: 10,
    },
    helperText: {
        fontSize: 13,
        color: '#666',
        marginTop: 6,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#1565C0',
    },
});

export default CreateTopicModal;
