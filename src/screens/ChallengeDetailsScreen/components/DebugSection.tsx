import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles';

interface DebugSectionProps {
    userIsCreator: boolean;
    hasUserJoined: boolean;
    participants: any;
}

export const DebugSection: React.FC<DebugSectionProps> = ({
    userIsCreator,
    hasUserJoined,
    participants,
}) => {
    const { t } = useTranslation();

    return (
        <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>{t('challengeDetails.debug.title')}</Text>
            <Text style={styles.debugText}>{t('challengeDetails.debug.isCreator')} {userIsCreator ? t('common.yes') : t('common.no')}</Text>
            <Text style={styles.debugText}>{t('challengeDetails.debug.hasJoined')} {hasUserJoined ? t('common.yes') : t('common.no')}</Text>
            <Text style={styles.debugText}>{t('challengeDetails.debug.participants')} {JSON.stringify(participants)}</Text>
        </View>
    );
};
