import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppStyles } from '../../../../shared/ui/hooks/useAppStyles';
import { phaseStyles } from './phases.styles';
import { QuizQuestion } from '../../../../entities/QuizState/model/slice/quizApi';
import { AudioChallengePhase } from './AudioChallengePhase';
import { AudioAnswerPhase } from './AudioAnswerPhase';
import { useAnswerTimer } from '../../hooks/useAnswerTimer';
import { GenericScoringResponse } from '../../../../types/audioChallenge.types';

interface AnswerPhaseProps {
  question: QuizQuestion;
  answer?: string;
  player?: string;
  onAnswerChange?: (text: string) => void;
  onPlayerChange?: (player: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  gameSettings?: any;
  teamMembers?: string[];
  onAudioRecordingComplete?: (audioFile: { uri: string; name: string; type: string }) => void;
  recordedAudio?: { uri: string; name: string; type: string } | null;
  onScoringComplete?: (result: GenericScoringResponse) => void;
}

export const AnswerPhase: React.FC<AnswerPhaseProps> = ({
  question,
  answer: propsAnswer,
  player: propsPlayer,
  onAnswerChange,
  onPlayerChange,
  onSubmit,
  isSubmitting,
  gameSettings,
  teamMembers = [],
  onAudioRecordingComplete,
  recordedAudio,
  onScoringComplete,
}) => {
  const { t } = useTranslation();
  const { theme } = useAppStyles();
  const styles = phaseStyles(theme);
  
  // Local state if props not provided
  const [localAnswer, setLocalAnswer] = useState('');
  const [localPlayer, setLocalPlayer] = useState('');
  
  const answer = propsAnswer !== undefined ? propsAnswer : localAnswer;
  const player = propsPlayer !== undefined ? propsPlayer : localPlayer;

  const [showHint, setShowHint] = useState(false);
  const hasStartedTyping = useRef(false);

  const isAudioChallenge = question.questionType === 'AUDIO' && !!question.audioChallengeType;
  const isAnyAudioQuestion = question.questionType === 'AUDIO';

  // Initialize two-phase timer
  // initialTypingTime: seconds before user must start typing (then auto-submits)
  // completionTime: seconds to finish typing after first keystroke
  const timer = useAnswerTimer({
    initialTypingTime: 30,
    completionTime: 30,
    onAutoSubmit: onSubmit,
  });

  const handleAnswerChange = (text: string) => {
    if (onAnswerChange) {
        onAnswerChange(text);
    } else {
        setLocalAnswer(text);
    }
    
    if (!hasStartedTyping.current && text.length > 0) {
      hasStartedTyping.current = true;
      timer.startCompletionPhase();
    }
  };

  const handlePlayerSelect = (p: string) => {
      if (onPlayerChange) {
          onPlayerChange(p);
      } else {
          setLocalPlayer(p);
      }
  };

  if (isAudioChallenge || (isAnyAudioQuestion && question.questionMediaId)) {
    return (
      <AudioAnswerPhase
        question={question}
        answer={answer}
        onAnswerChange={handleAnswerChange}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        gameSettings={gameSettings}
        onAudioRecordingComplete={onAudioRecordingComplete}
        recordedAudio={recordedAudio}
        player={player}
        onPlayerChange={handlePlayerSelect}
        onScoringComplete={onScoringComplete}
      />
    );
  }

  const effectivePlayers = teamMembers.length > 0 ? teamMembers : (gameSettings?.players || []);

  return (
    <View style={styles.container}>
      {/* Answer Timer Display */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>
          {timer.phase === 'typing'
            ? t('wwwPhases.answer.startTyping')
            : t('wwwPhases.answer.timeToComplete', { seconds: timer.timeLeft })}
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

      <Text style={styles.title}>{t('wwwPhases.audioAnswer.title')}</Text>
      <Text style={styles.text}>{question.question}</Text>

      {question.additionalInfo && (
        <View>
          <TouchableOpacity
            style={{ alignSelf: 'center', padding: theme.spacing.sm, marginBottom: theme.spacing.lg }}
            onPress={() => setShowHint(!showHint)}
          >
            <Text style={{ color: theme.colors.info.main, fontWeight: theme.typography.fontWeight.medium }}>
              {showHint ? t('common.hide') : t('common.showHint')}
            </Text>
          </TouchableOpacity>
          {showHint && (
            <View style={{ backgroundColor: theme.colors.background.secondary, padding: theme.spacing.md, borderRadius: theme.layout.borderRadius.md, marginBottom: theme.spacing.lg }}>
              <Text style={{ color: theme.colors.text.secondary, fontStyle: 'italic' }}>{question.additionalInfo}</Text>
            </View>
          )}
        </View>
      )}

      {effectivePlayers.length > 0 && (
        <View style={{ marginBottom: theme.spacing.lg }}>
          <Text style={styles.label}>{t('wwwPhases.answer.whoIsAnswering')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', maxHeight: 50 }}>
            {effectivePlayers.map((p: string) => (
              <TouchableOpacity
                key={p}
                style={{ paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, borderRadius: theme.layout.borderRadius['2xl'], backgroundColor: player === p ? theme.colors.success.main : theme.colors.background.tertiary, marginRight: theme.spacing.sm }}
                onPress={() => handlePlayerSelect(p)}
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
        <Text style={styles.label}>{t('wwwPhases.answer.teamAnswer')}</Text>
        <TextInput
          style={styles.input}
          value={answer}
          onChangeText={handleAnswerChange}
          placeholder={t('wwwPhases.answer.enterAnswer')}
          multiline
          placeholderTextColor={theme.colors.text.disabled}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.disabledButton]}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? t('wwwPhases.answer.submitting') : t('wwwPhases.answer.submitAnswer')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};