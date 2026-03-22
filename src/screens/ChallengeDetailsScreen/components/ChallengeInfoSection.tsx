import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles';
import { FormatterService } from '../../../services/verification/ui/Services';

interface ChallengeInfoSectionProps {
    createdAt: string;
    visibility: string;
    reward?: string;
    penalty?: string;
    verificationMethods: any[];
    targetGroup?: string;
}

export const ChallengeInfoSection: React.FC<ChallengeInfoSectionProps> = ({
    createdAt,
    visibility,
    reward,
    penalty,
    verificationMethods,
    targetGroup,
}) => {
    const { t } = useTranslation();

    const visibilityLabels: Record<string, string> = {
        PUBLIC: t('common.visibility.public'),
        PRIVATE: t('common.visibility.private'),
        GROUP_ONLY: t('common.visibility.groupOnly'),
    };

    const verificationLabels: Record<string, string> = {
        PHOTO: t('challengeDetails.verification.photo'),
        LOCATION: t('challengeDetails.verification.location'),
        QUIZ: t('challengeDetails.verification.quiz'),
        MANUAL: t('challengeDetails.verification.manual'),
        FITNESS: t('challengeDetails.verification.fitness'),
        ACTIVITY: t('challengeDetails.verification.activity'),
    };

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('challengeDetails.info.title')}</Text>
            
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('challengeDetails.info.created')}</Text>
                <Text style={styles.infoValue}>{FormatterService.formatDate(createdAt)}</Text>
            </View>

            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('challengeDetails.info.visibility')}</Text>
                <Text style={styles.infoValue}>
                    {visibilityLabels[visibility] || visibility}
                </Text>
            </View>

            {reward && (
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('challengeDetails.info.reward')}</Text>
                    <Text style={styles.infoValue}>{reward}</Text>
                </View>
            )}

            {penalty && (
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('challengeDetails.info.penalty')}</Text>
                    <Text style={styles.infoValue}>{penalty}</Text>
                </View>
            )}

            {verificationMethods.length > 0 && (
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('challengeDetails.info.verification')}</Text>
                    <View style={styles.verificationMethods}>
                        {verificationMethods.map((method, index) => (
                            <View key={index} style={styles.verificationBadge}>
                                <Text style={styles.verificationText}>
                                    {method?.type ? (verificationLabels[method.type] || method.type) : t('challengeDetails.info.unknown')}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {targetGroup && (
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('challengeDetails.info.group')}</Text>
                    <Text style={styles.infoValue}>{targetGroup}</Text>
                </View>
            )}
        </View>
    );
};
