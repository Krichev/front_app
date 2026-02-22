import React from 'react';
import { Text, View } from 'react-native';
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
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Challenge Info</Text>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>{FormatterService.formatDate(createdAt)}</Text>
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Visibility</Text>
                <Text style={styles.infoValue}>{visibility}</Text>
            </View>
            {reward && (
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Reward</Text>
                    <Text style={styles.infoValue}>{reward}</Text>
                </View>
            )}
            {penalty && (
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Penalty</Text>
                    <Text style={styles.infoValue}>{penalty}</Text>
                </View>
            )}

            {verificationMethods.length > 0 && (
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Verification</Text>
                    <View style={styles.verificationMethods}>
                        {verificationMethods.map((method, index) => (
                            <View key={index} style={styles.verificationBadge}>
                                <Text style={styles.verificationText}>
                                    {method?.type ? method.type.charAt(0) + method.type.slice(1).toLowerCase() : 'Unknown'}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {targetGroup && (
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Group</Text>
                    <Text style={styles.infoValue}>{targetGroup}</Text>
                </View>
            )}
        </View>
    );
};
