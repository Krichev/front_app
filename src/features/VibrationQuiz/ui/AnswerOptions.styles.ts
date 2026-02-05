import { StyleSheet } from 'react-native';
import { Theme } from '../../../shared/ui/theme/types';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      width: '100%',
      paddingHorizontal: 16,
      justifyContent: 'center',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    buttonContainer: {
      width: '48%',
      aspectRatio: 1.5,
      borderRadius: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      overflow: 'hidden',
    },
    button: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
    },
    text: {
      ...theme.typography.body.large,
      fontWeight: '600',
      textAlign: 'center',
    },
    correctHighlight: {
      borderColor: theme.colors.success.main,
      borderWidth: 3,
    },
    wrongHighlight: {
      borderColor: theme.colors.error.main,
      borderWidth: 3,
    },
  });
};