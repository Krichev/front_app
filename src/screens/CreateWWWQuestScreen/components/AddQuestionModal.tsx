// src/screens/CreateWWWQuestScreen/components/AddQuestionModal.tsx
import React, {useState} from 'react';
import {Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {CustomQuestion} from '../hooks/useQuestionsManager';

interface AddQuestionModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (question: CustomQuestion) => void;
    availableTopics: string[];
}

const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
                                                               visible,
                                                               onClose,
                                                               onSubmit,
                                                               availableTopics,
                                                           }) => {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
    const [topic, setTopic] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [showTopicPicker, setShowTopicPicker] = useState(false);

    const handleSubmit = () => {
        if (!question.trim()) {
            Alert.alert('Error', 'Please enter a question');
            return;
        }
        if (!answer.trim()) {
            Alert.alert('Error', 'Please enter an answer');
            return;
        }

        onSubmit({
            question: question.trim(),
            answer: answer.trim(),
            difficulty,
            topic: topic.trim(),
            additionalInfo: additionalInfo.trim(),
        });

        // Reset form
        setQuestion('');
        setAnswer('');
        setDifficulty('MEDIUM');
        setTopic('');
        setAdditionalInfo('');
    };

    const handleClose = () => {
        setQuestion('');
        setAnswer('');
        setDifficulty('MEDIUM');
        setTopic('');
        setAdditionalInfo('');
        onClose();
    };

    return (
        <>
            <Modal
                visible={visible}
                transparent={true}
                animationType="slide"
                onRequestClose={handleClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Custom Question</Text>
                            <TouchableOpacity onPress={handleClose}>
                                <MaterialCommunityIcons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Question *</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={question}
                                    onChangeText={setQuestion}
                                    placeholder="Enter your question"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Answer *</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={answer}
                                    onChangeText={setAnswer}
                                    placeholder="Enter the answer"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Difficulty</Text>
                                <View style={styles.difficultyContainer}>
                                    {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                                        <TouchableOpacity
                                            key={diff}
                                            style={[
                                                styles.difficultyChip,
                                                difficulty === diff && styles.difficultyChipSelected,
                                            ]}
                                            onPress={() => setDifficulty(diff)}
                                        >
                                            <Text
                                                style={[
                                                    styles.difficultyChipText,
                                                    difficulty === diff && styles.difficultyChipTextSelected,
                                                ]}
                                            >
                                                {diff}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Topic (Optional)</Text>
                                <TouchableOpacity
                                    style={styles.topicPickerButton}
                                    onPress={() => setShowTopicPicker(true)}
                                >
                                    <Text style={styles.topicPickerText}>
                                        {topic || 'Select or enter topic'}
                                    </Text>
                                    <MaterialCommunityIcons
                                        name="chevron-down"
                                        size={24}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                                <TextInput
                                    style={[styles.input, { marginTop: 8 }]}
                                    value={topic}
                                    onChangeText={setTopic}
                                    placeholder="Or type custom topic"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Additional Info (Optional)</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={additionalInfo}
                                    onChangeText={setAdditionalInfo}
                                    placeholder="Any extra information about this question"
                                    multiline
                                    numberOfLines={2}
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                                <MaterialCommunityIcons name="check" size={20} color="#fff" />
                                <Text style={styles.submitButtonText}>Add Question</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Topic Picker Modal */}
            <Modal
                visible={showTopicPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowTopicPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '60%' }]}>
                        <Text style={styles.modalTitle}>Select Topic</Text>
                        <ScrollView>
                            {availableTopics.map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={styles.topicItem}
                                    onPress={() => {
                                        setTopic(t);
                                        setShowTopicPicker(false);
                                    }}
                                >
                                    <Text style={styles.topicItemText}>{t}</Text>
                                    {topic === t && (
                                        <MaterialCommunityIcons
                                            name="check"
                                            size={24}
                                            color="#007AFF"
                                        />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setShowTopicPicker(false)}
                        >
                            <Text style={styles.modalCloseButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#f8f8f8',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    difficultyContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    difficultyChip: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        borderWidth: 2,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    difficultyChipSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    difficultyChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    difficultyChipTextSelected: {
        color: '#fff',
    },
    topicPickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#f8f8f8',
    },
    topicPickerText: {
        fontSize: 16,
        color: '#333',
    },
    topicItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    topicItemText: {
        fontSize: 16,
        color: '#333',
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    submitButton: {
        flex: 1,
        flexDirection: 'row',
        padding: 16,
        borderRadius: 8,
        backgroundColor: '#4CAF50',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    modalCloseButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    modalCloseButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AddQuestionModal;