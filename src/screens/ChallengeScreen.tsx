// src/screens/ChallengeScreen.tsx - COMPLETE FINAL VERSION
import React, {useMemo, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {NativeStackNavigationProp} from "@react-navigation/native-stack";
import {useGetChallengesQuery} from "../entities/ChallengeState/model/slice/challengeApi";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ChallengeFilters from './components/ChallengeFilters';
import QuizChallengeCard from '../entities/ChallengeState/ui/QuizChallengeCard';
import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';

// Define the types for the navigation parameters
type RootStackParamList = {
    Challenges: { initialFilter?: string };
    ChallengeDetails: { challengeId: string };
    CreateChallenge: undefined;
    CreateWWWQuest: undefined;
};

type MainTabParamList = {
    Challenges: { initialFilter?: string };
};

type ChallengesScreenRouteProp = RouteProp<MainTabParamList, 'Challenges'>;
type ChallengesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Challenges'>;

const ChallengesScreen: React.FC = () => {
    const { t } = useTranslation();
    const route = useRoute<ChallengesScreenRouteProp>();
    const navigation = useNavigation<ChallengesScreenNavigationProp>();
    const {user} = useSelector((state: RootState) => state.auth);

    // If the screen was navigated to with an initial filter, use it
    const initialFilterType = route.params?.initialFilter || null;
    const [selectedType, setSelectedType] = useState<string | null>(initialFilterType);

    const [showParticipating, setShowParticipating] = useState<boolean>(true);
    const [showCreated, setShowCreated] = useState<boolean>(false);

    // RTK Query call to fetch challenges
    const {data: challenges, error, isLoading, refetch} = useGetChallengesQuery({
        page: 0,
        limit: 50,
        type: selectedType === 'WWW_QUIZ' ? 'QUIZ' : selectedType,
        participant_id: showParticipating ? user?.id : undefined,
        creator_id: showCreated ? user?.id : undefined,
    });

    const filteredChallenges = useMemo(() => {
        if (!challenges) return [];

        return challenges.filter(challenge => {
            // participants can be string[], string, or null - need to handle all cases
            const participants = Array.isArray(challenge.participants)
                ? challenge.participants
                : typeof challenge.participants === 'string'
                    ? [challenge.participants]
                    : [];

            const isParticipant = participants.includes(user?.id || '');
            const isCreator = challenge.creator_id === user?.id;

            if (showParticipating && !showCreated) {
                return isParticipant && !isCreator;
            }
            if (!showParticipating && showCreated) {
                return isCreator;
            }
            if (showParticipating && showCreated) {
                return isParticipant || isCreator;
            }
            return false;
        });
    }, [challenges, showParticipating, showCreated, user?.id]);

    // Simplified create challenge menu - 2 options
    const handleCreateChallengePress = () => {
        Alert.alert(
            t('challenges.createTitle'),
            t('challenges.createMessage'),
            [
                {
                    text: t('challenges.quizChallenge'),
                    onPress: () => navigation.navigate('CreateWWWQuest')
                },
                {
                    text: t('challenges.standardChallenge'),
                    onPress: () => navigation.navigate('CreateChallenge')
                },
                {
                    text: t('common.cancel'),
                    style: 'cancel'
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Screen Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('challenges.title')}</Text>

                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={() => refetch()}
                >
                    <MaterialCommunityIcons name="refresh" size={24} color="white"/>
                </TouchableOpacity>
            </View>

            {/* Challenge Filters */}
            <ChallengeFilters
                selectedType={selectedType}
                onSelectType={setSelectedType}
            />
            <View style={styles.roleFiltersContainer}>
                <Text style={styles.filterLabel}>{t('challenges.filterLabel')}</Text>
                <View style={styles.checkboxRow}>
                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => setShowParticipating(!showParticipating)}
                    >
                        <View style={[styles.checkbox, showParticipating && styles.checkboxChecked]}>
                            {showParticipating && (
                                <MaterialCommunityIcons name="check" size={16} color="white" />
                            )}
                        </View>
                        <Text style={styles.checkboxLabel}>{t('challenges.participant')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => setShowCreated(!showCreated)}
                    >
                        <View style={[styles.checkbox, showCreated && styles.checkboxChecked]}>
                            {showCreated && (
                                <MaterialCommunityIcons name="check" size={16} color="white" />
                            )}
                        </View>
                        <Text style={styles.checkboxLabel}>{t('challenges.creator')}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Main content area */}
            <View style={styles.content}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4CAF50"/>
                        <Text style={styles.loadingText}>{t('challenges.loading')}</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <MaterialCommunityIcons name="alert-circle" size={48} color="#F44336"/>
                        <Text style={styles.errorText}>{t('challenges.error')}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                            <Text style={styles.retryButtonText}>{t('challenges.retry')}</Text>
                        </TouchableOpacity>
                    </View>
                ) : filteredChallenges.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="trophy-outline" size={64} color="#999"/>
                        <Text style={styles.emptyText}>{t('challenges.emptyTitle')}</Text>
                        <Text style={styles.emptySubtext}>
                            {showParticipating && !showCreated
                                ? t('challenges.emptyJoined')
                                : !showParticipating && showCreated
                                    ? t('challenges.emptyCreated')
                                    : t('challenges.emptyAdjust')}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredChallenges}
                        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                        renderItem={({item}) => (
                            <QuizChallengeCard
                                challenge={item}
                                onPress={() => navigation.navigate('ChallengeDetails', {challengeId: item.id!.toString()})}
                            />
                        )}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={handleCreateChallengePress}
            >
                <MaterialCommunityIcons name="plus" size={30} color="white"/>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#4CAF50',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    refreshButton: {
        padding: 8,
    },
    roleFiltersContainer: {
        backgroundColor: 'white',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    filterLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
        fontWeight: '500',
    },
    checkboxRow: {
        flexDirection: 'row',
        gap: 20,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#4CAF50',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#4CAF50',
    },
    checkboxLabel: {
        fontSize: 16,
        color: '#333',
    },
    content: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    retryButton: {
        marginTop: 16,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
});

export default ChallengesScreen;