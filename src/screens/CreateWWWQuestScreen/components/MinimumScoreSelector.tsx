import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';

interface MinimumScoreSelectorProps {
  value: number;
  onChange: (percentage: number) => void;
  disabled?: boolean;
}

const PRESET_SCORES = [0, 50, 70, 80, 100];

export const MinimumScoreSelector: React.FC<MinimumScoreSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const handlePresetPress = (score: number) => {
    if (!disabled) {
      onChange(score);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score === 0) return '#9E9E9E';
    if (score < 50) return '#FF9800';
    if (score < 70) return '#FFC107';
    if (score < 90) return '#4CAF50';
    return '#2196F3';
  };

  const getScoreLabel = (score: number): string => {
    if (score === 0) return 'No Requirement';
    if (score < 50) return 'Low';
    if (score < 70) return 'Moderate';
    if (score < 90) return 'High';
    return 'Perfect Score Required';
  };

  return (
    <View style={[styles.container, disabled && styles.containerDisabled]}>
      <Text style={styles.title}>Minimum Score Requirement</Text>

      {/* Large percentage display */}
      <View style={styles.scoreDisplayContainer}>
        <Text style={[styles.scoreValue, { color: getScoreColor(value) }]}>
          {value}%
        </Text>
        <Text style={styles.scoreLabel}>{getScoreLabel(value)}</Text>
      </View>

      {/* Slider */}
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          value={value}
          onValueChange={onChange}
          minimumTrackTintColor={getScoreColor(value)}
          maximumTrackTintColor="#E0E0E0"
          thumbTintColor={getScoreColor(value)}
          step={5}
          disabled={disabled}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>0%</Text>
          <Text style={styles.sliderLabelText}>100%</Text>
        </View>
      </View>

      {/* Preset buttons */}
      <View style={styles.presetsContainer}>
        <Text style={styles.presetsLabel}>Quick Select:</Text>
        <View style={styles.presetsButtons}>
          {PRESET_SCORES.map((score) => (
            <TouchableOpacity
              key={score}
              style={[
                styles.presetButton,
                value === score && styles.presetButtonActive,
                disabled && styles.presetButtonDisabled,
              ]}
              onPress={() => handlePresetPress(score)}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.presetButtonText,
                  value === score && styles.presetButtonTextActive,
                ]}
              >
                {score}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Help text */}
      <View style={styles.helpContainer}>
        <Text style={styles.helpText}>
          ℹ️ Participants must score at least {value}% to complete this quest
          {value === 0 && ' (any score is acceptable)'}
          {value === 100 && ' (perfect score required)'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  scoreDisplayContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: '700',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  sliderContainer: {
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#999',
  },
  presetsContainer: {
    marginBottom: 16,
  },
  presetsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  presetsButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  presetButtonDisabled: {
    opacity: 0.5,
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  presetButtonTextActive: {
    color: '#2196F3',
  },
  helpContainer: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

export default MinimumScoreSelector;
