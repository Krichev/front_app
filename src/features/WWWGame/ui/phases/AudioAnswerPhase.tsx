import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Animated, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import {useAppStyles} from '../../../../shared/ui/hooks/useAppStyles';
import {phaseStyles} from './phases.styles';
import {QuizQuestion} from '../../../../entities/QuizState/model/slice/quizApi';
import {useAudioChallengeTimer} from '../../hooks/useAudioChallengeTimer';
import {AudioResponseRecorder, ReferenceAudioSection} from '../../../../screens/components/audio';

interface AudioAnswerPhaseProps {
  question: QuizQuestion;
  answer: string;                    // current text answer (for text mode)
  onAnswerChange: (text: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  gameSettings?: any;                // contains roundTimeSeconds, players, etc.
  answerMode?: 'text' | 'record';   // defaults to 'text' unless question has audioChallengeType
  onAudioRecordingComplete?: (audioFile: { uri: string; name: string; type: string }) => void;
  recordedAudio?: { uri: string; name: string; type: string } | null;
  player?: string;                   // selected player name (for team mode)
  onPlayerChange?: (player: string) => void;
}

export const AudioAnswerPhase: React.FC<AudioAnswerPhaseProps> = ({
  question,
  answer,
  onAnswerChange,
  onSubmit,
  isSubmitting,
  gameSettings,
  answerMode: propAnswerMode = 'text',
  onAudioRecordingComplete,
  recordedAudio,
  player,
  onPlayerChange,
}) => {
  const { t } = useTranslation();
  const { theme } = useAppStyles();
  const styles = phaseStyles(theme);

  // Determine answer mode: question config takes precedence
  const answerMode = question.audioChallengeType ? 'record' : propAnswerMode;

  const [hasPlayedAtleastOnce, setHasPlayedAtLeastOnce] = useState(false);

  const duration = question.timeLimitSeconds || gameSettings?.roundTimeSeconds || 60;

  const timer = useAudioChallengeTimer({
    duration,
    onAutoSubmit: onSubmit,
  });

  // Start timer on mount
  useEffect(() => {
    timer.start();
  }, []);

  const handleAudioEnd = useCallback(() => {
    setHasPlayedAtLeastOnce(true);
  }, []);

  const isSubmitDisabled = useMemo(() => {
    if (isSubmitting) return true;
    if (timer.timeLeft === 0) return true;
    if (answerMode === 'text') {
      return !answer.trim();
    } else {
      return !recordedAudio;
    }
  }, [isSubmitting, timer.timeLeft, answerMode, answer, recordedAudio]);

  const hasAudio = question.questionType === 'AUDIO' || !!(question?.questionMediaUrl || question?.audioReferenceMediaId || question?.questionMediaId);

  return (
    <View style={styles.container}>
      {/* Timer Bar */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>
          {t('wwwPhases.audioAnswer.timeRemaining', { seconds: timer.timeLeft })}
        </Text>
        <View style={styles.timerBar}>
          <Animated.View
            style={[
              styles.timerProgress,
              {
                backgroundColor: timer.timeLeft < 10 ? theme.colors.error.main : theme.colors.success.main,
                width: timer.animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      <View style={localStyles.content}>
        <Text style={styles.title}>{t('wwwPhases.audioAnswer.title')}</Text>
        <Text style={[styles.text, localStyles.questionText]}>{question.question}</Text>

        {/* Audio Player Section */}
        <View style={localStyles.audioSection}>
          {hasAudio ? (
            <ReferenceAudioSection 
              question={question as any} 
              onPlaybackComplete={handleAudioEnd}
              title={t('wwwPhases.audioAnswer.listenToQuestion')}
            />
          ) : (
            <View style={localStyles.fallbackContainer}>
              <MaterialCommunityIcons 
                name="music-off" 
                size={32} 
                color={theme.colors.text.disabled} 
              />
              <Text style={localStyles.fallbackText}>
                {t('wwwPhases.audioAnswer.audioNotAvailable')}
              </Text>
            </View>
          )}
        </View>

        {/* Answer Area */}
        <View style={localStyles.answerArea}>
          {answerMode === 'text' ? (
            <View>
              {gameSettings?.players && gameSettings.players.length > 0 && (
                <View style={localStyles.playerSelector}>
                  <Text style={styles.label}>{t('wwwPhases.answer.whoIsAnswering')}</Text>
                  <View style={localStyles.playersList}>
                    {gameSettings.players.map((p: string) => (
                      <TouchableOpacity
                        key={p}
                        style={[
                          localStyles.playerChip,
                          player === p && { backgroundColor: theme.colors.success.main }
                        ]}
                        onPress={() => onPlayerChange?.(p)}
                      >
                        <Text style={[
                          localStyles.playerChipText,
                          player === p && { color: theme.colors.text.inverse, fontWeight: 'bold' }
                        ]}>
                          {p}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              <Text style={styles.label}>{t('wwwPhases.answer.teamAnswer')}</Text>
              <TextInput
                style={styles.input}
                value={answer}
                onChangeText={onAnswerChange}
                placeholder={t('wwwPhases.audioAnswer.answerPlaceholder')}
                multiline
                placeholderTextColor={theme.colors.text.disabled}
                editable={!isSubmitting}
              />
            </View>
          ) : (
            <View style={localStyles.recordContainer}>
              <Text style={localStyles.recordTitle}>
                {recordedAudio 
                  ? t('wwwPhases.audioAnswer.reviewYourAnswer') 
                  : t('wwwPhases.audioAnswer.recordYourAnswer')
                }
              </Text>
              <AudioResponseRecorder
                onRecordingComplete={onAudioRecordingComplete!}
                disabled={isSubmitting || timer.timeLeft === 0}
                maxDuration={timer.timeLeft}
              />
              {recordedAudio && (
                <TouchableOpacity
                  style={localStyles.reRecordButton}
                  onPress={() => onAudioRecordingComplete?.(null as any)}
                  disabled={isSubmitting}
                >
                  <Text style={localStyles.reRecordText}>
                    {t('wwwPhases.audioAnswer.recordAgain')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.button, isSubmitDisabled && styles.disabledButton]}
          onPress={onSubmit}
          disabled={isSubmitDisabled}
        >
          {isSubmitting ? (
            <ActivityIndicator color={theme.colors.text.inverse} />
          ) : (
            <Text style={styles.buttonText}>
              {t('wwwPhases.audioAnswer.submitAnswer')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  audioSection: {
    width: '100%',
    marginBottom: 24,
  },
  fallbackContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  fallbackText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  answerArea: {
    flex: 1,
  },
  recordContainer: {
    alignItems: 'center',
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  reRecordButton: {
    marginTop: 15,
    padding: 10,
  },
  reRecordText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  playerSelector: {
    marginBottom: 15,
  },
  playersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 5,
  },
  playerChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#eee',
  },
  playerChipText: {
    fontSize: 13,
    color: '#333',
  }
});
