// src/widgets/game-session/ui/GameContent.tsx
import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {QuestionCard} from '../../../shared/ui';
import {DiscussionPanel} from '../../../features/www-game-discussion';
import {SpeechResultDisplay} from '../../../features/speech-to-text';
import type {QuestionData} from '../../../entities/question';
import type {GameRound} from '../../../entities/game-session';

interface GameContentProps {
    question: QuestionData | null;
    round?: GameRound | null;
    speechToText: any;
    wwwDiscussion: any;
    onSubmitAnswer: (answer: string) => void;
}

export const GameContent: React.FC<GameContentProps> = ({
                                                            question,
                                                            round,
                                                            speechToText,
                                                            wwwDiscussion,
                                                            onSubmitAnswer,
                                                        }) => {
    if (!question) {
        return (
            <View style={[styles.container, styles.centered]}>
                {/* No question available */}
            </View>
        );
    }

    const showDiscussion = round?.phase === 'discussion';
    const showSpeechResults = speechToText.hasResults;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
                <QuestionCard
                    question={question.question}
                    difficulty={question.difficulty}
                    category={question.category}
                    timeLimit={round?.timeRemaining}
                    showHints={round?.phase === 'answer'}
                    hints={question.hints}
                />

                {showSpeechResults && (
                    <SpeechResultDisplay
                        maxHeight={150}
                        showHistory={false}
                        onResultPress={(text) => {
                            // Could auto-fill notes or answer
                            console.log('Selected speech result:', text);
                        }}
                    />
                )}

                {showDiscussion && (
                    <DiscussionPanel
                        question={{
                            ...question,
                            timeLimit: round?.timeRemaining || 60,
                        }}
                        onComplete={onSubmitAnswer}
                        showAIHost={true}
                        showNotes={true}
                    />
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 16,
        gap: 16,
    },
});