import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { createStyles } from '../../../../shared/ui/theme';

interface ExitGameModalProps {
  visible: boolean;
  onResume: () => void;
  onPauseAndExit: () => void;
  onAbandon: () => void;
  isPausing?: boolean;
}

export const ExitGameModal: React.FC<ExitGameModalProps> = ({
  visible,
  onResume,
  onPauseAndExit,
  onAbandon,
  isPausing
}) => {
  const styles = themeStyles;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onResume}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Exit Game?</Text>
          <Text style={styles.message}>
            Your progress will be lost if you don't pause.
          </Text>

          <TouchableOpacity 
            style={[styles.button, styles.resumeButton]} 
            onPress={onResume}
          >
            <Text style={styles.resumeText}>Resume Game</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.pauseButton]} 
            onPress={onPauseAndExit}
            disabled={isPausing}
          >
            <Text style={styles.pauseText}>
              {isPausing ? 'Pausing...' : 'Pause & Exit'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.abandonButton]} 
            onPress={onAbandon}
          >
            <Text style={styles.abandonText}>Abandon Game</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const themeStyles = createStyles(theme => ({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  resumeButton: {
    backgroundColor: theme.colors.primary.main,
  },
  resumeText: {
    color: theme.colors.text.inverse,
    fontWeight: '600',
    fontSize: 16,
  },
  pauseButton: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.primary.main,
  },
  pauseText: {
    color: theme.colors.primary.main,
    fontWeight: '600',
    fontSize: 16,
  },
  abandonButton: {
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  abandonText: {
    color: theme.colors.error.main,
    fontSize: 14,
    fontWeight: '500',
  },
}));
