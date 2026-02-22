import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles';

interface CreatorSectionProps {
    creatorId: string | undefined;
    onPress: () => void;
}

export const CreatorSection: React.FC<CreatorSectionProps> = ({
    creatorId,
    onPress,
}) => {
    const { t } = useTranslation();

    return (
        <TouchableOpacity style={styles.creatorSection} onPress={onPress}>
            <Text style={styles.sectionTitle}>{t('challengeDetails.creator.title')}</Text>
            <View style={styles.creatorInfo}>
                <Text style={styles.creatorName}>
                    {creatorId ? t('challengeDetails.creator.userId', { id: creatorId }) : t('challengeDetails.creator.unknown')}
                </Text>
            </View>
        </TouchableOpacity>
    );
};
