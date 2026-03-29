// src/screens/WWWGamePlayScreen.tsx - Orchestration Layer
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Alert, BackHandler, SafeAreaView, Text, TouchableOpacity, View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {RootStackParamList} from '../navigation/AppNavigator';
import {useWWWGameState} from '../features/WWWGame/hooks/useWWWGameState';
import {useWWWGameController} from '../features/WWWGame/hooks/useWWWGameController';
import {useMediaPreloader} from '../features/WWWGame/hooks/useMediaPreloader';
import {useVideoPreloader} from '../features/WWWGame/hooks/useVideoPreloader';
import {useReadingTime} from '../features/WWWGame/hooks/useReadingTime';
import {useCountdownTimer} from '../shared/hooks/useCountdownTimer';
import {
  AnswerPhase,
  DiscussionPhase,
  FeedbackPhase,
  MediaPlaybackPhase,
  ReadingPhase,
  WaitingPhase,
} from '../features/WWWGame/ui/phases';
import {ExitGameModal} from '../features/WWWGame/ui/components/ExitGameModal';
import {useAppStyles} from '../shared/ui/hooks/useAppStyles';
import {createStyles} from '../shared/ui/theme';
import {WagerResultsOverlay} from '../features/Wager/ui/WagerResultsOverlay';
import {WagerOutcome} from '../entities/WagerState/model/types';

type WWWGamePlayScreenRouteProp = RouteProp<RootStackParamList, 'WWWGamePlay'>;
type WWWGamePlayScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WWWGamePlay'>;

