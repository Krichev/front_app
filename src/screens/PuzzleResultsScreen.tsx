// src/screens/PuzzleResultsScreen.tsx
import React from 'react';
import { 
    View, 
    Text, 
    SafeAreaView, 
    FlatList,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { useNavigation as useNav, useRoute as useRou, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppStyles } from '../shared/ui/hooks/useAppStyles';
import { createStyles } from '../shared/ui/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useGetPuzzleGameQuery, useGetPuzzleResultsQuery } from '../entities/PuzzleState/model/slice/puzzleApi';

type PuzzleResultsRouteProp = RouteProp<RootStackParamList, 'PuzzleResults'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PuzzleResults'>;

const PuzzleResultsScreen: React.FC = () => {
    const navigation = useNav<NavigationProp>();
    const route = useRou<PuzzleResultsRouteProp>();
    const { puzzleGameId } = route.params;
    const { screen, theme, card } = useAppStyles();

    const { data: gameData, isLoading: isGameLoading } = useGetPuzzleGameQuery(puzzleGameId);
    const { data: results = [], isLoading: isResultsLoading } = useGetPuzzleResultsQuery(puzzleGameId);

    const renderParticipant = ({ item, index }: { item: any, index: number }) => (
        <View style={[card.base, styles.participantCard]}>
            <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={styles.participantInfo}>
                <Text style={[styles.username, { color: theme.colors.text.primary }]}>{item.username}</Text>
                <Text style={[styles.stats, { color: theme.colors.text.secondary }]}>
                    {item.piecesPlacedCorrectly} pieces • {item.totalMoves} moves
                </Text>
            </View>
            <View style={styles.scoreContainer}>
                <Text style={[styles.score, { color: theme.colors.primary.main }]}>{item.score}</Text>
                <Text style={[styles.time, { color: theme.colors.text.secondary }]}>
                    {item.completionTimeMs ? `${(item.completionTimeMs / 1000).toFixed(1)}s` : 'DNF'}
                </Text>
            </View>
        </View>
    );

    if (isGameLoading || isResultsLoading) {
        return (
            <View style={[screen.container, styles.centered]}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
        );
    }

    return (
        <SafeAreaView style={screen.container}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Puzzle Results</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Home' })}>
                    <MaterialCommunityIcons name="home" size={28} color={theme.colors.text.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={results}
                keyExtractor={item => item.userId.toString()}
                renderItem={renderParticipant}
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <View style={styles.imageContainer}>
                            {/* In a real app we'd show the source image here */}
                            <MaterialCommunityIcons name="image-filter-hdr" size={80} color={theme.colors.primary.main} />
                            <Text style={[styles.revealText, { color: theme.colors.text.primary }]}>Image Revealed!</Text>
                        </View>
                        
                        <View style={styles.answerBox}>
                            <Text style={[styles.answerLabel, { color: theme.colors.text.secondary }]}>The answer was:</Text>
                            <Text style={[styles.answerValue, { color: theme.colors.primary.main }]}>{gameData?.game.answer}</Text>
                        </View>

                        <Text style={[styles.leaderboardTitle, { color: theme.colors.text.primary }]}>Leaderboard</Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />
        </SafeAreaView>
    );
};

const styles = createStyles((theme) => ({
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        height: 56,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    listContent: {
        padding: theme.spacing.md,
    },
    listHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    imageContainer: {
        width: '100%',
        height: 200,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    revealText: {
        marginTop: 12,
        fontSize: 18,
        fontWeight: '600',
    },
    answerBox: {
        alignItems: 'center',
        marginBottom: 32,
    },
    answerLabel: {
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    answerValue: {
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 4,
    },
    leaderboardTitle: {
        alignSelf: 'flex-start',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    participantCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginBottom: 8,
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankText: {
        fontWeight: 'bold',
    },
    participantInfo: {
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontWeight: '600',
    },
    stats: {
        fontSize: 12,
        marginTop: 2,
    },
    scoreContainer: {
        alignItems: 'flex-end',
    },
    score: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    time: {
        fontSize: 12,
    }
}));

export default PuzzleResultsScreen;
