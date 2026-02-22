import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles';

interface DescriptionSectionProps {
    description: string;
}

export const DescriptionSection: React.FC<DescriptionSectionProps> = ({
    description,
}) => {
    const { t } = useTranslation();

    return (
        <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>{t('challengeDetails.description.title')}</Text>
            <Text style={styles.descriptionText}>{description}</Text>
        </View>
    );
};
