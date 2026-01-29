// src/screens/CreateWWWQuestScreen/components/AddQuestionModal.tsx
import React, {useState} from 'react';
import {Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import {CustomQuestion} from '../hooks/useQuestionsManager';
import {TopicTreeSelector} from '../../../shared/ui/TopicSelector';
import {SelectableTopic} from '../../../entities/TopicState';

interface AddQuestionModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (question: CustomQuestion) => void;
}

const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
                                                               visible,
                                                               onClose,
                                                               onSubmit,
                                                           }) => {
    const {t} = useTranslation();
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
    const [topic, setTopic] = useState('');
    const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>(undefined);
    const [additionalInfo, setAdditionalInfo] = useState('');

    // Handle topic selection
    const handleSelectTopic = (selectedTopic: SelectableTopic | null) => {
        if (selectedTopic) {
            setTopic(selectedTopic.name);
            setSelectedTopicId(selectedTopic.id);
        } else {
            setTopic('');
            setSelectedTopicId(undefined);
        }
    };

    const handleSubmit = () => {
        if (!question.trim()) {
            Alert.alert(t('createQuest.addQuestion.errorTitle'), t('createQuest.addQuestion.errorQuestion'));
            return;
        }
        if (!answer.trim()) {
            Alert.alert(t('createQuest.addQuestion.errorTitle'), t('createQuest.addQuestion.errorAnswer'));
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
        setSelectedTopicId(undefined);
        setAdditionalInfo('');
    };

    const handleClose = () => {
        setQuestion('');
        setAnswer('');
        setDifficulty('MEDIUM');
        setTopic('');
        setSelectedTopicId(undefined);
        setAdditionalInfo('');
        onClose();
    };

    const getDifficultyLabel = (diff: 'EASY' | 'MEDIUM' | 'HARD') => {
        switch (diff) {
            case 'EASY': return t('createQuest.quizConfig.easy');
            case 'MEDIUM': return t('createQuest.quizConfig.medium');
            case 'HARD': return t('createQuest.quizConfig.hard');
            default: return diff;
        }
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
                            <Text style={styles.modalTitle}>{t('createQuest.addQuestion.title')}</Text>
                            <TouchableOpacity onPress={handleClose}>
                                <MaterialCommunityIcons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>{t('createQuest.addQuestion.questionLabel')}</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={question}
                                    onChangeText={setQuestion}
                                    placeholder={t('createQuest.addQuestion.questionPlaceholder')}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>{t('createQuest.addQuestion.answerLabel')}</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={answer}
                                    onChangeText={setAnswer}
                                    placeholder={t('createQuest.addQuestion.answerPlaceholder')}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>{t('createQuest.addQuestion.difficultyLabel')}</Text>
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
                                                {getDifficultyLabel(diff)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <TopicTreeSelector
                                    selectedTopicId={selectedTopicId}
                                    selectedTopicName={topic}
                                    onSelectTopic={handleSelectTopic}
                                    allowCreate={true}
                                    placeholder={t('createQuest.addQuestion.topicPlaceholder')}
                                    label={t('createQuest.addQuestion.topicLabel')}
                                    required={false}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>{t('createQuest.addQuestion.additionalInfoLabel')}</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={additionalInfo}
                                    onChangeText={setAdditionalInfo}
                                    placeholder={t('createQuest.addQuestion.additionalInfoPlaceholder')}
                                    multiline
                                    numberOfLines={2}
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                                <Text style={styles.cancelButtonText}>{t('createQuest.addQuestion.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                                <MaterialCommunityIcons name="check" size={20} color="#fff" />
                                <Text style={styles.submitButtonText}>{t('createQuest.addQuestion.submit')}</Text>
                            </TouchableOpacity>
                        </View>
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