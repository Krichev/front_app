import React from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from "react-native-screens/native-stack";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useGetChallengeByIdQuery } from '../../entities/ChallengeState/model/slice/challengeApi';
import { useAppStyles } from '../../shared/ui/hooks/useAppStyles';
import { useVerificationMethods } from './hooks/useVerificationMethods';
import { useVerificationSubmission } from './hooks/useVerificationSubmission';
import { themeStyles } from './styles';

import PhotoVerificationCard from './components/PhotoVerificationCard';
import LocationVerificationCard from './components/LocationVerificationCard';
import GenericVerificationCard from './components/GenericVerificationCard';

type RootStackParamList = {
  ChallengeVerification: { challengeId: string };
  ChallengeDetails: { challengeId: string };
  PhotoVerification: { challengeId: string; prompt?: string };
  LocationVerification: { challengeId: string };
};

type ChallengeVerificationRouteProp = RouteProp<RootStackParamList, 'ChallengeVerification'>;
type ChallengeVerificationNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChallengeVerification'>;

const ChallengeVerificationScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<ChallengeVerificationRouteProp>();
  const navigation = useNavigation<ChallengeVerificationNavigationProp>();
  const { challengeId } = route.params;

  // API Hooks
  const { data: challenge, isLoading, error } = useGetChallengeByIdQuery(challengeId);
  
  // Custom Hooks
  const {
    verificationMethods,
    photoUri,
    locationData,
  } = useVerificationMethods(challenge);

  const {
    submitVerifications,
    isSubmitting,
    isProcessing,
  } = useVerificationSubmission({
    challengeId,
    verificationMethods,
    photoUri,
    locationData,
    onSuccess: () => navigation.goBack(),
  });

  const { theme } = useAppStyles();
  const styles = themeStyles;

  // Navigation handlers
  const handleNavigateToPhoto = (prompt?: string) => {
    navigation.navigate('PhotoVerification', { challengeId, prompt });
  };

  const handleNavigateToLocation = () => {
    navigation.navigate('LocationVerification', { challengeId });
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text style={styles.loadingText}>{t('challengeVerification.loading')}</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !challenge) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error.main} />
        <Text style={styles.errorText}>{t('challengeVerification.loadFailed')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>{t('common.goBack')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{challenge.title}</Text>
          <Text style={styles.subtitle}>{t('challengeVerification.verificationRequirements')}</Text>
        </View>

        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.text.inverse || 'white'} />
            <Text style={styles.processingText}>{t('challengeVerification.processing')}</Text>
          </View>
        )}

        <View style={styles.content}>
          {/* Challenge description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>{t('challengeVerification.challengeDescription')}</Text>
            <Text style={styles.descriptionText}>{challenge.description}</Text>
          </View>

          {/* Verification methods */}
          <View style={styles.methodsContainer}>
            <Text style={styles.sectionTitle}>{t('challengeVerification.verificationMethods')}</Text>

            {verificationMethods.length > 0 ? (
              verificationMethods.map((method, index) => {
                const key = `${method.type}-${index}`;
                switch (method.type) {
                  case 'PHOTO':
                    return (
                      <PhotoVerificationCard
                        key={key}
                        method={method}
                        challengeId={challengeId}
                        photoUri={photoUri}
                        onNavigateToPhoto={() => handleNavigateToPhoto(method.details.photoPrompt || method.details.description)}
                        isSubmitting={isSubmitting}
                        isProcessing={isProcessing}
                      />
                    );
                  case 'LOCATION':
                    return (
                      <LocationVerificationCard
                        key={key}
                        method={method}
                        challengeId={challengeId}
                        locationData={locationData}
                        onNavigateToLocation={handleNavigateToLocation}
                        isSubmitting={isSubmitting}
                        isProcessing={isProcessing}
                      />
                    );
                  default:
                    return <GenericVerificationCard key={key} method={method} />;
                }
              })
            ) : (
              <Text style={styles.noMethodsText}>{t('challengeVerification.noMethodsFound')}</Text>
            )}
          </View>

          {/* Submit button */}
          {verificationMethods.length > 0 && (
            <TouchableOpacity
              style={[
                styles.submitButton,
                (isSubmitting || isProcessing) && styles.disabledButton
              ]}
              onPress={submitVerifications}
              disabled={isSubmitting || isProcessing}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={theme.colors.text.inverse || 'white'} />
              ) : (
                <>
                  <MaterialCommunityIcons 
                    name="check-circle" 
                    size={20} 
                    color={theme.colors.text.inverse || 'white'} 
                  />
                  <Text style={styles.submitButtonText}>{t('challengeVerification.submitVerification')}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChallengeVerificationScreen;
