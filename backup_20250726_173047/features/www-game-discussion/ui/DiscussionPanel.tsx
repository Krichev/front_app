// src/features/www-game-discussion/ui/DiscussionPanel.tsx
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {DiscussionTimer} from './DiscussionTimer';
import {DiscussionNotes} from './DiscussionNotes';
import {AIHostPanel} from './AIHostPanel';
import {useWWWDiscussion} from '../lib/hooks';
import type {DiscussionQuestion} from '../model/types';

interface DiscussionPanelProps {
    question: DiscussionQuestion;
    onComplete?: (answer: string) => void;
    showAIHost?: boolean;
    showNotes?: boolean;
    style?: any;
}

export const DiscussionPanel: React.FC<DiscussionPanelProps> = ({
                                                                    question,
                                                                    onComplete,
                                                                    showAIHost = true,
                                                                    showNotes = true,
                                                                    style,
                                                                }) => {
    const {
        discussion,
        aiHost,
        isActive,
        timeRemaining,
        startDiscussion,
        pauseDiscussion,
        resumeDiscussion,
        analyzeDiscussion,
        completeDiscussion,
    } = useWWWDiscussion(question);

    const handleTimeUp = () => {
        if (aiHost.postDiscussionAnalysis) {
            analyzeDiscussion();
        }
    };

    const handleSubmitAnswer = (answer: string) => {
        const wasCorrect = answer.toLowerCase().trim() === question.answer.toLowerCase().trim();
        completeDiscussion(answer, wasCorrect);
        onComplete?.(answer);
    };

    return (
        <View style={[styles.container, style]}>
            <DiscussionTimer
                timeRemaining={timeRemaining}
                totalTime={question.timeLimit}
                isActive={isActive}
                onStart={() => startDiscussion(question.timeLimit)}
                onPause={pauseDiscussion}
                onResume={resumeDiscussion}
                onTimeUp={handleTimeUp}
            />

            {showNotes && (
                <DiscussionNotes
                    notes={discussion.notes}
                    phase={discussion.phase}
                    onSubmitAnswer={handleSubmitAnswer}
                />
            )}

            {showAIHost && aiHost.enabled && (
                <AIHostPanel
                    question={question}
                    discussion={discussion}
                    config={aiHost}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        gap: 16,
    },
});