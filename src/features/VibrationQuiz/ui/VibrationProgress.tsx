import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../../shared/ui/theme/ThemeProvider';

interface VibrationProgressProps {
  progress: number; // 0 to 1
  isVibrating: boolean;
}

export const VibrationProgress: React.FC<VibrationProgressProps> = ({
  progress,
  isVibrating,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.track,
          { backgroundColor: theme.colors.neutral.gray[200] },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${Math.min(100, Math.max(0, progress * 100))}%`,
              backgroundColor: isVibrating
                ? theme.colors.secondary.main
                : theme.colors.primary.main,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 8,
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  track: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});