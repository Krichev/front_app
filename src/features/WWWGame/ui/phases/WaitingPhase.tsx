import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppStyles } from '../../../../shared/ui/hooks/useAppStyles';
import { phaseStyles } from './phases.styles';

interface WaitingPhaseProps {
  roundTime: number;
  onStart: () => void;
  isLoading: boolean;
}

export const WaitingPhase: React.FC<WaitingPhaseProps> = ({
  roundTime,
  onStart,
  isLoading,
}) => {
  const { theme } = useAppStyles();
  const styles = phaseStyles(theme);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="play-circle-outline"
        size={80}
        color={theme.colors.success.main}
        style={styles.icon}
      />
      <Text style={styles.title}>Ready to Start?</Text>
      <Text style={styles.text}>
        Welcome to WWW_QUIZ!{'

'}        You'll have {roundTime} seconds to discuss each question with your team.{'

'}        When you're ready to begin, press the button below.
      </Text>
      <TouchableOpacity
        style={[styles.button, isLoading && styles.disabledButton]}
        onPress={onStart}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Starting...' : 'Start Quiz'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

