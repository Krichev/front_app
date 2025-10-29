// src/screens/CreateWWWQuestScreen/components/BasicInfoForm.tsx
import React from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';

interface BasicInfoFormProps {
    title: string;
    description: string;
    reward: string;
    onTitleChange: (text: string) => void;
    onDescriptionChange: (text: string) => void;
    onRewardChange: (text: string) => void;
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({
                                                         title,
                                                         description,
                                                         reward,
                                                         onTitleChange,
                                                         onDescriptionChange,
                                                         onRewardChange,
                                                     }) => {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={onTitleChange}
                    placeholder="Enter quest title"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={onDescriptionChange}
                    placeholder="Describe your quest"
                    multiline
                    numberOfLines={3}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Reward</Text>
                <TextInput
                    style={styles.input}
                    value={reward}
                    onChangeText={onRewardChange}
                    placeholder="What's the reward?"
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
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
});

export default BasicInfoForm;