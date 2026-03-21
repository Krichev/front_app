// src/screens/PuzzleGamePlayScreen.tsx
import React, { useState, useMemo } from 'react';
import { 
    View, 
    Text, 
    SafeAreaView, 
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppStyles } from '../shared/ui/hooks/useAppStyles';
import { createStyles } from '../shared/ui/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { usePuzzleGameState } from '../features/PuzzleGame/hooks/usePuzzleGameState';
import { usePuzzleDragDrop } from '../features/PuzzleGame/hooks/usePuzzleDragDrop';
import { PuzzleBoard } from '../features/PuzzleGame/ui/PuzzleBoard';
import { PieceTray } from '../features/PuzzleGame/ui/PieceTray';
import { calculateGridSizing } from '../features/PuzzleGame/model/puzzleUtils';
import { useDimensions } from '../shared/hooks/useDimensions';

type PuzzleGamePlayRouteProp = RouteProp<RootStackParamList, 'PuzzleGamePlay'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PuzzleGamePlay'>;

const PuzzleGamePlayScreen: React.FC = () => {
    const { width: screenWidth, height: screenHeight } = useDimensions();
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<PuzzleGamePlayRouteProp>();
    
    // Safely access params - Hermes seals objects so destructuring missing optional props throws ReferenceError
    const puzzleGameId = route.params?.puzzleGameId;
    const gameMode = route.params?.gameMode;
    const gridRows = route.params?.gridRows;
    const gridCols = route.params?.gridCols;
    const timeLimitSeconds = route.params?.timeLimitSeconds;
    
    const { screen, theme, text: textStyles, form } = useAppStyles();

    const [boardLayout, setBoardLayout] = useState<any>(null);
    const [isAnswerModalVisible, setIsAnswerModalVisible] = useState(false);

    const {
        phase,
        pieces,
        isLoading,
        timeLeft,
        answerText,
        setAnswerText,
        submitAnswer,
        syncBoardState,
        startGame,
    } = usePuzzleGameState({
        puzzleGameId,
        gameMode,
        timeLimitSeconds
    });

    const { cellWidth, cellHeight } = useMemo(() => 
        calculateGridSizing(gridRows, gridCols, screenWidth, screenHeight), [gridRows, gridCols, screenWidth, screenHeight]);

    const {
        pieceStates,
        completionPercentage,
        handleDragEnd
    } = usePuzzleDragDrop({
        pieces,
        gridRows,
        gridCols,
        gameMode,
        boardLayout,
        cellWidth,
        cellHeight,
        onPiecePlaced: syncBoardState,
        disabled: phase !== 'PLAYING'
    });

    const handleSubmit = async () => {
        const result = await submitAnswer();
        if (result?.correct) {
            setIsAnswerModalVisible(false);
            navigation.navigate('PuzzleResults', { puzzleGameId });
        }
    };

    if (isLoading || phase === 'LOADING') {
        return (
            <View style={[screen.container, styles.centered]}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
                <Text style={[styles.loadingText, { color: theme.colors.text.primary }]}>Preparing your puzzle...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={screen.container}>
            {/* Header / HUD */}
            <View style={styles.hud}>
                <View style={styles.timerContainer}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.text.primary} />
                    <Text style={[styles.timerText, { color: theme.colors.text.primary }]}>
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </Text>
                </View>
                
                <View style={styles.progressContainer}>
                    <Text style={[styles.progressText, { color: theme.colors.text.primary }]}>
                        {Math.round(completionPercentage)}% Complete
                    </Text>
                </View>

                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="exit-to-app" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
            </View>

            {phase === 'WAITING_FOR_START' ? (
                <View style={styles.lobbyContainer}>
                    <Text style={[textStyles.pageTitle, { color: theme.colors.text.primary }]}>Waiting Room</Text>
                    <Text style={[styles.lobbySub, { color: theme.colors.text.secondary }]}>
                        Pieces are ready!
                    </Text>
                    <TouchableOpacity 
                        style={[styles.primaryButton, { backgroundColor: theme.colors.primary.main }]}
                        onPress={startGame}
                    >
                        <Text style={styles.buttonText}>Start Game</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.gameArea}>
                    <PuzzleBoard
                        gridRows={gridRows}
                        gridCols={gridCols}
                        cellWidth={cellWidth}
                        cellHeight={cellHeight}
                        pieceStates={pieceStates}
                        onDragEnd={handleDragEnd}
                        onLayout={setBoardLayout}
                    />

                    {gameMode === 'SHARED' && (
                        <PieceTray
                            pieces={pieceStates.filter(ps => ps.isInTray)}
                            cellWidth={cellWidth}
                            cellHeight={cellHeight}
                            onDragEnd={handleDragEnd}
                        />
                    )}

                    <TouchableOpacity 
                        style={[styles.fab, { backgroundColor: theme.colors.primary.main }]}
                        onPress={() => setIsAnswerModalVisible(true)}
                    >
                        <MaterialCommunityIcons name="lightbulb-on" size={32} color={theme.colors.neutral.white} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Answer Modal */}
            <Modal
                visible={isAnswerModalVisible}
                transparent
                animationType="slide"
            >
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.background.paper }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>What's in the picture?</Text>
                            <TouchableOpacity onPress={() => setIsAnswerModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={theme.colors.text.primary} />
                            </TouchableOpacity>
                        </View>
                        
                        <TextInput
                            style={[form.input, { color: theme.colors.text.primary, marginVertical: 20 }]}
                            value={answerText}
                            onChangeText={setAnswerText}
                            placeholder="Type your guess here..."
                            placeholderTextColor={theme.colors.text.secondary}
                            autoFocus
                        />

                        <TouchableOpacity 
                            style={[styles.primaryButton, { backgroundColor: theme.colors.primary.main }]}
                            onPress={handleSubmit}
                        >
                            <Text style={styles.buttonText}>Submit Answer</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = createStyles((theme) => ({
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    hud: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        height: 60,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    timerText: {
        marginLeft: 6,
        fontWeight: 'bold',
        fontSize: 16,
    },
    progressContainer: {
        flex: 1,
        alignItems: 'center',
    },
    progressText: {
        fontWeight: '600',
    },
    gameArea: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 20,
    },
    lobbyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    lobbySub: {
        fontSize: 16,
        marginVertical: 20,
    },
    primaryButton: {
        height: 50,
        paddingHorizontal: 30,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    buttonText: {
        color: theme.colors.neutral.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: theme.colors.neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay.medium,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    }
}));

export default PuzzleGamePlayScreen;
