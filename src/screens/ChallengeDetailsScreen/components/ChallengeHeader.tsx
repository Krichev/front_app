import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles';

interface ChallengeHeaderProps {
    title: string;
    type: string;
    status: string;
    isCancelled: boolean;
    userIsCreator: boolean;
    isDeleting: boolean;
    onDelete: () => void;
}

export const ChallengeHeader: React.FC<ChallengeHeaderProps> = ({
    title,
    type,
    status,
    isCancelled,
    userIsCreator,
    isDeleting,
    onDelete,
}) => {
    const { t } = useTranslation();

    return (
        <>
            {isCancelled && (
                <View style={styles.cancelledBanner}>
                    <MaterialCommunityIcons name="cancel" size={24} color="#fff" />
                    <Text style={styles.cancelledBannerText}>
                        {t('challengeDetails.messages.cancelled')}
                    </Text>
                </View>
            )}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>{title}</Text>

                        <View style={styles.badgeContainer}>
                            <View style={styles.typeBadge}>
                                <Text style={styles.badgeText}>{type}</Text>
                            </View>
                            {status && (
                                <View style={[
                                    styles.statusBadge,
                                    status === 'ACTIVE' && styles.statusActive,
                                    status === 'COMPLETED' && styles.statusCompleted,
                                    status === 'FAILED' && styles.statusFailed,
                                ]}>
                                    <Text style={styles.badgeText}>{status}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {userIsCreator && (
                        <TouchableOpacity
                            style={styles.deleteHeaderButton}
                            onPress={onDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <MaterialCommunityIcons name="delete" size={24} color="white" />
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </>
    );
};
