// src/screens/CreateWWWQuestScreen/components/BasicInfoForm.tsx
import React from 'react';
import {Text, TextInput, View} from 'react-native';
import {useAppStyles} from '../../../shared/ui/hooks/useAppStyles';

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
    const {form, theme} = useAppStyles();

    return (
        <View style={form.section}>
            <Text style={form.sectionTitle}>Basic Information</Text>

            <View style={form.formGroup}>
                <Text style={form.label}>Title</Text>
                <TextInput
                    style={form.input}
                    value={title}
                    onChangeText={onTitleChange}
                    placeholder="Enter quest title"
                    placeholderTextColor={theme.colors.text.disabled}
                />
            </View>

            <View style={form.formGroup}>
                <Text style={form.label}>Description</Text>
                <TextInput
                    style={[form.input, form.textArea]}
                    value={description}
                    onChangeText={onDescriptionChange}
                    placeholder="Describe your quest"
                    placeholderTextColor={theme.colors.text.disabled}
                    multiline
                    numberOfLines={3}
                />
            </View>

            <View style={form.formGroup}>
                <Text style={form.label}>Reward</Text>
                <TextInput
                    style={form.input}
                    value={reward}
                    onChangeText={onRewardChange}
                    placeholder="What's the reward?"
                    placeholderTextColor={theme.colors.text.disabled}
                />
            </View>
        </View>
    );
};

export default BasicInfoForm;