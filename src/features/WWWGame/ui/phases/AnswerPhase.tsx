import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppStyles } from '../../../../shared/ui/hooks/useAppStyles';
import { phaseStyles } from './phases.styles';
import { QuizQuestion } from '../../../../entities/QuizState/model/slice/quizApi';
import VoiceRecorder from '../../../../components/VoiceRecorder';
import { AudioChallengeContainer } from '../../../../screens/components/audio';
import { useAnswerTimer } from '../../hooks/useAnswerTimer';

interface AnswerPhaseProps {
  question: QuizQuestion;
  answer: string;
  player: string;
  onAnswerChange: (text: string) => void;
  onPlayerChange: (player: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  gameSettings?: any;
  isVoiceEnabled?: boolean;
  onAudioRecordingComplete?: (audioFile: { uri: string; name: string; type: string }) => void;
  recordedAudio?: { uri: string; name: string; type: string } | null;
}

export const AnswerPhase: React.FC<AnswerPhaseProps> = ({
  question,
  answer,
  player,
  onAnswerChange,
  onPlayerChange,
  onSubmit,
  isSubmitting,
  gameSettings,
  isVoiceEnabled = false,
  onAudioRecordingComplete,
  recordedAudio,
}) => {
  const { theme } = useAppStyles();
  const styles = phaseStyles(theme);
  const [showHint, setShowHint] = useState(false);
  const [isRecordingVoiceAnswer, setIsRecordingVoiceAnswer] = useState(false);
  const hasStartedTyping = useRef(false);

  const isAudioChallenge = question.questionType === 'AUDIO' && !!question.audioChallengeType;

  // Initialize two-phase timer
  const timer = useAnswerTimer({
    initialTypingTime: 5,
    completionTime: 15,
    onAutoSubmit: onSubmit,
  });

  const handleAnswerChange = (text: string) => {
    onAnswerChange(text);
    if (!hasStartedTyping.current && text.length > 0) {
      hasStartedTyping.current = true;
      timer.startCompletionPhase();
    }
  };

  const handleVoiceTranscription = (text: string) => {
    if (text) {
      handleAnswerChange(answer ? `${answer} ${text}` : text);
    }
  };

  if (isAudioChallenge) {
    return (
      <View style={styles.container}>
        <AudioChallengeContainer
          question={question as any}
          mode="record"
          onRecordingComplete={onAudioRecordingComplete!}
          disabled={isSubmitting}
        />
        <TouchableOpacity
          style={[styles.button, (!recordedAudio || isSubmitting) && styles.disabledButton]}
          onPress={onSubmit}
          disabled={!recordedAudio || isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Uploading...' : 'Submit Recording'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Answer Timer Display */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>
          {timer.phase === 'typing'
            ? `${timer.timeLeft} seconds to start typing`
            : `${timer.timeLeft} seconds remaining`}
        </Text>
        <View style={styles.timerBar}>
          <Animated.View
            style={[
              styles.timerProgress,
              {
                backgroundColor: timer.phase === 'typing' ? theme.colors.warning.main : theme.colors.success.main,
                width: timer.animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      <Text style={styles.title}>Submit Your Answer</Text>
      <Text style={styles.text}>{question.question}</Text>

      {question.additionalInfo && (
        <View>
          <TouchableOpacity
            style={{ alignSelf: 'center', padding: theme.spacing.sm, marginBottom: theme.spacing.lg }}
            onPress={() => setShowHint(!showHint)}
          >
            <Text style={{ color: theme.colors.info.main, fontWeight: theme.typography.fontWeight.medium }}>
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </Text>
          </TouchableOpacity>
          {showHint && (
            <View style={{ backgroundColor: theme.colors.background.secondary, padding: theme.spacing.md, borderRadius: theme.layout.borderRadius.md, marginBottom: theme.spacing.lg }}>
              <Text style={{ color: theme.colors.text.secondary, fontStyle: 'italic' }}>{question.additionalInfo}</Text>
            </View>
          )}
        </View>
      )}

      {isVoiceEnabled && (
        <View style={{ marginBottom: theme.spacing.lg }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', backgroundColor: isRecordingVoiceAnswer ? theme.colors.error.main : theme.colors.warning.main, paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing['2xl'], borderRadius: theme.layout.borderRadius.md, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md }}
            onPress={() => setIsRecordingVoiceAnswer(!isRecordingVoiceAnswer)}
          >
            <MaterialCommunityIcons
              name={isRecordingVoiceAnswer ? 'stop' : 'microphone'}
              size={20}
              color={theme.colors.text.inverse}
            />
            <Text style={{ color: theme.colors.text.inverse, ...theme.typography.body.medium, fontWeight: theme.typography.fontWeight.bold, marginLeft: theme.spacing.sm }}>
              {isRecordingVoiceAnswer ? 'Stop Recording Answer' : 'Record Voice Answer'}
            </Text>
          </TouchableOpacity>

          {isRecordingVoiceAnswer && (
            <VoiceRecorder
              onTranscription={handleVoiceTranscription}
              isActive={isRecordingVoiceAnswer}
            />
          )}
        </View>
      )}

      {gameSettings?.players && gameSettings.players.length > 0 && (
        <View style={{ marginBottom: theme.spacing.lg }}>
          <Text style={styles.label}>Who is answering?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', maxHeight: 50 }}>
            {gameSettings.players.map((p: string) => (
              <TouchableOpacity
                key={p}
                style={{ paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, borderRadius: theme.layout.borderRadius['2xl'], backgroundColor: player === p ? theme.colors.success.main : theme.colors.background.tertiary, marginRight: theme.spacing.sm }}
                onPress={() => onPlayerChange(p)}
              >
                <Text style={{ color: player === p ? theme.colors.text.inverse : theme.colors.text.primary, fontWeight: player === p ? theme.typography.fontWeight.bold : undefined }}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={{ marginBottom: theme.spacing.lg }}>
        <Text style={styles.label}>Team Answer:</Text>
        <TextInput
          style={styles.input}
          value={answer}
          onChangeText={handleAnswerChange}
          placeholder="Enter your team's answer..."
          multiline
          placeholderTextColor={theme.colors.text.disabled}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, (!answer.trim() || isSubmitting || timer.hasAutoSubmitted) && styles.disabledButton]}
        onPress={onSubmit}
        disabled={!answer.trim() || isSubmitting || timer.hasAutoSubmitted}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? 'Submitting...' : 'Submit Answer'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};