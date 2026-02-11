// src/screens/components/QuestionDisplay.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MediaType, QuestionType } from '../../services/wwwGame/questionService';
import { AudioChallengeType } from '../../types/audioChallenge.types';
import { KaraokeQuestionDisplay } from './KaraokeQuestionDisplay';
import QuestionMediaViewer from '../CreateWWWQuestScreen/components/QuestionMediaViewer';
import { AudioPlayer } from './AudioPlayer';
import VideoQuestionDisplay from '../../components/VideoQuestionDisplay';

export interface QuestionDisplayProps {
  question: {
    id: number;
    question: string;
    questionType: QuestionType;
    questionMediaUrl?: string;
    questionMediaId?: number;
    questionMediaType?: MediaType;
    // Audio challenge specific (only when questionType === 'AUDIO')
    audioChallengeType?: AudioChallengeType;
    audioSegmentStart?: number;
    audioSegmentEnd?: number;
    minimumScorePercentage?: number;
    additionalInfo?: string;
  };
  phase: 'question' | 'discussion' | 'answer';
  onRecordingComplete?: (audioFile: { uri: string; name: string; type: string }) => void;
  disabled?: boolean;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  phase,
  onRecordingComplete,
  disabled = false,
}) => {
  const isKaraokeChallenge = question.questionType === QuestionType.AUDIO && !!question.audioChallengeType;
  const isRegularAudio = question.questionType === QuestionType.AUDIO && !question.audioChallengeType;
  const hasMedia = ([QuestionType.IMAGE, QuestionType.VIDEO, QuestionType.AUDIO] as QuestionType[]).includes(question.questionType);

  // Helper to render type badge
  const renderTypeBadge = () => {
    let iconName = 'help-circle';
    let label = 'Question';
    let color = '#007AFF';

    switch (question.questionType) {
      case QuestionType.TEXT:
        iconName = 'text-box-outline';
        label = 'Text Question';
        color = '#607D8B';
        break;
      case QuestionType.IMAGE:
        iconName = 'image';
        label = 'Image Question';
        color = '#9C27B0';
        break;
      case QuestionType.VIDEO:
        iconName = 'video';
        label = 'Video Question';
        color = '#F44336';
        break;
      case QuestionType.AUDIO:
        if (isKaraokeChallenge) {
          iconName = 'microphone';
          label = 'Audio Challenge';
          color = '#FF9800';
        } else {
          iconName = 'music';
          label = 'Audio Question';
          color = '#4CAF50';
        }
        break;
    }

    return (
      <View style={[styles.typeBadge, { backgroundColor: `${color}20` }]}>
        <MaterialCommunityIcons name={iconName} size={16} color={color} />
        <Text style={[styles.typeBadgeText, { color }]}>{label}</Text>
      </View>
    );
  };

  // Render Karaoke Challenge
  if (isKaraokeChallenge) {
    // In answer phase, show full recording interface
    if (phase === 'answer') {
      return (
        <View style={styles.container}>
          {renderTypeBadge()}
          <KaraokeQuestionDisplay
            question={question}
            onRecordingComplete={onRecordingComplete || (() => {})}
            disabled={disabled}
          />
        </View>
      );
    }
    
    // In other phases, show preview/listen only
    return (
      <View style={styles.container}>
        {renderTypeBadge()}
        <KaraokeQuestionDisplay
          question={question}
          onRecordingComplete={() => {}} // No recording in these phases
          disabled={true} // Disable recorder
        />
      </View>
    );
  }

  // Render Regular Media Questions (Image, Video, Regular Audio)
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {renderTypeBadge()}
      </View>

      {/* Media Content */}
      {hasMedia && (
        <View style={styles.mediaContainer}>
          {question.questionType === QuestionType.VIDEO ? (
             <VideoQuestionDisplay 
                question={question as any}
                showAnswer={phase === 'answer'}
             />
          ) : isRegularAudio ? (
            // For regular audio, use AudioPlayer if URL is available, or QuestionMediaViewer if using ID
            question.questionMediaUrl ? (
              <AudioPlayer 
                audioUrl={question.questionMediaUrl}
                segmentStart={question.audioSegmentStart}
                segmentEnd={question.audioSegmentEnd}
              />
            ) : (
              <QuestionMediaViewer 
                questionId={question.id} 
                mediaType={MediaType.AUDIO} 
                height={80}
              />
            )
          ) : (
            // Image/Video
            <QuestionMediaViewer 
              questionId={question.id} 
              mediaType={question.questionMediaType || (question.questionType as unknown as MediaType)}
              height={200}
              enableFullscreen={true}
              // Only auto-play video in question/discussion phases if desired, but QuestionMediaViewer defaults to no autoplay usually
            />
          )}
        </View>
      )}

      {/* Question Text */}
      <Text style={styles.questionText}>{question.question}</Text>
      
      {/* Additional Info / Hint */}
      {question.additionalInfo && phase !== 'question' && (
        <View style={styles.hintContainer}>
          <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#FF9800" />
          <Text style={styles.hintText}>{question.additionalInfo}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mediaContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    lineHeight: 26,
    marginBottom: 8,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#E65100',
    flex: 1,
  },
});
