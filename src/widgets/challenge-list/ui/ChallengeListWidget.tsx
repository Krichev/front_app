// src/widgets/challenge-list/ui/ChallengeListWidget.tsx
import React from 'react';
import {FlatList, RefreshControl, StyleSheet, View} from 'react-native';
import {ChallengeCard} from 'entities/challenge/ui';
import {ChallengeFilters} from './ChallengeFilters.tsx';
import {VerificationModal} from 'features/challenge-verification';
import {useChallengeListWidget} from '../lib/hooks.ts';
import type {Challenge} from 'entities/challenge';

interface ChallengeListWidgetProps {
    onChallengePress?: (challenge: Challenge) => void;
    showFilters?: boolean;
    showVerification?: boolean;
    style?: any;
}

export const ChallengeListWidget: React.FC<ChallengeListWidgetProps> = ({
                                                                            onChallengePress,
                                                                            showFilters = true,
                                                                            showVerification = true,
                                                                            style,
                                                                        }) => {
    const {
        challenges,
        isLoading,
        filters,
        verification,
        refreshChallenges,
        updateFilters,
        joinChallenge,
        startVerification,
    } = useChallengeListWidget();

    const handleChallengePress = (challenge: Challenge) => {
        if (onChallengePress) {
            onChallengePress(challenge);
        }
    };

    const handleJoinChallenge = (challenge: Challenge) => {
        if (challenge.verificationMethod && challenge.verificationMethod.length > 0) {
            startVerification(challenge.id, challenge.verificationMethod);
        } else {
            joinChallenge(challenge.id);
        }
    };

    const renderChallenge = ({ item }: { item: Challenge }) => (
        <ChallengeCard
            challenge={item}
            onPress={() => handleChallengePress(item)}
            onJoin={() => handleJoinChallenge(item)}
            style={styles.challengeCard}
        />
    );

    return (
        <View style={[styles.container, style]}>
            {showFilters && (
                <ChallengeFilters
                    selectedType={filters.type}
                    selectedStatus={filters.status}
                    searchQuery={filters.search}
                    onSelectType={(type) => updateFilters({ type })}
                    onSelectStatus={(status) => updateFilters({ status })}
                    onSearch={(search) => updateFilters({ search })}
                />
            )}

            <FlatList
                data={challenges}
                renderItem={renderChallenge}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={refreshChallenges}
                    />
                }
                showsVerticalScrollIndicator={false}
            />

            {showVerification && <VerificationModal />}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    challengeCard: {
        marginBottom: 12,
    },
});
