// src/screens/PuzzleGamePlayScreen.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
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
import { RootStackParamList } from '../navigation/AppNavigator';
import { usePuzzleGameState } from '../features/PuzzleGame/hooks/usePuzzleGameState';
import { usePuzzleDragDrop } from '../features/PuzzleGame/hooks/usePuzzleDragDrop';
import { PuzzleBoard } from '../features/PuzzleGame/ui/PuzzleBoard';
import { PieceTray } from '../features/PuzzleGame/ui/PieceTray';
import { calculateGridSizing } from '../features/PuzzleGame/model/puzzleUtils';

type PuzzleGamePlayRouteProp = RouteProp<RootStackParamList, 'PuzzleGamePlay'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PuzzleGamePlay'>;

const PuzzleGamePlayScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<PuzzleGamePlayRouteProp>();
    
    // Safely access params - Hermes seals objects so destructuring missing optional props throws ReferenceError
    const puzzleGameId = route.params?.puzzleGameId;
    const gameMode = route.params?.gameMode;
    const gridRows = route.params?.gridRows;
    const gridCols = route.params?.gridCols;
    const timeLimitSeconds = route.params?.timeLimitSeconds;
    
    const { screen, theme, text, form } = useAppStyles();

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
        game
    } = usePuzzleGameState({
        puzzleGameId,
        gameMode,
        timeLimitSeconds
    });

    const { cellWidth, cellHeight } = useMemo(() => 
        calculateGridSizing(gridRows, gridCols), [gridRows, gridCols]);

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
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.text }]}>Preparing your puzzle...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={screen.container}>
            {/* Header / HUD */}
            <View style={styles.hud}>
                <View style={styles.timerContainer}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.text} />
                    <Text style={[styles.timerText, { color: theme.colors.text }]}>
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </Text>
                </View>
                
                <View style={styles.progressContainer}>
                    <Text style={[styles.progressText, { color: theme.colors.text }]}>
                        {Math.round(completionPercentage)}% Complete
                    </Text>
                </View>

                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="exit-to-app" size={24} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            {phase === 'WAITING_FOR_START' ? (
                <View style={styles.lobbyContainer}>
                    <Text style={[text.h2, { color: theme.colors.text }]}>Waiting Room</Text>
                    <Text style={[styles.lobbySub, { color: theme.colors.textSecondary }]}>
                        Pieces are ready!
                    </Text>
                    <TouchableOpacity 
                        style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
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
                        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                        onPress={() => setIsAnswerModalVisible(true)}
                    >
                        <MaterialCommunityIcons name="lightbulb-on" size={32} color="#FFF" />
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
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>What's in the picture?</Text>
                            <TouchableOpacity onPress={() => setIsAnswerModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>
                        
                        <TextInput
                            style={[form.input, { color: theme.colors.text, marginVertical: 20 }]}
                            value={answerText}
                            onChangeText={setAnswerText}
                            placeholder="Type your guess here..."
                            placeholderTextColor={theme.colors.textSecondary}
                            autoFocus
                        />

                        <TouchableOpacity 
                            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
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

const styles = StyleSheet.create({
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
        paddingHorizontal: 16,
        height: 60,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
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
        color: '#FFF',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
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
});

export default PuzzleGamePlayScreen;
