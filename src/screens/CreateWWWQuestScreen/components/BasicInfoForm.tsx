// src/screens/CreateWWWQuestScreen/components/BasicInfoForm.tsx
import React from 'react';
import {Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useAppStyles} from '../../../shared/ui/hooks/useAppStyles';
import { LocalizedInput } from '../../../shared/ui/LocalizedInput';
import { LocalizedString } from '../../../shared/types/localized';

interface BasicInfoFormProps {
    title: LocalizedString;
    description: LocalizedString;
    reward: LocalizedString;
    onTitleChange: (value: LocalizedString) => void;
    onDescriptionChange: (value: LocalizedString) => void;
    onRewardChange: (value: LocalizedString) => void;
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
    const {form} = useAppStyles();

    return (
        <View style={form.section}>
            <Text style={form.sectionTitle}>{t('createQuest.basicInfo.sectionTitle')}</Text>

            <LocalizedInput
                label={t('createQuest.basicInfo.title')}
                value={title}
                onChangeLocalized={onTitleChange}
                placeholder={{
                    en: t('createQuest.basicInfo.titlePlaceholder'),
                    ru: t('createQuest.basicInfo.titlePlaceholder'),
                }}
                required
            />

            <LocalizedInput
                label={t('createQuest.basicInfo.description')}
                value={description}
                onChangeLocalized={onDescriptionChange}
                placeholder={{
                    en: t('createQuest.basicInfo.descriptionPlaceholder'),
                    ru: t('createQuest.basicInfo.descriptionPlaceholder'),
                }}
                multiline
                numberOfLines={3}
                required
            />

            <LocalizedInput
                label={t('createQuest.basicInfo.reward')}
                value={reward}
                onChangeLocalized={onRewardChange}
                placeholder={{
                    en: t('createQuest.basicInfo.rewardPlaceholder'),
                    ru: t('createQuest.basicInfo.rewardPlaceholder'),
                }}
            />
        </View>
    );
};

export default BasicInfoForm;