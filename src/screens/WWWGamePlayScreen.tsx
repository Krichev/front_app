// src/screens/WWWGamePlayScreen.tsx - Orchestration Layer
import React, { useEffect, useCallback, useRef, useState } from 'react';
import { SafeAreaView, Alert, BackHandler } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useWWWGameState } from '../features/WWWGame/hooks/useWWWGameState';
import { useWWWGameController } from '../features/WWWGame/hooks/useWWWGameController';
import { useReadingTime } from '../features/WWWGame/hooks/useReadingTime';
import {
  WaitingPhase,
  ReadingPhase,
  MediaPlaybackPhase,
  DiscussionPhase,
  AnswerPhase,
  FeedbackPhase,
} from '../features/WWWGame/ui/phases';
import { useCountdownTimer } from '../shared/hooks/useCountdownTimer';
import { useAppStyles } from '../shared/ui/hooks/useAppStyles';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ExitGameModal } from '../features/WWWGame/ui/components/ExitGameModal';
import { WagerResultsOverlay } from '../features/Wager/ui/WagerResultsOverlay';
import { useGetWagersByChallengeQuery } from '../entities/WagerState/model/slice/wagerApi';
import { useWager } from '../features/Wager/hooks/useWager';
import { Wager, WagerOutcome } from '../entities/WagerState/model/types';

type WWWGamePlayNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WWWGamePlay'>;
type WWWGamePlayRouteProp = RouteProp<RootStackParamList, 'WWWGamePlay'>;

