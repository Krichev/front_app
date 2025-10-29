// src/screens/CreateWWWQuestScreen/components/MediaQuestionModal.tsx
import React, {useState} from 'react';
import {Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {QuestionFormData, QuestionType} from '../hooks/useQuestionsManager';

interface MediaQuestionModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (questionData: QuestionFormData) => void;
    availableTopics: string[];
}

const MediaQuestionModal: React.FC<MediaQuestionModalProps> = ({
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
    const [questionType, setQuestionType] = useState<QuestionType>('TEXT');
    const [mediaUri, setMediaUri] = useState<string | null>(null);
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
            questionType,
            media: mediaUri ? {
                mediaUrl: mediaUri,
                mediaType: questionType,
            } : undefined,
        });

        // Reset form
        resetForm();
    };

    const resetForm = () => {
        setQuestion('');
        setAnswer('');
        setDifficulty('MEDIUM');
        setTopic('');
        setAdditionalInfo('');
        setQuestionType('TEXT');
        setMediaUri(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSelectMedia = () => {
        // This is a placeholder - implement actual media picker
        Alert.alert(
            'Media Upload',
            'Media upload functionality would be implemented here. For now, this creates a question without media.',
            [{ text: 'OK' }]
        );
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
                            <Text style={styles.modalTitle}>Add Media Question</Text>
                            <TouchableOpacity onPress={handleClose}>
                                <MaterialCommunityIcons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Question Type Selector */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Question Type</Text>
                                <View style={styles.typeContainer}>
                                    {(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO'] as const).map((type) => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[
                                                styles.typeChip,
                                                questionType === type && styles.typeChipSelected,
                                            ]}
                                            onPress={() => setQuestionType(type)}
                                        >
                                            <MaterialCommunityIcons
                                                name={
                                                    type === 'TEXT' ? 'text' :
                                                        type === 'IMAGE' ? 'image' :
                                                            type === 'VIDEO' ? 'video' : 'music'
                                                }
                                                size={20}
                                                color={questionType === type ? '#fff' : '#666'}
                                            />
                                            <Text
                                                style={[
                                                    styles.typeChipText,
                                                    questionType === type && styles.typeChipTextSelected,
                                                ]}
                                            >
                                                {type}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Media Upload */}
                            {questionType !== 'TEXT' && (
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Media</Text>
                                    <TouchableOpacity
                                        style={styles.mediaButton}
                                        onPress={handleSelectMedia}
                                    >
                                        <MaterialCommunityIcons
                                            name="upload"
                                            size={24}
                                            color="#007AFF"
                                        />
                                        <Text style={styles.mediaButtonText}>
                                            Upload {questionType}
                                        </Text>
                                    </TouchableOpacity>
                                    {mediaUri && (
                                        <View style={styles.mediaPreview}>
                                            {questionType === 'IMAGE' ? (
                                                <Image
                                                    source={{ uri: mediaUri }}
                                                    style={styles.imagePreview}
                                                />
                                            ) : (
                                                <View style={styles.mediaPlaceholder}>
                                                    <MaterialCommunityIcons
                                                        name={questionType === 'VIDEO' ? 'video' : 'music'}
                                                        size={48}
                                                        color="#007AFF"
                                                    />
                                                    <Text style={styles.mediaPlaceholderText}>
                                                        {questionType} Selected
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            )}

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
        maxHeight: '90%',
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
    typeContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    typeChip: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        borderWidth: 2,
        borderColor: '#ddd',
        gap: 4,
    },
    typeChipSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    typeChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    typeChipTextSelected: {
        color: '#fff',
    },
    mediaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#007AFF',
        backgroundColor: '#f0f7ff',
        gap: 8,
    },
    mediaButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    mediaPreview: {
        marginTop: 12,
        borderRadius: 8,
        overflow: 'hidden',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    mediaPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: '#f0f7ff',
        borderRadius: 8,
    },
    mediaPlaceholderText: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
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

export default MediaQuestionModal;