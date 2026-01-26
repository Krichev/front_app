// src/screens/WWWGamePlayScreen.tsx - Orchestration Layer
import React, { useEffect, useCallback, useRef } from 'react';
import { SafeAreaView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useWWWGameState } from '../features/WWWGame/hooks/useWWWGameState';
import { useWWWGameController } from '../features/WWWGame/hooks/useWWWGameController';
import { useReadingTime } from '../features/WWWGame/hooks/useReadingTime';
import { useCountdownTimer } from '../shared/hooks/useCountdownTimer';
import { useAppStyles } from '../shared/ui/hooks/useAppStyles';
import { RootStackParamList } from '../navigation/AppNavigator';

import {
  WaitingPhase,
  DiscussionPhase,
  AnswerPhase,
  FeedbackPhase,
  ReadingPhase,
  MediaPlaybackPhase,
} from '../features/WWWGame/ui/phases';

type WWWGamePlayNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WWWGamePlay'>;
type WWWGamePlayRouteProp = RouteProp<RootStackParamList, 'WWWGamePlay'>;

const WWWGamePlayScreen: React.FC = () => {
  const route = useRoute<WWWGamePlayRouteProp>();
  const navigation = useNavigation<WWWGamePlayNavigationProp>();
  const { screen } = useAppStyles();
  
  const { sessionId, challengeId } = route.params;
  const gameSettings = route.params as any; // Legacy params support

  // Guard clause for missing sessionId
  useEffect(() => {
    if (!sessionId) {
      Alert.alert('Error', 'Session ID is required to play');
      navigation.goBack();
    }
  }, [sessionId, navigation]);

  // API controller - only if sessionId exists
  const controller = useWWWGameController(sessionId || '');

  // State machine
  const { state, actions } = useWWWGameState();
  const { calculateReadingTime } = useReadingTime();

  // Timer (initialized when discussion starts)
  const timer = useCountdownTimer({
    duration: controller.session?.roundTimeSeconds || 60,
    onComplete: actions.timeUp,
  });
  const { start: timerStart, reset: timerReset, pause: timerPause } = timer;

  // Current round data
  const currentRound = controller.rounds[state.currentRound];
  const isLastRound = state.currentRound >= controller.rounds.length - 1;

  const handleGameCompletion = useCallback(async () => {
    try {
      await controller.completeGame();

      if (!controller.session) { return; }

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
  }, [controller, navigation, challengeId]);

  // Auto-start discussion timer when entering discussion phase
  const prevPhaseRef = useRef<string>(state.phase);
  const prevRoundRef = useRef<number>(state.currentRound);
  const configuredRoundTime = controller.session?.roundTimeSeconds || 60;

  const handleNextRound = useCallback(() => {
    actions.nextRound(configuredRoundTime);
  }, [actions, configuredRoundTime]);

  // Initialize game when session data is loaded
  useEffect(() => {
    if (controller.session && controller.rounds.length > 0) {
      if (controller.session.status === 'IN_PROGRESS' && state.phase === 'waiting' && !state.gameStartTime) {
        const currentRoundIndex = controller.session.completedRounds || 0;
        if (currentRoundIndex < controller.rounds.length) {
          actions.setRound(currentRoundIndex);
          actions.startSession(configuredRoundTime);
        } else {
          // All rounds completed, show results?
          handleGameCompletion();
        }
      }
    }
  }, [controller.session, controller.rounds, state.phase, state.gameStartTime, actions, handleGameCompletion, configuredRoundTime]);

  // Orchestration: Determine sub-phase when starting round
  useEffect(() => {
    if (state.phase === 'waiting' && currentRound && state.gameStartTime && controller.session?.status === 'IN_PROGRESS') {
      const q = currentRound.question;
      const isAudioChallenge = q.questionType === 'AUDIO' && !!q.audioChallengeType;
      
      // Check for media
      const mediaType = q.questionMediaType || q.questionType;
      const hasMedia = ['VIDEO', 'AUDIO'].includes(mediaType as string) && !!q.questionMediaId;

      if (isAudioChallenge) {
         actions.startDiscussion(configuredRoundTime);
      } else if (hasMedia) {
         actions.startMediaPlayback();
      } else {
         const readingTime = calculateReadingTime(q.question);
         actions.startReading(readingTime);
      }
    }
  }, [state.phase, currentRound, state.gameStartTime, controller.session?.status, actions, calculateReadingTime, configuredRoundTime]);

  useEffect(() => {
    const isEnteringDiscussion = state.phase === 'discussion' &&
      (prevPhaseRef.current !== 'discussion' || prevRoundRef.current !== state.currentRound);

    prevPhaseRef.current = state.phase;
    prevRoundRef.current = state.currentRound;

    if (isEnteringDiscussion && currentRound) {
      const isAudioChallenge = currentRound.question.questionType === 'AUDIO' && !!currentRound.question.audioChallengeType;

      if (isAudioChallenge) {
        // Skip discussion timer for audio challenges, go straight to answer/record
        actions.timeUp();
      } else {
        requestAnimationFrame(() => {
          timerReset(configuredRoundTime);
          timerStart();
        });
      }
    }
  }, [state.phase, state.currentRound, currentRound, configuredRoundTime, actions, timerReset, timerStart]);

  // Pause timer when leaving discussion phase
  useEffect(() => {
    if (state.phase !== 'discussion') {
      timerPause();
    }
  }, [state.phase, timerPause]);

  // Phase-specific handlers
  const handleStartGame = async () => {
    try {
      if (controller.session?.status === 'IN_PROGRESS') {
        actions.startSession(configuredRoundTime);
      } else {
        await controller.startSession();
        actions.startSession(configuredRoundTime);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start session');
    }
  };

  const handleReadingComplete = useCallback(() => {
    actions.readingComplete();
  }, [actions]);

  const handleSkipReading = useCallback(() => {
    actions.skipReading();
  }, [actions]);

  const handleMediaComplete = useCallback(() => {
    actions.startDiscussion(configuredRoundTime);
  }, [actions, configuredRoundTime]);

  const handleSkipMedia = useCallback(() => {
    actions.skipMedia();
  }, [actions]);

  const handleSubmitAnswer = async () => {
    if (!currentRound) { return; }

    try {
      // roundId is string in QuizRound entity
      await controller.submitAnswer(Number(currentRound.id), {
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
    if (!currentRound) { return; }

    try {
      await controller.submitAudioAnswer(
        Number(currentRound.id), // Ensure number if API expects number, or keep string if it expects string
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

  // If no sessionId, return null (effect handles navigation)
  if (!sessionId) { return null; }

  // Render current phase
  const renderPhase = () => {
    // Show waiting phase if loading initially
    if (controller.isLoading && state.phase === 'waiting' && !state.gameStartTime) {
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
        // If game is started but we are waiting (round init), show loader or null
        if (state.gameStartTime) {
            return (
                 <WaitingPhase
                    roundTime={controller.session?.roundTimeSeconds || 60}
                    onStart={() => {}}
                    isLoading={true}
                  />
            );
        }
        return (
          <WaitingPhase
            roundTime={controller.session?.roundTimeSeconds || 60}
            onStart={handleStartGame}
            isLoading={controller.isBeginningSession}
          />
        );
      case 'reading':
        if (!currentRound) { return null; }
        return (
          <ReadingPhase
            question={currentRound.question}
            timeLeft={state.readingTimeSeconds}
            onSkip={handleSkipReading}
            onComplete={handleReadingComplete}
          />
        );
      case 'media_playback':
        if (!currentRound) { return null; }
        return (
          <MediaPlaybackPhase
            question={currentRound.question}
            onPlaybackComplete={handleMediaComplete}
            onSkip={handleSkipMedia}
          />
        );
      case 'discussion':
        if (!currentRound) { return null; }
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
        if (!currentRound) { return null; }
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
        if (!currentRound) { return null; }
        return (
          <FeedbackPhase
            roundData={currentRound}
            isCorrect={currentRound.isCorrect}
            isLastRound={isLastRound}
            onNextRound={handleNextRound}
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
