// src/screens/WWWGamePlayScreen.tsx - Orchestration Layer
import React, { useEffect } from 'react';
import { SafeAreaView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useWWWGameState } from '../features/WWWGame/hooks/useWWWGameState';
import { useWWWGameController } from '../features/WWWGame/hooks/useWWWGameController';
import { useCountdownTimer } from '../shared/hooks/useCountdownTimer';
import { useAppStyles } from '../shared/ui/hooks/useAppStyles';
import { RootStackParamList } from '../navigation/AppNavigator';

import {
  WaitingPhase,
  QuestionPhase,
  DiscussionPhase,
  AnswerPhase,
  FeedbackPhase,
} from '../features/WWWGame/ui/phases';

type WWWGamePlayNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WWWGamePlay'>;
type WWWGamePlayRouteProp = RouteProp<RootStackParamList, 'WWWGamePlay'>;

const WWWGamePlayScreen: React.FC = () => {
  const route = useRoute<WWWGamePlayRouteProp>();
  const navigation = useNavigation<WWWGamePlayNavigationProp>();
  const { screen } = useAppStyles();
  
  const { sessionId, challengeId } = route.params;
  const gameSettings = route.params as any; // Legacy params support
  
  // State machine
  const { state, actions } = useWWWGameState();
  
  // API controller
  const controller = useWWWGameController(sessionId);
  
  // Timer (initialized when discussion starts)
  const timer = useCountdownTimer({
    duration: controller.session?.roundTimeSeconds || 60,
    onComplete: actions.timeUp,
  });

  // Current round data
  const currentRound = controller.rounds[state.currentRound];
  const isLastRound = state.currentRound >= controller.rounds.length - 1;

  // Initialize game when session data is loaded
  useEffect(() => {
    if (controller.session && controller.rounds.length > 0) {
      if (controller.session.status === 'IN_PROGRESS' && state.phase === 'waiting') {
        actions.startSession();
      }
    }
  }, [controller.session, controller.rounds, state.phase, actions]);

  // Phase-specific handlers
  const handleStartGame = async () => {
    try {
      if (controller.session?.status === 'IN_PROGRESS') {
        actions.startSession();
      } else {
        await controller.startSession();
        actions.startSession();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start session');
    }
  };

  const handleStartDiscussion = () => {
    const roundTime = controller.session?.roundTimeSeconds || 60;
    actions.startDiscussion(roundTime);
    timer.reset(roundTime);
    timer.start();
  };

  const handleSubmitAnswer = async () => {
    if (!currentRound) return;
    
    try {
      await controller.submitAnswer(currentRound.id, {
        teamAnswer: state.teamAnswer,
        playerWhoAnswered: state.selectedPlayer || 'Team',
        discussionNotes: state.discussionNotes,
      });
      actions.answerSubmitted();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit answer');
    }
  };

  const handleAudioRecordingComplete = async (audioFile: { uri: string; name: string; type: string }) => {
    if (!currentRound) return;

    try {
      await controller.submitAudioAnswer(
        currentRound.id,
        Number(currentRound.question.id),
        audioFile,
        {
          playerWhoAnswered: state.selectedPlayer || 'Team',
          discussionNotes: state.discussionNotes,
        }
      );
      actions.answerSubmitted();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit audio answer');
    }
  };

  const handleGameCompletion = async () => {
    try {
      await controller.completeGame();
      
      if (!controller.session) return;

      // Prepare results data
      const roundsData = controller.rounds.map(round => ({
        question: round.question.question,
        correctAnswer: round.question.answer,
        teamAnswer: round.teamAnswer || '',
        isCorrect: round.isCorrect,
        playerWhoAnswered: round.playerWhoAnswered || '',
        discussionNotes: round.discussionNotes || '',
      }));

      navigation.navigate('WWWGameResults', {
        teamName: controller.session.teamName,
        score: controller.session.correctAnswers,
        totalRounds: controller.session.totalRounds,
        roundsData: roundsData,
        challengeId: challengeId,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to complete game');
    }
  };

  // Render current phase
  const renderPhase = () => {
    // Show waiting phase if loading initially
    if (controller.isLoading && state.phase === 'waiting') {
      return (
        <WaitingPhase
          roundTime={60}
          onStart={() => {}}
          isLoading={true}
        />
      );
    }

    switch (state.phase) {
      case 'waiting':
        return (
          <WaitingPhase
            roundTime={controller.session?.roundTimeSeconds || 60}
            onStart={handleStartGame}
            isLoading={controller.isBeginningSession}
          />
        );
      case 'question':
        if (!currentRound) return null;
        return (
          <QuestionPhase
            question={currentRound.question}
            onStartDiscussion={() => {
              const isAudioChallenge = currentRound.question.questionType === 'AUDIO' && !!currentRound.question.audioChallengeType;
              if (isAudioChallenge) {
                // Skip discussion timer for audio challenges, go straight to answer/record
                actions.timeUp(); // Transition to answer phase directly
              } else {
                handleStartDiscussion();
              }
            }}
          />
        );
      case 'discussion':
        if (!currentRound) return null;
        return (
          <DiscussionPhase
            question={currentRound.question}
            timeLeft={timer.timeLeft}
            animation={timer.animation}
            notes={state.discussionNotes}
            onNotesChange={actions.setNotes}
            onSubmitEarly={() => {
              timer.pause();
              actions.timeUp();
            }}
            isVoiceEnabled={controller.session?.difficulty === 'EASY'}
          />
        );
      case 'answer':
        if (!currentRound) return null;
        return (
          <AnswerPhase
            question={currentRound.question}
            answer={state.teamAnswer}
            player={state.selectedPlayer}
            onAnswerChange={actions.setAnswer}
            onPlayerChange={actions.setPlayer}
            onSubmit={handleSubmitAnswer}
            isSubmitting={controller.isSubmittingAnswer || controller.isSubmittingAudio}
            gameSettings={gameSettings}
            isVoiceEnabled={controller.session?.difficulty === 'EASY'}
            onAudioRecordingComplete={handleAudioRecordingComplete}
          />
        );
      case 'feedback':
        if (!currentRound) return null;
        return (
          <FeedbackPhase
            roundData={currentRound}
            isCorrect={currentRound.isCorrect}
            isLastRound={isLastRound}
            onNextRound={actions.nextRound}
            onComplete={handleGameCompletion}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={screen.container}>
      {renderPhase()}
    </SafeAreaView>
  );
};

export default WWWGamePlayScreen;