import React from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LocalizedInput } from '../../../shared/ui/LocalizedInput';
import { styles } from '../styles';
import { CreateChallengeFormData } from '../hooks/useCreateChallengeForm';
import { ChallengeType, ChallengeVisibility, ChallengeFrequency } from '../../../app/types';

interface ChallengeBasicInfoSectionProps {
    formData: CreateChallengeFormData;
    onUpdate: (field: keyof CreateChallengeFormData, value: any) => void;
}

const CHALLENGE_TYPE_OPTIONS = [
    { label: 'Quest', value: 'QUEST' },
    { label: 'Quiz', value: 'QUIZ' },
    { label: 'Activity Partner', value: 'ACTIVITY_PARTNER' },
    { label: 'Fitness Tracking', value: 'FITNESS_TRACKING' },
    { label: 'Habit Building', value: 'HABIT_BUILDING' },
];

const VISIBILITY_OPTIONS = [
    { label: 'Public', value: 'PUBLIC' },
    { label: 'Private', value: 'PRIVATE' },
    { label: 'Group Only', value: 'GROUP_ONLY' },
];

const FREQUENCY_OPTIONS = [
    { label: 'One Time', value: 'ONE_TIME' },
    { label: 'Daily', value: 'DAILY' },
    { label: 'Weekly', value: 'WEEKLY' },
];

export const ChallengeBasicInfoSection: React.FC<ChallengeBasicInfoSectionProps> = ({
    formData,
    onUpdate,
}) => {
    return (
        <>
            {/* Title */}
            <View style={styles.formGroup}>
                <LocalizedInput
                    label="Title *"
                    value={formData.title}
                    onChangeLocalized={(text) => onUpdate('title', text)}
                    placeholder={{
                        en: 'Enter challenge title',
                        ru: 'Введите название челленджа'
                    }}
                    required
                />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
                <LocalizedInput
                    label="Description *"
                    value={formData.description}
                    onChangeLocalized={(text) => onUpdate('description', text)}
                    placeholder={{
                        en: 'Describe your challenge',
                        ru: 'Опишите ваш челлендж'
                    }}
                    multiline
                    numberOfLines={3}
                    required
                />
            </View>

            {/* Type */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>Challenge Type</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={formData.type}
                        onValueChange={(value) => onUpdate('type', value)}
                        style={styles.picker}
                    >
                        {CHALLENGE_TYPE_OPTIONS.map((option) => (
                            <Picker.Item key={option.value} label={option.label} value={option.value} />
                        ))}
                    </Picker>
                </View>
            </View>

            {/* Visibility */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>Visibility</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={formData.visibility}
                        onValueChange={(value) => onUpdate('visibility', value)}
                        style={styles.picker}
                    >
                        {VISIBILITY_OPTIONS.map((option) => (
                            <Picker.Item key={option.value} label={option.label} value={option.value} />
                        ))}
                    </Picker>
                </View>
            </View>

            {/* Frequency */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>Frequency</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={formData.frequency}
                        onValueChange={(value) => onUpdate('frequency', value)}
                        style={styles.picker}
                    >
                        {FREQUENCY_OPTIONS.map((option) => (
                            <Picker.Item key={option.value} label={option.label} value={option.value} />
                        ))}
                    </Picker>
                </View>
            </View>
        </>
    );
};
