import React from 'react';
import { View, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { VerificationStatus } from '../../../app/types';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../shared/ui/theme/createStyles';

interface VerificationStatusBadgeProps {
  status: VerificationStatus;
}

const VerificationStatusBadge: React.FC<VerificationStatusBadgeProps> = ({ status }) => {
  const { theme } = useAppStyles();
  const styles = themeStyles;

  const getStatusConfig = () => {
    switch (status) {
      case 'COMPLETED':
        return {
          icon: 'check-circle' as const,
          color: theme.colors.success.main,
          text: 'Verified', // TODO: i18n
        };
      case 'FAILED':
        return {
          icon: 'close-circle' as const,
          color: theme.colors.error.main,
          text: 'Failed', // TODO: i18n
        };
      case 'PENDING':
      default:
        return {
          icon: 'clock-outline' as const,
          color: theme.colors.warning.main,
          text: 'Pending', // TODO: i18n
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.color }]}>
      <MaterialCommunityIcons name={config.icon} size={14} color={theme.colors.text.inverse || 'white'} />
      <Text style={styles.text}>{config.text}</Text>
    </View>
  );
};

const themeStyles = createStyles(theme => ({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  text: {
    color: theme.colors.text.inverse || 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
}));

export default VerificationStatusBadge;
