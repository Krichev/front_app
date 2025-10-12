// src/components/ChallengeCard/ChallengeCard.tsx
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ApiChallenge, CurrencyType, PaymentType} from '../../entities/ChallengeState/model/types/challenge.types';

interface ChallengeCardProps {
    challenge: ApiChallenge;
    onPress: () => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, onPress }) => {

    const formatCurrency = (amount: number, currency: CurrencyType) => {
        if (currency === CurrencyType.POINTS) {
            return `${amount.toLocaleString()} pts`;
        }

        const symbols: Record<string, string> = {
            USD: '$',
            EUR: '€',
            GBP: '£',
            CAD: 'C$',
            AUD: 'A$',
        };

        return `${symbols[currency] || currency}${amount.toFixed(2)}`;
    };

    const getVisibilityBadge = () => {
        if (challenge.visibility === 'PRIVATE') {
            return <View style={styles.privateBadge}><Text style={styles.badgeText}>🔒 Private</Text></View>;
        }
        return null;
    };

    const getPaymentBadge = () => {
        if (challenge.paymentType === PaymentType.FREE || !challenge.hasEntryFee) {
            return <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>FREE</Text></View>;
        }

        if (challenge.hasEntryFee && challenge.entryFeeAmount) {
            const isPoints = challenge.entryFeeCurrency === CurrencyType.POINTS;
            return (
                <View style={[styles.paidBadge, isPoints && styles.pointsBadge]}>
                    <Text style={styles.paidBadgeText}>
                        {formatCurrency(challenge.entryFeeAmount, challenge.entryFeeCurrency!)}
                    </Text>
                </View>
            );
        }

        return null;
    };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title} numberOfLines={1}>{challenge.title}</Text>
                    {getVisibilityBadge()}
                </View>
                <View style={styles.badges}>
                    {getPaymentBadge()}
                </View>
            </View>

            <Text style={styles.description} numberOfLines={2}>
                {challenge.description || 'No description provided'}
            </Text>

            <View style={styles.metadata}>
                <View style={styles.metadataItem}>
                    <Text style={styles.metadataLabel}>Type:</Text>
                    <Text style={styles.metadataValue}>{challenge.type}</Text>
                </View>
                <View style={styles.metadataItem}>
                    <Text style={styles.metadataLabel}>Participants:</Text>
                    <Text style={styles.metadataValue}>{challenge.participantCount || 0}</Text>
                </View>
                {challenge.frequency && (
                    <View style={styles.metadataItem}>
                        <Text style={styles.metadataLabel}>Frequency:</Text>
                        <Text style={styles.metadataValue}>{challenge.frequency}</Text>
                    </View>
                )}
            </View>

            {challenge.hasPrize && challenge.prizeAmount && (
                <View style={styles.prizeContainer}>
                    <Text style={styles.prizeLabel}>🏆 Prize:</Text>
                    <Text style={styles.prizeAmount}>
                        {formatCurrency(challenge.prizeAmount, challenge.prizeCurrency!)}
                    </Text>
                </View>
            )}

            {challenge.prizePool && challenge.prizePool > 0 && (
                <View style={styles.prizePoolContainer}>
                    <Text style={styles.prizePoolLabel}>💰 Prize Pool:</Text>
                    <Text style={styles.prizePoolAmount}>
                        {formatCurrency(challenge.prizePool, challenge.prizeCurrency || CurrencyType.USD)}
                    </Text>
                </View>
            )}

            <View style={styles.footer}>
                <Text style={styles.creator}>Created by {challenge.creatorUsername}</Text>
                {challenge.userIsCreator && (
                    <View style={styles.creatorBadge}>
                        <Text style={styles.creatorBadgeText}>Your Challenge</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    titleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        flex: 1,
        marginRight: 8,
    },
    badges: {
        flexDirection: 'row',
        gap: 8,
    },
    privateBadge: {
        backgroundColor: '#757575',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginLeft: 8,
    },
    badgeText: {
        fontSize: 11,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    freeBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    freeBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    paidBadge: {
        backgroundColor: '#FF5722',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pointsBadge: {
        backgroundColor: '#FFD700',
    },
    paidBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
        lineHeight: 20,
    },
    metadata: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
    },
    metadataItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metadataLabel: {
        fontSize: 12,
        color: '#999',
        marginRight: 4,
    },
    metadataValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },
    prizeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        padding: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    prizeLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2E7D32',
        marginRight: 8,
    },
    prizeAmount: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1B5E20',
    },
    prizePoolContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        padding: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    prizePoolLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#E65100',
        marginRight: 8,
    },
    prizePoolAmount: {
        fontSize: 14,
        fontWeight: '700',
        color: '#BF360C',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    creator: {
        fontSize: 12,
        color: '#999',
    },
    creatorBadge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    creatorBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1976D2',
    },
});