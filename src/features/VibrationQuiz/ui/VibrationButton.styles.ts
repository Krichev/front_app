import { StyleSheet } from 'react-native';
import { Theme } from '../../../shared/ui/theme/types';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 40,
    },
    button: {
      width: 200,
      height: 200,
      borderRadius: 100,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      borderWidth: 4,
    },
    icon: {
      marginBottom: 10,
    },
    text: {
      ...theme.typography.heading.h3,
      textAlign: 'center',
      fontWeight: 'bold',
    },
    subText: {
      ...theme.typography.body.medium,
      marginTop: 8,
      textAlign: 'center',
    },
    ripple: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
      borderWidth: 2,
      borderColor: theme.colors.primary.main,
      zIndex: -1,
    },
  });
};