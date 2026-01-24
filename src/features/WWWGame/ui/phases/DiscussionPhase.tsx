import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Animated } from 'react-native';
import { useAppStyles } from '../../../../shared/ui/hooks/useAppStyles';
import { phaseStyles } from './phases.styles';
import { QuizQuestion } from '../../../../entities/QuizState/model/slice/quizApi';
import VoiceRecorder from '../../../../components/VoiceRecorder';

interface DiscussionPhaseProps {
  question: QuizQuestion;
  timeLeft: number;
  animation: Animated.Value;
  notes: string;
  onNotesChange: (text: string) => void;
  onSubmitEarly: () => void;
  isVoiceEnabled?: boolean;
}

export const DiscussionPhase: React.FC<DiscussionPhaseProps> = ({
  question,
  timeLeft,
  animation,
  notes,
  onNotesChange,
  onSubmitEarly,
  isVoiceEnabled = false,
}) => {
  const { theme } = useAppStyles();
  const styles = phaseStyles(theme);
  const [voiceTranscription, setVoiceTranscription] = useState('');

  const handleVoiceTranscription = (text: string) => {
    setVoiceTranscription(text);
    if (text) {
      onNotesChange(notes ? `${notes} ${text}` : text);
    }
  };

  const isAudioChallenge = question.questionType === 'AUDIO' && !!question.audioChallengeType;

  return (
    <View style={styles.container}>
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{timeLeft} seconds</Text>
        <View style={styles.timerBar}>
          <Animated.View
            style={[
              styles.timerProgress,
              {
                width: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      <Text style={styles.title}>Team Discussion</Text>

      {isAudioChallenge ? (
        <Text style={styles.text}>Audio Challenge</Text>
      ) : (
        <Text style={styles.text}>{question.question}</Text>
      )}

      {isVoiceEnabled && !isAudioChallenge && (
        <View style={{ marginBottom: theme.spacing.lg, backgroundColor: theme.colors.background.tertiary, padding: theme.spacing.md, borderRadius: theme.layout.borderRadius.md }}>
          <VoiceRecorder
            onTranscription={handleVoiceTranscription}
            isActive={true}
          />
          {voiceTranscription ? (
            <View style={{ marginTop: theme.spacing.sm, backgroundColor: theme.colors.background.tertiary, padding: theme.spacing.md, borderRadius: theme.layout.borderRadius.md }}>
              <Text style={{ fontWeight: theme.typography.fontWeight.bold, ...theme.typography.body.small, color: theme.colors.text.secondary, marginBottom: 4 }}>
                Latest Transcription:
              </Text>
              <Text style={{ ...theme.typography.body.small, color: theme.colors.text.primary, fontStyle: 'italic' }}>
                {voiceTranscription}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      <View style={{ marginBottom: theme.spacing.lg }}>
        <Text style={styles.label}>Discussion Notes:</Text>
        <TextInput
          style={styles.input}
          value={notes}
          onChangeText={onNotesChange}
          placeholder="Record your team's discussion..."
          multiline
          textAlignVertical="top"
          placeholderTextColor={theme.colors.text.disabled}
        />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={onSubmitEarly}
      >
        <Text style={styles.buttonText}>Submit Answer</Text>
      </TouchableOpacity>
    </View>
  );
};