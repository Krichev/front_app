import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import {AudioChallengeType, AUDIO_CHALLENGE_TYPES_INFO} from '../../../types/audioChallenge.types';

interface AudioChallengeHeaderProps {
  challengeType?: AudioChallengeType;
  minimumScorePercentage?: number;
  instructions?: string;
}

export const AudioChallengeHeader: React.FC<AudioChallengeHeaderProps> = ({
  challengeType,
  minimumScorePercentage,
  instructions,
}) => {
  const { t } = useTranslation();
  const typeInfo = challengeType ? AUDIO_CHALLENGE_TYPES_INFO[challengeType] : null;

  return (
    <View style={styles.container}>
      {/* Header with Icon and Type */}
      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons 
            name={typeInfo?.icon || 'microphone'} 
            size={28} 
            color="#4CAF50" 
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {challengeType ? t(`audioChallenge.types.${challengeType}.label`) : t('audioChallenge.header.title')}
          </Text>
          <Text style={styles.description}>
            {challengeType ? t(`audioChallenge.types.${challengeType}.description`) : t('audioChallenge.header.defaultDescription')}
          </Text>
        </View>
      </View>

      {/* Instructions */}
      {instructions && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>{instructions}</Text>
        </View>
      )}

      {/* Passing Score Badge */}
      {minimumScorePercentage !== undefined && minimumScorePercentage > 0 && (
        <View style={styles.scoreContainer}>
          <MaterialCommunityIcons name="trophy-outline" size={16} color="#FF9800" />
          <Text style={styles.scoreText}>
            {t('audioChallenge.header.passScore', { percentage: minimumScorePercentage })}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
  instructionsContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  scoreText: {
    fontSize: 12,
    color: '#F57C00',
    fontWeight: '600',
    marginLeft: 6,
  },
});
