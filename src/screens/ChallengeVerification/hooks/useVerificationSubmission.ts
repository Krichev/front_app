import { useState } from 'react';
import { Alert } from 'react-native';
import { useSubmitChallengeCompletionMutation } from '../../../entities/ChallengeState/model/slice/challengeApi';
import { VerificationMethod, VerificationStatus, LocationData } from '../../../app/types';

interface UseVerificationSubmissionProps {
  challengeId: string;
  verificationMethods: (VerificationMethod & { status: VerificationStatus })[];
  photoUri: string | null;
  locationData: LocationData | null;
  onSuccess: () => void;
}

interface UseVerificationSubmissionResult {
  submitVerifications: () => Promise<void>;
  isSubmitting: boolean;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
}

export const useVerificationSubmission = ({
  challengeId,
  verificationMethods,
  photoUri,
  locationData,
  onSuccess,
}: UseVerificationSubmissionProps): UseVerificationSubmissionResult => {
  const [submitCompletion, { isLoading: isSubmitting }] = useSubmitChallengeCompletionMutation();
  const [isProcessing, setIsProcessing] = useState(false);

  const submitToServer = async () => {
    if (!challengeId) {
      Alert.alert('Error', 'Challenge ID is missing');
      return;
    }

    try {
      const verificationData = {
        photo: photoUri,
        location: locationData,
        verificationMethods: verificationMethods.map(method => ({
          type: method.type,
          status: method.status,
          result: method.result
        }))
      };

      await submitCompletion({
        challengeId: challengeId,
        completionData: {
          verificationData: verificationData,
          notes: null
        }
      }).unwrap();

      Alert.alert(
        'Verification Submitted',
        'Your challenge verification has been submitted successfully.',
        [
          { text: 'OK', onPress: onSuccess }
        ]
      );
    } catch (error) {
      console.error('Error submitting to server:', error);
      Alert.alert('Error', 'Failed to submit your verification. Please try again.');
    }
  };

  const submitVerifications = async () => {
    if (isSubmitting || isProcessing) return;

    try {
      // Check if all required verifications are completed
      const allCompleted = verificationMethods.every(method => method.status === 'COMPLETED');

      if (!allCompleted) {
        const pending = verificationMethods.filter(method => method.status === 'PENDING');
        if (pending.length > 0) {
          Alert.alert('Incomplete Verification', 'Please complete all verification methods before submitting.');
          return;
        }

        const failed = verificationMethods.filter(method => method.status === 'FAILED');
        if (failed.length > 0) {
          Alert.alert(
              'Failed Verification',
              'Some verification methods have failed. Do you want to try again?',
              [
                { text: 'Try Again', style: 'cancel' },
                { text: 'Submit Anyway', onPress: () => submitToServer() }
              ]
          );
          return;
        }
      }

      await submitToServer();
    } catch (error) {
      console.error('Error submitting verifications:', error);
      Alert.alert('Error', 'Failed to submit your challenge verification. Please try again.');
    }
  };

  return {
    submitVerifications,
    isSubmitting,
    isProcessing,
    setIsProcessing,
  };
};