const WWWGamePlayScreen: React.FC = () => {
  const route = useRoute<WWWGamePlayScreenRouteProp>();
  const navigation = useNavigation<WWWGamePlayScreenNavigationProp>();
  
  // Handle complex union type for params
  const params = route.params as any;
  const sessionId = params?.sessionId;
  
  const {theme} = useAppStyles();
  const styles = themeStyles;

  // Controller handles API interaction
  const controller = useWWWGameController(sessionId || '');
  
  // Media Preloader
  const {
    preloadProgress,
    hasMediaQuestions,
    preloadStatuses
  } = useMediaPreloader(controller.rounds || []);

  // State machine handles UI phases
  const {state, dispatch, actions} = useWWWGameState();
  const {calculateReadingTime} = useReadingTime();

  const currentRoundIdx = state.currentRound > 0 ? state.currentRound - 1 : 0;
  const currentRound = controller.rounds?.[currentRoundIdx];
  const currentQuestion = currentRound?.question;

  const [discussionNotes, setDiscussionNotes] = useState('');
  const [scoringResult, setScoringResult] = useState<any>(null);

  const effectiveRoundTime = controller.session?.roundTimeSeconds || 60;

  const {
    timeLeft: timerTimeLeft,
    animation: timerAnimation,
    start: timerStart,
    pause: timerPause,
    reset: timerReset,
  } = useCountdownTimer({
    duration: effectiveRoundTime,
    onComplete: () => dispatch(actions.timeUp()),
  });

  // Track phase/round transitions to trigger timer reset
  const prevPhaseRef = useRef<string>(state.phase);
  const prevRoundRef = useRef<number>(state.currentRound);
  const safetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs to prevent double-starting the timers for the same discussion entry.
  // Cleared when leaving discussion phase or changing rounds.
  const discussionTimerStartedRef = useRef(false);
  const safetyTimerArmedRef = useRef(false);

  // Reset guards when round changes
  useEffect(() => {
    discussionTimerStartedRef.current = false;
    safetyTimerArmedRef.current = false;
  }, [state.currentRound]);

  // Auto-start discussion timer when entering discussion phase
  useEffect(() => {
    const isEnteringDiscussion = state.phase === 'discussion' &&
      (prevPhaseRef.current !== 'discussion' || prevRoundRef.current !== state.currentRound);

    prevPhaseRef.current = state.phase;
    prevRoundRef.current = state.currentRound;

    if (!isEnteringDiscussion || !currentRound) {
      return;
    }

    // Guard: only start the timer once per discussion phase entry
    if (discussionTimerStartedRef.current) {
      return;
    }

    const q = currentRound.question;
    const isAudioChallenge = q.questionType === 'AUDIO' && !!q.audioChallengeType;
    const isAnyAudioQuestion = q.questionType === 'AUDIO';

    if (isAudioChallenge || isAnyAudioQuestion) {
      // Skip discussion phase for audio challenges, go straight to answer/record
      dispatch(actions.timeUp());
    } else {
      console.log('🎮 [Discussion] Starting timer with duration:', effectiveRoundTime);
      discussionTimerStartedRef.current = true;
      timerReset(effectiveRoundTime);
      timerStart();
    }
  }, [state.phase, state.currentRound, currentRound, effectiveRoundTime, actions, timerReset, timerStart, dispatch]);

  // Safety fallback: if discussion timer's onComplete doesn't fire (e.g. race condition),
  // guarantee we still transition to answer phase.
  useEffect(() => {
    // Only active during discussion phase for non-audio questions
    if (state.phase !== 'discussion' || !currentRound) {
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }
      return;
    }

    const isAudioQuestion = currentRound.question.questionType === 'AUDIO';
    if (isAudioQuestion) return;

    // Guard: only arm the safety timer once per discussion phase entry
    if (safetyTimerArmedRef.current) {
      return;
    }
    safetyTimerArmedRef.current = true;

    // Set fallback at effectiveRoundTime + 3 seconds
    const safetyMs = (effectiveRoundTime + 3) * 1000;
    console.log('🛡️ [Safety] Arming fallback timer:', safetyMs, 'ms for round', state.currentRound);

    safetyTimeoutRef.current = setTimeout(() => {
      console.warn('🛡️ [Safety] Fallback triggered! Forcing discussion → answer transition');
      timerPause();
      dispatch(actions.timeUp());
    }, safetyMs);

    return () => {
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }
    };
  }, [state.phase, state.currentRound, currentRound, effectiveRoundTime, actions, timerPause, dispatch]);

  // Reset the discussion timer guard and pause when leaving discussion phase
  useEffect(() => {
    if (state.phase !== 'discussion') {
      discussionTimerStartedRef.current = false;
      safetyTimerArmedRef.current = false;
      timerPause();
    }
  }, [state.phase, timerPause]);

  // Video preloading — primes cache for the next round's media
  useVideoPreloader(state.currentRound, controller.rounds);

  const [showExitModal, setShowExitModal] = useState(false);
  const [showWagerResults, setShowWagerResults] = useState(false);
  const [wagerOutcome, setWagerOutcome] = useState<WagerOutcome | null>(null);

  // Auto-start discussion timer when entering discussion phase

  useEffect(() => {
    if (state.phase === 'waiting' && currentQuestion && state.gameStartTime && !controller.isLoading) {
      const q = currentQuestion;
      if (__DEV__) {
        console.log('📦 [WWWGamePlayScreen] Phase orchestration — entering round:', {
          phase: state.phase,
          currentRound: state.currentRound,
          questionId: q.id,
          questionType: q.questionType,
          mediaSourceType: q.mediaSourceType,
          hasExternalMedia: !!q.externalMediaUrl || !!q.externalMediaId,
          hasUploadedMedia: !!q.questionMediaId,
          questionMediaType: q.questionMediaType,
        });
        console.log('🔍 [AUDIO DEBUG] Question routing data:', {
          questionId: q.id,
          type: q.questionType,
          mediaType: q.questionMediaType,
          hasUrl: !!q.questionMediaUrl,
          hasId: !!q.questionMediaId,
        });
      }
      
      const isAudioChallenge = q.questionType === 'AUDIO' && !!q.audioChallengeType;
      const isAnyAudioQuestion = q.questionType === 'AUDIO';
      const isMediaQuestionType = ['VIDEO', 'IMAGE'].includes(q.questionType as string);
      
      const mediaType = (q.questionMediaType || q.questionType)?.toUpperCase();
      const hasUploadedMedia = ['VIDEO', 'AUDIO', 'IMAGE'].includes(mediaType) && !!q.questionMediaId;
      const hasExternalMedia = ['VIDEO', 'AUDIO', 'IMAGE'].includes(q.questionType) 
          && !!q.mediaSourceType && q.mediaSourceType !== 'UPLOADED'
          && (!!q.externalMediaUrl || !!q.externalMediaId);
      
      const hasMedia = hasUploadedMedia || hasExternalMedia;

      if (isAudioChallenge) {
        console.log('🎵 [WWWGamePlayScreen] Audio challenge → skipping discussion, going to answer');
        dispatch(actions.startAudioChallenge(effectiveRoundTime));
      } else if (isAnyAudioQuestion) {
        dispatch(actions.startDiscussion(effectiveRoundTime));
      } else if (hasMedia || isMediaQuestionType) {
        dispatch(actions.startMediaPlayback());
      } else {
        const readingTime = calculateReadingTime(q.question);
        dispatch(actions.startReading(readingTime));
      }
    }
  }, [state.phase, currentQuestion, state.gameStartTime, controller.isLoading, controller.session, dispatch, actions, calculateReadingTime, effectiveRoundTime, state.currentRound]);

  // Handle phase transitions for preloader delay
  useEffect(() => {
    // If we're entering media_playback, check if we need to wait a tiny bit for preloader
    if (state.phase === 'media_playback' && currentQuestion) {
      const status = preloadStatuses[currentQuestion.id];
      
      if (status === 'loading') {
        if (__DEV__) console.log(`🎬 [WWWGamePlayScreen] Delaying media_playback phase for question ${currentQuestion.id} to finish preload`);
        const delayTimer = setTimeout(() => {
          // No action needed, component will just render and pick up where preload left off
        }, 300);
        return () => clearTimeout(delayTimer);
      }
    }
  }, [state.phase, currentQuestion, preloadStatuses]);

  // Sync state with controller when rounds loaded
  useEffect(() => {
    if (controller.rounds && controller.rounds.length > 0 && state.currentRound === 0) {
      dispatch(actions.setRound(1));
    }
  }, [controller.rounds, dispatch, actions, state.currentRound]);

  const handleStartGame = async () => {
    try {
      await controller.startSession();
      // Initialize session in state machine
      dispatch(actions.startSession(controller.session?.roundTimeSeconds || 60));
    } catch (error) {
      Alert.alert('Error', 'Failed to start the game session');
    }
  };

  const navigateToResults = useCallback(() => {
    if (!sessionId) return;
    
    // Build results data for the screen
    const resultsData = {
      teamName: controller.session?.teamName || 'Team',
      score: controller.session?.correctAnswers || 0,
      totalRounds: controller.session?.totalRounds || controller.rounds?.length || 0,
      roundsData: controller.rounds.map(r => ({
        question: r.question.question,
        correctAnswer: r.question.answer,
        teamAnswer: r.teamAnswer || '',
        isCorrect: r.isCorrect,
        playerWhoAnswered: r.playerWhoAnswered || '',
        discussionNotes: r.discussionNotes || ''
      })),
      challengeId: controller.session?.challengeId,
      sessionId: sessionId
    };

    navigation.replace('WWWGameResults', resultsData as any);
  }, [navigation, sessionId, controller.session, controller.rounds]);

  const handleGameComplete = useCallback(async (outcome?: WagerOutcome) => {
    if (outcome) {
      setWagerOutcome(outcome);
      setShowWagerResults(true);
    } else {
      navigateToResults();
    }
  }, [navigateToResults]);

  const handleSubmitAnswer = useCallback(async () => {
    if (!currentRound) { return; }

    try {
      const answerToSubmit = state.teamAnswer.trim() || '';
      await controller.submitAnswer(currentRound.id, {
        teamAnswer: answerToSubmit,
        playerWhoAnswered: state.selectedPlayer || 'Team',
        discussionNotes: state.discussionNotes,
      });
      dispatch(actions.answerSubmitted());
    } catch (error) {
      Alert.alert('Error', 'Failed to submit answer');
    }
  }, [currentRound, controller, state.teamAnswer, state.selectedPlayer, state.discussionNotes, actions, dispatch]);

  const handleAudioRecordingComplete = useCallback(async (audioFile: { uri: string; name: string; type: string }) => {
    if (!currentRound || !currentQuestion) { return; }

    try {
      await controller.submitAudioAnswer(currentRound.id, currentQuestion.id, audioFile, {
        playerWhoAnswered: state.selectedPlayer || 'Team',
        discussionNotes: state.discussionNotes,
        scoringResult: scoringResult,
      });
      setScoringResult(null);
      dispatch(actions.answerSubmitted());
    } catch (error) {
      Alert.alert('Error', 'Failed to submit audio answer');
    }
  }, [currentRound, currentQuestion, controller, state.selectedPlayer, state.discussionNotes, scoringResult, actions, dispatch]);

  // ============================================================================
  // BACK HANDLER
  // ============================================================================

  useEffect(() => {
    const backAction = () => {
      if (state.phase === 'waiting') return false;
      setShowExitModal(true);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [state.phase]);

  // ============================================================================
  // RENDER PHASES
  // ============================================================================

  const renderPhase = () => {
    if (controller.isLoading) {
      return <WaitingPhase roundTime={60} onStart={() => {}} isLoading={true} />;
    }

    switch (state.phase) {
      case 'waiting':
        if (state.gameStartTime) {
          return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
          );
        } else {
          return (
            <WaitingPhase
              roundTime={controller.session?.roundTimeSeconds || 60}
              onStart={handleStartGame}
              isLoading={controller.isBeginningSession}
              mediaPreloadProgress={preloadProgress}
              hasMediaQuestions={hasMediaQuestions}
            />
          );
        }

      case 'reading':
        return (
          <ReadingPhase
            question={currentQuestion!}
            timeLeft={state.timer || 5}
            onSkip={() => {
                const q = currentQuestion!;
                const hasMedia = q.questionMediaId || q.externalMediaUrl;
                if (hasMedia) {
                    dispatch(actions.startMediaPlayback());
                } else {
                    dispatch(actions.startDiscussion(controller.session?.roundTimeSeconds || 60));
                }
            }}
            onComplete={() => {
                const q = currentQuestion!;
                const hasMedia = q.questionMediaId || q.externalMediaUrl;
                if (hasMedia) {
                    dispatch(actions.startMediaPlayback());
                } else {
                    dispatch(actions.startDiscussion(controller.session?.roundTimeSeconds || 60));
                }
            }}
          />
        );

      case 'media_playback':
        return (
          <MediaPlaybackPhase
            question={currentQuestion!}
            onPlaybackComplete={() => dispatch(actions.startDiscussion(controller.session?.roundTimeSeconds || 60))}
            onSkip={() => dispatch(actions.startDiscussion(controller.session?.roundTimeSeconds || 60))}
          />
        );

      case 'discussion':
        return (
          <DiscussionPhase
            question={currentRound.question}
            timeLeft={timerTimeLeft}
            animation={timerAnimation}
            notes={discussionNotes}
            onNotesChange={setDiscussionNotes}
            onSubmitEarly={() => {
              console.log('🎮 [Discussion] User pressed Proceed to Answer, phase:', state.phase);
              // Pause timer first, then transition.
              // actions.timeUp() dispatches TIME_UP which sets phase='answer'.
              timerPause();
              dispatch(actions.timeUp());
              console.log('🎮 [Discussion] Dispatched TIME_UP');
            }}
          />
        );

      case 'answer':
        return (
          <AnswerPhase
            question={currentQuestion!}
            teamMembers={controller.session?.teamMembers || []}
            isSubmitting={controller.isSubmittingAnswer}
            onSubmit={handleSubmitAnswer}
            onAudioRecordingComplete={handleAudioRecordingComplete}
            answer={state.teamAnswer}
            onAnswerChange={(text) => dispatch(actions.setAnswer(text))}
            player={state.selectedPlayer}
            onPlayerChange={(p) => dispatch(actions.setPlayer(p))}
          />
        );

      case 'feedback':
        const isLastRound = state.currentRound >= (controller.rounds?.length || 0);
        return (
          <FeedbackPhase
            roundData={currentRound!}
            isCorrect={currentRound?.isCorrect || false}
            isLastRound={isLastRound}
            scoringResult={currentRound?.scoringResult}
            onNextRound={() => {
              dispatch(actions.nextRound(controller.session?.roundTimeSeconds || 60));
            }}
            onComplete={async () => {
              const outcome = await controller.completeGame();
              handleGameComplete(outcome as any);
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowExitModal(true)} style={styles.headerButton}>
          <MaterialCommunityIcons name="close" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{controller.session?.teamName || 'WWW Quiz'}</Text>
          <Text style={styles.headerSubtitle}>
            Round {state.currentRound} / {controller.rounds?.length || 0}
          </Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      {renderPhase()}

      <ExitGameModal
        visible={showExitModal}
        onResume={() => setShowExitModal(false)}
        onPauseAndExit={() => {
          controller.pauseSession(state.currentRound, timerTimeLeft);
          navigation.goBack();
        }}
        onAbandon={() => {
          controller.abandonGame();
          navigation.goBack();
        }}
      />

      {showWagerResults && wagerOutcome && (
        <WagerResultsOverlay
            wager={{} as any} // Fallback if missing
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

const themeStyles = createStyles(theme => ({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.primary,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    ...theme.typography.body.medium,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
}));

export default WWWGamePlayScreen;
