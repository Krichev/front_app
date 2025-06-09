// src/widgets/game-session/ui/GameSessionWidget.tsx
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {GameHeader} from './GameHeader';
import {GameContent} from './GameContent';
import {GameFooter} from './GameFooter';
import {useGameSessionWidget} from '../lib/hooks';
import type {GameSession} from '../../../entities/game-session';

interface GameSessionWidgetProps {
    sessionId?: string;
    onGameEnd?: (session: GameSession) => void;
    style?: any;
}

export const GameSessionWidget: React.FC<GameSessionWidgetProps> = ({
                                                                        sessionId,
                                                                        onGameEnd,
                                                                        style,
                                                                    }) => {
    const {
        gameSession,
        currentRound,
        currentQuestion,
        isLoading,
        speechToText,
        wwwDiscussion,
        verification,
        startGame,
        nextRound,
        endGame,
        submitAnswer,
        isGameActive,
        gameProgress,
    } = useGameSessionWidget();

    const handleGameEnd = () => {
        endGame();
        if (gameSession && onGameEnd) {
            onGameEnd(gameSession);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                {/* Loading component would go here */}
            </View>
        );
    }

    if (!gameSession || !isGameActive) {
        return (
            <View style={[styles.container, styles.centered]}>
                {/* Game not started or ended - show start screen */}
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            <GameHeader
                session={gameSession}
                currentRound={currentRound}
                progress={gameProgress}
                speechIndicator={speechToText.isRecording}
            />

            <GameContent
                question={currentQuestion}
                round={currentRound}
                speechToText={speechToText}
                wwwDiscussion={wwwDiscussion}
                onSubmitAnswer={submitAnswer}
            />

            <GameFooter
                session={gameSession}
                verification={verification}
                onNextRound={nextRound}
                onEndGame={handleGameEnd}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});