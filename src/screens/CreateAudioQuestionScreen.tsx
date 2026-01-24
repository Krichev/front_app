// src/screens/CreateAudioQuestionScreen.tsx
import React, {useCallback, useState} from 'react';
import {
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
} from 'react-native';
import {useNavigation, useRoute, RouteProp, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {AudioQuestionForm, AudioQuestionFormData} from './components/AudioQuestionForm';
import {useAudioQuestionSubmit} from './components/hooks/useAudioQuestionSubmit';

// ============================================================================
// TYPES
// ============================================================================

type RootStackParamList = {
    UserQuestions: undefined;
    CreateAudioQuestion: { 
        returnTo?: 'CreateWWWQuest' | 'UserQuestions';
    };
    AudioQuestionDetail: {questionId: number};
    CreateWWWQuest: undefined;
};

type CreateAudioQuestionRouteProp = RouteProp<RootStackParamList, 'CreateAudioQuestion'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateAudioQuestion'>;

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Screen for creating new audio challenge questions.
 * Provides a full-page form with all audio challenge configuration options.
 */
const CreateAudioQuestionScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<CreateAudioQuestionRouteProp>();
    const returnTo = route.params?.returnTo;
    const [formResetKey, setFormResetKey] = useState(0);

    const {submitAudioQuestion, isSubmitting, resetMutation} = useAudioQuestionSubmit({
        onSuccess: (questionId) => {
            console.log('✅ Audio question created:', questionId);
            if (returnTo === 'CreateWWWQuest') {
                navigation.goBack(); // Return to the previous screen (CreateWWWQuestScreen)
            } else {
                navigation.navigate('UserQuestions');
            }
        },
        onError: (error) => {
            console.error('❌ Audio question creation failed:', error);
        },
    });

    useFocusEffect(
        useCallback(() => {
            // Reset mutation state when screen gains focus
            resetMutation();
            // Force form reset by updating key
            setFormResetKey(prev => prev + 1);
            
            return () => {
                // Optional cleanup on blur
            };
        }, [resetMutation])
    );

    const handleSubmit = useCallback(
        async (formData: AudioQuestionFormData) => {
            await submitAudioQuestion(formData);
        },
        [submitAudioQuestion]
    );

    const handleCancel = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleCancel}
                    disabled={isSubmitting}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Create Audio Question</Text>
                    <Text style={styles.headerSubtitle}>
                        Create a karaoke, rhythm, or sound challenge
                    </Text>
                </View>
                <View style={styles.headerIcon}>
                    <MaterialCommunityIcons name="microphone" size={28} color="#FFFFFF" />
                </View>
            </View>

            {/* Form */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                <AudioQuestionForm
                    key={formResetKey}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    isSubmitting={isSubmitting}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    headerIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardAvoid: {
        flex: 1,
    },
});

export default CreateAudioQuestionScreen;