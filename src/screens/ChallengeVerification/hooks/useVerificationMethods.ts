import { useState, useEffect, useMemo } from 'react';
import { ChallengeService } from '../../../services/verification/ChallengeService';
import { VerificationMethod, VerificationStatus, LocationData } from '../../../app/types';
import { ApiChallenge } from '../../../entities/ChallengeState/model/slice/challengeApi';

interface UseVerificationMethodsResult {
  verificationMethods: (VerificationMethod & { status: VerificationStatus })[];
  setVerificationMethods: (methods: (VerificationMethod & { status: VerificationStatus })[]) => void;
  photoUri: string | null;
  setPhotoUri: (uri: string | null) => void;
  locationData: LocationData | null;
  setLocationData: (data: LocationData | null) => void;
}

export const useVerificationMethods = (challenge?: ApiChallenge | null): UseVerificationMethodsResult => {
  const [verificationMethods, setVerificationMethods] = useState<(VerificationMethod & { status: VerificationStatus })[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  useEffect(() => {
    if (challenge) {
      const methods = ChallengeService.getVerificationMethods(challenge);
      const methodsWithStatus = methods.map(method => ({
        ...method,
        status: (method.status as VerificationStatus) || 'PENDING'
      }));
      setVerificationMethods(methodsWithStatus);
    }
  }, [challenge]);

  return {
    verificationMethods,
    setVerificationMethods,
    photoUri,
    setPhotoUri,
    locationData,
    setLocationData,
  };
};
