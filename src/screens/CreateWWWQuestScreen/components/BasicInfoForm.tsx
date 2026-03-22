// src/screens/CreateWWWQuestScreen/components/BasicInfoForm.tsx
import React from 'react';
import {Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useAppStyles} from '../../../shared/ui/hooks/useAppStyles';
import {createStyles} from '../../../shared/ui/theme/createStyles';
import {LocalizedInput} from '../../../shared/ui/LocalizedInput/LocalizedInput';
import { LocalizedString } from '../../../shared/types/localized';

interface BasicInfoFormProps {
    title: LocalizedString;
    description: LocalizedString;
    onTitleChange: (title: LocalizedString) => void;
    onDescriptionChange: (description: LocalizedString) => void;
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({
    title,
    description,
    onTitleChange,
    onDescriptionChange,
}) => {
    const {t} = useTranslation();
    const {theme} = useAppStyles();
    const styles = themeStyles;

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>{t('createQuest.basicInfo.sectionTitle')}</Text>

            <LocalizedInput
                label={t('createQuest.basicInfo.title')}
                value={title}
                onChangeLocalized={onTitleChange}
                placeholder={{
                    en: t('createQuest.basicInfo.titlePlaceholder'),
                    ru: t('createQuest.basicInfo.titlePlaceholder'),
                }}
            />

            <LocalizedInput
                label={t('createQuest.basicInfo.description')}
                value={description}
                onChangeLocalized={onDescriptionChange}
                multiline
                numberOfLines={4}
                placeholder={{
                    en: t('createQuest.basicInfo.descriptionPlaceholder'),
                    ru: t('createQuest.basicInfo.descriptionPlaceholder'),
                }}
            />
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing.md,
        color: theme.colors.text.primary,
    },
}));

export default BasicInfoForm;
