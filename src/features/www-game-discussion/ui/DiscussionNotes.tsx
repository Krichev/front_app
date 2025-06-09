// src/features/www-game-discussion/ui/DiscussionNotes.tsx
import React, {useState} from 'react';
import {Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useWWWDiscussion} from '../lib/hooks';
import type {DiscussionPhase} from '../model/types';

interface DiscussionNotesProps {
    notes: string;
    phase: DiscussionPhase;
    onSubmitAnswer?: (answer: string) => void;
    editable?: boolean;
}

export const DiscussionNotes: React.FC<DiscussionNotesProps> = ({
                                                                    notes,
                                                                    phase,
                                                                    onSubmitAnswer,
                                                                    editable = true,
                                                                }) => {
    const { updateNotes, appendToNotes } = useWWWDiscussion();
    const [finalAnswer, setFinalAnswer] = useState('');
    const [isAnswerMode, setIsAnswerMode] = useState(false);

    const handleNotesChange = (text: string) => {
        if (editable) {
            updateNotes(text);
        }
    };

    const handleQuickAdd = (text: string) => {
        appendToNotes(text);
    };

    const handleSubmitAnswer = () => {
        if (finalAnswer.trim()) {
            Alert.alert(
                'Submit Answer',
                `Are you sure you want to submit: "${finalAnswer}"?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Submit',
                        onPress: () => {
                            onSubmitAnswer?.(finalAnswer.trim());
                            setFinalAnswer('');
                            setIsAnswerMode(false);
                        }
                    },
                ]
            );
        }
    };

    const quickNoteOptions = [
        'Key point: ',
        'Question about: ',
        'Possible answer: ',
        'Need to research: ',
        'Team thinks: ',
        'Alternative: ',
    ];

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Discussion Notes</Text>
                <View style={styles.headerButtons}>
                    {phase === 'answer' && !isAnswerMode && (
                        <TouchableOpacity
                            style={styles.answerButton}
                            onPress={() => setIsAnswerMode(true)}
                        >
                            <MaterialCommunityIcons name="check-circle" size={20} color="white" />
                            <Text style={styles.answerButtonText}>Answer</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Quick Add Buttons */}
            {editable && phase === 'discussion' && (
                <View style={styles.quickAddContainer}>
                    <Text style={styles.quickAddTitle}>Quick Add:</Text>
                    <View style={styles.quickAddButtons}>
                        {quickNoteOptions.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.quickAddButton}
                                onPress={() => handleQuickAdd(option)}
                            >
                                <Text style={styles.quickAddButtonText}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Notes Input */}
            <View style={styles.notesContainer}>
                <TextInput
                    style={styles.notesInput}
                    value={notes}
                    onChangeText={handleNotesChange}
                    placeholder="Write your discussion notes here..."
                    multiline
                    textAlignVertical="top"
                    editable={editable && phase !== 'complete'}
                />
            </View>

            {/* Answer Input Mode */}
            {isAnswerMode && (
                <View style={styles.answerContainer}>
                    <Text style={styles.answerLabel}>Final Answer:</Text>
                    <View style={styles.answerInputContainer}>
                        <TextInput
                            style={styles.answerInput}
                            value={finalAnswer}
                            onChangeText={setFinalAnswer}
                            placeholder="Enter your final answer..."
                            autoFocus
                        />
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmitAnswer}
                            disabled={!finalAnswer.trim()}
                        >
                            <MaterialCommunityIcons name="send" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={styles.cancelAnswerButton}
                        onPress={() => {
                            setIsAnswerMode(false);
                            setFinalAnswer('');
                        }}
                    >
                        <Text style={styles.cancelAnswerText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Notes Stats */}
            <View style={styles.stats}>
                <Text style={styles.statsText}>
                    {notes.length} characters • {notes.split(/\s+/).filter(w => w.length > 0).length} words
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    answerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#51cf66',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    answerButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    quickAddContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    quickAddTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
        marginBottom: 8,
    },
    quickAddButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    quickAddButton: {
        backgroundColor: '#f0f8ff',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#4dabf7',
    },
    quickAddButtonText: {
        fontSize: 12,
        color: '#4dabf7',
        fontWeight: '500',
    },
    notesContainer: {
        flex: 1,
        padding: 16,
    },
    notesInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
    },
    answerContainer: {
        padding: 16,
        backgroundColor: '#f8f9ff',
        borderTopWidth: 1,
        borderTopColor: '#e0e7ff',
    },
    answerLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    answerInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#4dabf7',
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    answerInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 12,
        color: '#333',
    },
    submitButton: {
        backgroundColor: '#4dabf7',
        padding: 8,
        borderRadius: 6,
        marginLeft: 8,
    },
    cancelAnswerButton: {
        alignSelf: 'center',
        paddingVertical: 4,
    },
    cancelAnswerText: {
        color: '#666',
        fontSize: 14,
    },
    stats: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    statsText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
});