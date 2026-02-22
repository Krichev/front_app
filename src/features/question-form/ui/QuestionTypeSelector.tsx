// questApp/src/features/question-form/ui/QuestionTypeSelector.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { QuestionType } from '../model/types';
import { DEFAULT_AUDIO_CONFIG } from '../../../screens/components/AudioChallengeSection';
import { AudioChallengeConfig } from '../../../screens/components/AudioChallengeSection';

interface QuestionTypeSelectorProps {
    questionType: QuestionType;
    setQuestionType: (type: QuestionType) => void;
    setAudioConfig: (config: AudioChallengeConfig) => void;
    handleRemoveMedia: () => void;
    isEditing: boolean;
}

export const QuestionTypeSelector: React.FC<QuestionTypeSelectorProps> = ({
    questionType,
    setQuestionType,
    setAudioConfig,
    handleRemoveMedia,
    isEditing
}) => {
    const { t } = useTranslation();

    if (isEditing) {
        return null;
    }

    return (
        <View style={styles.formGroup}>
            <Text style={styles.label}>{t('mediaQuestion.questionTypeLabel')} *</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={questionType}
                    onValueChange={(value) => {
                        const oldType = questionType;
                        setQuestionType(value);
                        // Reset audio config when switching away from AUDIO
                        if (value !== 'AUDIO') {
                            setAudioConfig(DEFAULT_AUDIO_CONFIG);
                            // Also clear any selected media if switching from AUDIO
                            if (oldType === 'AUDIO') {
                                handleRemoveMedia();
                            }
                        }
                    }}
                    style={styles.picker}
                >
                    <Picker.Item label={t('mediaQuestion.textQuestion')} value="TEXT" />
                    <Picker.Item label={t('mediaQuestion.imageQuestion')} value="IMAGE" />
                    <Picker.Item label={t('mediaQuestion.videoQuestion')} value="VIDEO" />
                    <Picker.Item label={t('mediaQuestion.audioChallenge')} value="AUDIO" />
                </Picker>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
});
