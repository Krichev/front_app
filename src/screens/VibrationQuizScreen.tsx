import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Alert,
  BackHandler,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme } from '../shared/ui/theme/ThemeProvider';
import { RootStackParamList } from '../navigation/AppNavigator';

// Feature imports
import {
  useVibrationQuiz,
  getRandomSongs,
  VibrationDifficulty,
} from '../features/VibrationQuiz';

// UI Components
import { VibrationButton } from '../features/VibrationQuiz/ui/VibrationButton';
import { AnswerOptions } from '../features/VibrationQuiz/ui/AnswerOptions';
import { VibrationProgress } from '../features/VibrationQuiz/ui/VibrationProgress';
import { QuizHeader } from '../features/VibrationQuiz/ui/QuizHeader';

type VibrationQuizScreenRouteProp = RouteProp<RootStackParamList, 'VibrationQuiz'>;
type VibrationQuizScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'VibrationQuiz'>;

const VibrationQuizScreen: React.FC = () => {
  const navigation = useNavigation<VibrationQuizScreenNavigationProp>();
  const route = useRoute<VibrationQuizScreenRouteProp>();
  const { theme } = useTheme();

  // Params (optional)
  const difficultyParam = route.params?.difficulty as VibrationDifficulty | undefined;
  const questionCountParam = route.params?.questionCount as number | undefined;

  // Game Hook
  const {
    state,
    phase,
    currentQuestion,
    answerOptions,
    isGameActive,
    canReplay,
    replaysRemaining,
    progress,
    statistics,
    startGame,
    playVibration,
    stopVibration,
    useReplay,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    resetGame,
  } = useVibrationQuiz({
    onGameComplete: (stats) => {
      // Optional: log stats or specific analytics
      console.log('Game Completed:', stats);
    },
  });

  // Local state for setup phase (if not provided via params)
  const [selectedDifficulty, setSelectedDifficulty] = useState<VibrationDifficulty>(
    difficultyParam || 'MEDIUM'
  );

  // Initialize game
  useEffect(() => {
    // If params provided, start immediately. Otherwise, wait for user setup.
    if (difficultyParam) {
      const questions = getRandomSongs(questionCountParam || 5, difficultyParam);
      startGame(
        {
          difficulty: difficultyParam,
          questionCount: questions.length,
          maxReplaysPerQuestion: 3,
          guessTimeLimitSeconds: 30, // Default 30s
        },
        questions
      );
    }
  }, [difficultyParam, questionCountParam, startGame]);

  // Handle Back Button
  useEffect(() => {
    const onBackPress = () => {
      if (isGameActive) {
        Alert.alert(
          'Exit Game',
          'Are you sure you want to exit? Your progress will be lost.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Exit',
              style: 'destructive',
              onPress: () => {
                stopVibration();
                navigation.goBack();
              },
            },
          ]
        );
        return true;
      }
      return false;
    };

    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, [isGameActive, navigation, stopVibration]);

  // Start game from setup
  const handleManualStart = (difficulty: VibrationDifficulty) => {
    const questions = getRandomSongs(5, difficulty);
    startGame(
      {
        difficulty,
        questionCount: 5,
        maxReplaysPerQuestion: 3,
        guessTimeLimitSeconds: 30,
      },
      questions
    );
  };

  // Render Setup Phase
  if (phase === 'SETUP' && !difficultyParam) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.setupContainer}>
          <MaterialCommunityIcons
            name="waveform"
            size={80}
            color={theme.colors.primary.main}
            style={{ marginBottom: 20 }}
          />
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Feel the Beat
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            Guess the song from its vibration pattern
          </Text>

          <View style={styles.difficultyContainer}>
            {(['EASY', 'MEDIUM', 'HARD'] as VibrationDifficulty[]).map((diff) => (
              <TouchableOpacity
                key={diff}
                style={[
                  styles.difficultyButton,
                  { backgroundColor: theme.colors.background.secondary },
                ]}
                onPress={() => handleManualStart(diff)}
              >
                <Text style={[styles.difficultyText, { color: theme.colors.text.secondary }]}>
                  {diff}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Render Results Phase
  if (phase === 'RESULTS' && statistics) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <ScrollView contentContainerStyle={styles.resultsContainer}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Game Over!
          </Text>
          <Text style={[styles.score, { color: theme.colors.primary.main }]}>
            {statistics.totalScore} pts
          </Text>

          <View style={[styles.statRow, { borderColor: theme.colors.border.main }]}>
            <Text style={{ color: theme.colors.text.primary }}>Correct Answers</Text>
            <Text style={{ color: theme.colors.text.primary, fontWeight: 'bold' }}>
              {statistics.correctAnswers} / {statistics.totalQuestions}
            </Text>
          </View>

          <View style={[styles.statRow, { borderColor: theme.colors.border.main }]}>
            <Text style={{ color: theme.colors.text.primary }}>Accuracy</Text>
            <Text style={{ color: theme.colors.text.primary, fontWeight: 'bold' }}>
              {statistics.accuracyPercent}%
            </Text>
          </View>

           <View style={[styles.statRow, { borderColor: theme.colors.border.main }]}>
            <Text style={{ color: theme.colors.text.primary }}>Replays Used</Text>
            <Text style={{ color: theme.colors.text.primary, fontWeight: 'bold' }}>
              {statistics.totalReplaysUsed}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary.main }]}
            onPress={resetGame}
          >
            <Text style={[styles.buttonText, { color: theme.colors.primary.contrast }]}>
              Play Again
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.colors.border.main }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.buttonText, { color: theme.colors.text.primary }]}>
              Return Home
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render Game Phase
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <QuizHeader
        currentQuestionIndex={progress.current}
        totalQuestions={progress.total}
        score={state.totalScore}
      />

      <View style={styles.gameContent}>
        {/* Phase-specific Hint/Instruction */}
        <Text style={[styles.instruction, { color: theme.colors.text.primary }]}>
          {state.isVibrating
            ? 'Feeling the rhythm...'
            : phase === 'READY'
            ? 'Ready to play?'
            : phase === 'GUESSING'
            ? 'What song is this?'
            : phase === 'FEEDBACK'
            ? (state.currentResult === 'correct' ? 'Correct!' : 'Incorrect!')
            : ''}
        </Text>

        <VibrationButton
          isVibrating={state.isVibrating}
          onPress={phase === 'READY' ? playVibration : useReplay}
          disabled={phase === 'FEEDBACK' || phase === 'RESULTS'}
          canReplay={canReplay}
          replaysRemaining={replaysRemaining}
        />

        <VibrationProgress
          progress={state.vibrationProgress}
          isVibrating={state.isVibrating}
        />
        
        {phase === 'GUESSING' && state.guessTimeRemaining !== null && (
             <Text style={[styles.timer, { color: state.guessTimeRemaining < 5 ? theme.colors.error.main : theme.colors.text.secondary }]}>
                Time: {state.guessTimeRemaining}s
             </Text>
        )}

        <View style={styles.optionsContainer}>
            {phase === 'FEEDBACK' && currentQuestion ? (
                <View style={styles.feedbackContainer}>
                    <Text style={[styles.songTitle, { color: theme.colors.text.primary }]}>
                        {currentQuestion.songTitle}
                    </Text>
                    <Text style={[styles.artist, { color: theme.colors.text.secondary }]}>
                        by {currentQuestion.artist}
                    </Text>
                     <TouchableOpacity
                        style={[styles.nextButton, { backgroundColor: theme.colors.primary.main }]}
                        onPress={nextQuestion}
                    >
                        <Text style={[styles.buttonText, { color: theme.colors.primary.contrast }]}>
                            Next Question
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                 <AnswerOptions
                  options={answerOptions}
                  onSelect={(answer) => {
                      selectAnswer(answer);
                      setTimeout(() => submitAnswer(), 300);
                  }}
                  selectedAnswer={state.currentSelectedAnswer}
                  correctAnswer={null} // Don't show in guessing phase
                  disabled={state.isVibrating || phase !== 'GUESSING'}
                />
            )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  setupContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  gameContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
  },
  difficultyContainer: {
    width: '100%',
    gap: 16,
  },
  difficultyButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  resultsContainer: {
    alignItems: 'center',
    padding: 20,
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  primaryButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 12,
  },
  secondaryButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  instruction: {
    fontSize: 20,
    marginTop: 20,
    fontWeight: '500',
  },
  optionsContainer: {
    flex: 1,
    width: '100%',
    marginTop: 20,
    justifyContent: 'center',
  },
  timer: {
      marginTop: 8,
      fontWeight: 'bold',
  },
  feedbackContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
  },
  songTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
  },
  artist: {
      fontSize: 18,
      marginBottom: 30,
  },
  nextButton: {
      paddingHorizontal: 40,
      paddingVertical: 16,
      borderRadius: 30,
  },
});

export default VibrationQuizScreen;