const WWWGamePlayScreen: React.FC = () => {
  const route = useRoute<WWWGamePlayRouteProp>();
  const navigation = useNavigation<WWWGamePlayNavigationProp>();
  const { screen } = useAppStyles();
  
  const { sessionId, challengeId } = route.params;
  const gameSettings = route.params as any; // Legacy params support

  // Wager State
  const { data: wagers } = useGetWagersByChallengeQuery(Number(challengeId), { skip: !challengeId });
  const { settleWager } = useWager();
  const [activeWager, setActiveWager] = useState<Wager | null>(null);
  const [wagerOutcome, setWagerOutcome] = useState<WagerOutcome | null>(null);
  const [showWagerOverlay, setShowWagerResults] = useState(false);

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

  // Exit Modal State
  const [showExitModal, setShowExitModal] = useState(false);

  // Current round data
  const currentRound = controller.rounds[state.currentRound];
  const isLastRound = state.currentRound >= controller.rounds.length - 1;

  // Handle hardware back button
  useEffect(() => {
    const onBackPress = () => {
      // Only intercept if game is in progress or paused and not completed
      if (state.phase !== 'completed' && (controller.session?.status === 'IN_PROGRESS' || controller.session?.status === 'PAUSED')) {
        setShowExitModal(true);
        return true;
      }
      return false;
    };

    BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    };
  }, [state.phase, controller.session?.status]);

  const handleResumeGame = useCallback(() => {
    setShowExitModal(false);
  }, []);

  const handlePauseAndExit = useCallback(async () => {
    try {
      if (!controller.session) return;
      
      await controller.pauseSession({
        pausedAtRound: state.currentRound + 1, // 1-based index for backend
        remainingTimeSeconds: timer.timeLeft,
        currentAnswer: state.teamAnswer,
        discussionNotes: state.discussionNotes
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to pause game');
    }
  }, [controller, state, timer.timeLeft, navigation]);

  const handleAbandonGame = useCallback(async () => {
    try {
      await controller.abandonGame();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to abandon game');
    }
  }, [controller, navigation]);

  const navigateToResults = useCallback(() => {
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
  }, [controller, navigation, challengeId]);

  const handleGameCompletion = useCallback(async () => {
    try {
      await controller.completeGame();

      // Check for active wagers to settle
      const wagerToSettle = wagers?.find(w => w.status === 'ACTIVE');
      if (wagerToSettle) {
        try {
          const outcome = await settleWager(wagerToSettle.id);
          setActiveWager(wagerToSettle);
          setWagerOutcome(outcome);
          setShowWagerResults(true);
          return; // Don't navigate yet, show overlay
        } catch (wagerError) {
          console.error('Failed to settle wager:', wagerError);
        }
      }

      navigateToResults();
    } catch (error) {
      Alert.alert('Error', 'Failed to complete game');
    }
  }, [controller, wagers, settleWager, navigateToResults]);

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
      } else if (controller.session.status === 'PAUSED' && state.phase === 'waiting' && !state.gameStartTime) {
        // Restore paused state
        const pausedRound = (controller.session.pausedAtRound || 1) - 1; // Convert back to 0-based
        const validRound = Math.max(0, pausedRound);
        const remainingTime = controller.session.remainingTimeSeconds || configuredRoundTime;

        actions.setRound(validRound);
        if (controller.session.pausedAnswer) actions.setAnswer(controller.session.pausedAnswer);
        if (controller.session.pausedNotes) actions.setNotes(controller.session.pausedNotes);

        // Resume session via API and start game loop
        controller.resumeGame().then(() => {
           actions.startSession(remainingTime); // Marks session start locally
           // Jump straight to discussion or appropriate phase if we knew it
           // For simplicity, we restart discussion with remaining time
           // Note: This might replay media if we had phase restoration, but here we assume discussion
           actions.startDiscussion(remainingTime);
           timerReset(remainingTime);
           timerStart();
        });
      }
    }
  }, [controller.session, controller.rounds, state.phase, state.gameStartTime, actions, handleGameCompletion, configuredRoundTime, timerReset, timerStart]);

  // Orchestration: Determine sub-phase when starting round
  useEffect(() => {
    if (state.phase === 'waiting' && currentRound && state.gameStartTime && controller.session?.status === 'IN_PROGRESS') {
      const q = currentRound.question;
      const isAudioChallenge = q.questionType === 'AUDIO' && !!q.audioChallengeType;
      
      // Check for media
      const mediaType = q.questionMediaType || q.questionType;
      const hasUploadedMedia = ['VIDEO', 'AUDIO'].includes(mediaType as string) && !!q.questionMediaId;
      const hasExternalMedia = ['VIDEO', 'AUDIO'].includes(q.questionType as string) 
          && !!q.mediaSourceType 
          && q.mediaSourceType !== 'UPLOADED'
          && (!!q.externalMediaUrl || !!q.externalMediaId);
      const hasMedia = hasUploadedMedia || hasExternalMedia;

      console.log('🎮 [Orchestration] Question media detection:', { 
        questionId: q.id,
        questionType: q.questionType, 
        mediaType, 
        hasUploadedMedia, 
        hasExternalMedia, 
        mediaSourceType: q.mediaSourceType 
      });

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
          // If we just resumed (timer running), don't reset
          if (!timer.isRunning) {
             timerReset(configuredRoundTime);
             timerStart();
          }
        });
      }
    }
  }, [state.phase, state.currentRound, currentRound, configuredRoundTime, actions, timerReset, timerStart, timer.isRunning]);

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
      const answerToSubmit = state.teamAnswer.trim() || '';
      // roundId is string in QuizRound entity
      await controller.submitAnswer(currentRound.id, {
        teamAnswer: answerToSubmit,
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
        currentRound.id,
        currentRound.question.id,
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
      
      <ExitGameModal
        visible={showExitModal}
        onResume={handleResumeGame}
        onPauseAndExit={handlePauseAndExit}
        onAbandon={handleAbandonGame}
        isPausing={controller.isPausingSession}
      />

      {showWagerOverlay && activeWager && wagerOutcome && (
        <WagerResultsOverlay 
          wager={activeWager}
          outcome={wagerOutcome}
          onClose={() => {
            setShowWagerResults(false);
            navigateToResults();
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default WWWGamePlayScreen;
