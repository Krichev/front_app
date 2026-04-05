// src/screens/CreateSoloQuestScreen/hooks/useCreateSoloQuestForm.ts
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useCreateSoloQuestMutation } from '../../../entities/SoloQuestState/model/slice/soloQuestApi';
import { DepositPolicy, RelationshipStatus, TargetGender } from '../../../entities/SoloQuestState/model/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export interface CreateSoloQuestFormState {
    title: string;
    description: string;
    meetupLocationName: string;
    meetupLatitude: string;
    meetupLongitude: string;
    meetupDate: Date;
    meetupTime: Date;
    targetGender: TargetGender;
    targetAgeMin: string;
    targetAgeMax: string;
    targetRelationshipStatus: RelationshipStatus | '';
    requiredInterests: string[];
    maxDistanceKm: string;
    depositPolicy: DepositPolicy;
    stakeType: string;
    stakeAmount: string;
    stakeCurrency: string;
    socialPenaltyDescription: string;
    showManualCoords: boolean;
}

function defaultDate(): Date {
    const d = new Date();
    d.setHours(d.getHours() + 24);
    return d;
}

export function useCreateSoloQuestForm() {
    const { t } = useTranslation();
    const navigation = useNavigation<NavProp>();
    const [createSoloQuest, { isLoading }] = useCreateSoloQuestMutation();

    const [form, setForm] = useState<CreateSoloQuestFormState>({
        title: '',
        description: '',
        meetupLocationName: '',
        meetupLatitude: '',
        meetupLongitude: '',
        meetupDate: defaultDate(),
        meetupTime: defaultDate(),
        targetGender: 'ANY',
        targetAgeMin: '',
        targetAgeMax: '',
        targetRelationshipStatus: '',
        requiredInterests: [],
        maxDistanceKm: '10',
        depositPolicy: 'NONE',
        stakeType: 'POINTS',
        stakeAmount: '',
        stakeCurrency: 'USD',
        socialPenaltyDescription: '',
        showManualCoords: false,
    });

    const setField = useCallback(<K extends keyof CreateSoloQuestFormState>(
        key: K,
        value: CreateSoloQuestFormState[K],
    ) => {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);

    const fillLocation = useCallback((
        lat: number,
        lng: number,
        locationName: string,
    ) => {
        setForm(prev => ({
            ...prev,
            meetupLatitude: String(lat),
            meetupLongitude: String(lng),
            meetupLocationName: locationName || prev.meetupLocationName,
        }));
    }, []);

    const validate = useCallback((): string | null => {
        const { title, description, meetupLocationName, meetupLatitude, meetupLongitude,
            meetupDate, meetupTime, depositPolicy, stakeAmount } = form;

        if (title.trim().length < 5) {
            return t('createSoloQuest.validation.titleTooShort');
        }
        if (title.trim().length > 100) {
            return t('createSoloQuest.validation.titleTooLong');
        }
        if (description.trim().length < 10) {
            return t('createSoloQuest.validation.descriptionTooShort');
        }
        if (description.trim().length > 1000) {
            return t('createSoloQuest.validation.descriptionTooLong');
        }

        // Combine date and time
        const combined = new Date(meetupDate);
        combined.setHours(meetupTime.getHours(), meetupTime.getMinutes(), 0, 0);
        const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
        if (combined <= oneHourFromNow) {
            return t('createSoloQuest.validation.meetupPast');
        }

        if (!meetupLocationName.trim()) {
            return t('createSoloQuest.validation.locationNameRequired');
        }
        if (meetupLocationName.trim().length > 200) {
            return t('createSoloQuest.validation.locationNameTooLong');
        }

        const lat = parseFloat(meetupLatitude);
        const lng = parseFloat(meetupLongitude);
        if (isNaN(lat) || lat < -90 || lat > 90) {
            return t('createSoloQuest.validation.locationRequired');
        }
        if (isNaN(lng) || lng < -180 || lng > 180) {
            return t('createSoloQuest.validation.locationRequired');
        }

        if (depositPolicy !== 'NONE') {
            const amount = parseFloat(stakeAmount);
            if (isNaN(amount) || amount <= 0) {
                return t('createSoloQuest.validation.stakeRequired');
            }
        }

        if (form.socialPenaltyDescription.length > 500) {
            return t('createSoloQuest.validation.socialPenaltyTooLong');
        }

        return null;
    }, [form, t]);

    const handleSubmit = useCallback(async () => {
        const error = validate();
        if (error) {
            Alert.alert(t('common.error'), error);
            return;
        }

        const combined = new Date(form.meetupDate);
        combined.setHours(form.meetupTime.getHours(), form.meetupTime.getMinutes(), 0, 0);

        try {
            const result = await createSoloQuest({
                title: form.title.trim(),
                description: form.description.trim(),
                meetupLocationName: form.meetupLocationName.trim(),
                meetupLatitude: parseFloat(form.meetupLatitude),
                meetupLongitude: parseFloat(form.meetupLongitude),
                meetupDatetime: combined.toISOString(),
                targetGender: form.targetGender !== 'ANY' ? form.targetGender : undefined,
                targetAgeMin: form.targetAgeMin ? parseInt(form.targetAgeMin, 10) : undefined,
                targetAgeMax: form.targetAgeMax ? parseInt(form.targetAgeMax, 10) : undefined,
                targetRelationshipStatus: form.targetRelationshipStatus || undefined,
                requiredInterests: form.requiredInterests.length > 0 ? form.requiredInterests : undefined,
                maxDistanceKm: form.maxDistanceKm ? parseFloat(form.maxDistanceKm) : undefined,
                depositPolicy: form.depositPolicy,
                stakeType: form.depositPolicy !== 'NONE' ? form.stakeType : undefined,
                stakeAmount: form.depositPolicy !== 'NONE' ? parseFloat(form.stakeAmount) : undefined,
                stakeCurrency: (form.depositPolicy !== 'NONE' && form.stakeType === 'MONEY') ? form.stakeCurrency : undefined,
                socialPenaltyDescription: form.socialPenaltyDescription.trim() || undefined,
            }).unwrap();

            Alert.alert(
                t('createSoloQuest.successTitle'),
                t('createSoloQuest.successMessage'),
                [
                    {
                        text: t('createSoloQuest.viewFeed'),
                        onPress: () => navigation.navigate('SoloQuestFeed'),
                    },
                ],
            );
        } catch {
            Alert.alert(t('common.error'), t('soloQuest.errors.createFailed'));
        }
    }, [form, validate, createSoloQuest, navigation, t]);

    return { form, setField, fillLocation, handleSubmit, isLoading };
}
