import React from 'react';
import { View, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { VerificationMethod, VerificationType } from '../../../app/types';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../shared/ui/theme/createStyles';
import VerificationStatusBadge from './VerificationStatusBadge';

interface GenericVerificationCardProps {
  method: VerificationMethod & { status: string };
}

const GenericVerificationCard: React.FC<GenericVerificationCardProps> = ({ method }) => {
  const { t } = useTranslation();
  const { theme } = useAppStyles();
  const styles = themeStyles;
  const status = (method.status as any) || 'PENDING';

  const getTypeConfig = (type: VerificationType) => {
    switch (type) {
      case 'QUIZ':
        return { icon: 'help-circle-outline' as const, label: t('challengeVerification.types.quiz') };
      case 'MANUAL':
        return { icon: 'hand-pointing-right' as const, label: t('challengeVerification.types.manual') };
      case 'FITNESS_API':
        return { icon: 'run' as const, label: t('challengeVerification.types.fitness') };
      case 'ACTIVITY':
        return { icon: 'lightning-bolt' as const, label: t('challengeVerification.types.activity') };
      default:
        return { icon: 'checkbox-marked-circle-outline' as const, label: type };
    }
  };

  const config = getTypeConfig(method.type);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons 
            name={config.icon} 
            size={20} 
            color={theme.colors.primary.main || '#2196F3'} 
            style={styles.typeIcon}
          />
          <Text style={styles.title}>{t('challengeVerification.genericTitle', { type: config.label })}</Text>
        </View>
        <VerificationStatusBadge status={status} />
      </View>

      <View style={styles.content}>
        <Text style={styles.prompt}>
          {method.details.description || t('challengeVerification.genericDefaultPrompt')}
        </Text>
      </View>
    </View>
  );
};

const themeStyles = createStyles(theme => ({
  card: {
    backgroundColor: theme.colors.background.primary || 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary || '#333',
  },
  content: {
    marginTop: 4,
  },
  prompt: {
    fontSize: 14,
    color: theme.colors.text.secondary || '#555',
  },
}));

export default GenericVerificationCard;
