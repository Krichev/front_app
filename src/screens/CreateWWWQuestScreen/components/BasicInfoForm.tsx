// src/screens/CreateWWWQuestScreen/components/BasicInfoForm.tsx
import React from 'react';
import {Text, TextInput, View} from 'react-native';
import {useTranslation} from 'react-i18next';
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
    const {t} = useTranslation();
    const {form, theme} = useAppStyles();

    return (
        <View style={form.section}>
            <Text style={form.sectionTitle}>{t('createQuest.basicInfo.sectionTitle')}</Text>

            <View style={form.formGroup}>
                <Text style={form.label}>{t('createQuest.basicInfo.title')}</Text>
                <TextInput
                    style={form.input}
                    value={title}
                    onChangeText={onTitleChange}
                    placeholder={t('createQuest.basicInfo.titlePlaceholder')}
                    placeholderTextColor={theme.colors.text.disabled}
                />
            </View>

            <View style={form.formGroup}>
                <Text style={form.label}>{t('createQuest.basicInfo.description')}</Text>
                <TextInput
                    style={[form.input, form.textArea]}
                    value={description}
                    onChangeText={onDescriptionChange}
                    placeholder={t('createQuest.basicInfo.descriptionPlaceholder')}
                    placeholderTextColor={theme.colors.text.disabled}
                    multiline
                    numberOfLines={3}
                />
            </View>

            <View style={form.formGroup}>
                <Text style={form.label}>{t('createQuest.basicInfo.reward')}</Text>
                <TextInput
                    style={form.input}
                    value={reward}
                    onChangeText={onRewardChange}
                    placeholder={t('createQuest.basicInfo.rewardPlaceholder')}
                    placeholderTextColor={theme.colors.text.disabled}
                />
            </View>
        </View>
    );
};

export default BasicInfoForm;