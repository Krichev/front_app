import React, {useState} from 'react';
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useAppStyles} from '../../../../shared/ui/hooks/useAppStyles';
import {phaseStyles} from './phases.styles';
import {QuizQuestion} from '../../../../entities/QuizState/model/slice/quizApi';
import QuestionMediaViewer from '../../../../screens/CreateWWWQuestScreen/components/QuestionMediaViewer';
import ExternalVideoPlayer from '../../../../components/ExternalVideoPlayer';
import {MediaType} from '../../../../services/wwwGame/questionService';
import {MediaSourceType} from '../../../../entities/QuizState/model/types/question.types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {AudioChallengeContainer} from '../../../../screens/components/audio/AudioChallengeContainer';
import {extractYouTubeVideoId} from '../../../../utils/youtubeUtils';
import {VoiceRecorderV2} from '../../../../shared/ui';

interface DiscussionPhaseProps {
    question: QuizQuestion;
    timeLeft: number;
    animation: Animated.Value;
    notes: string;
    onNotesChange: (text: string) => void;
    onSubmitEarly: () => void;
    isVoiceEnabled?: boolean;
}

export const DiscussionPhase: React.FC<DiscussionPhaseProps> = ({
    question,
    timeLeft,
    animation,
    notes,
    onNotesChange,
    onSubmitEarly,
    isVoiceEnabled = false,
}) => {
    const {t} = useTranslation();
    const {theme} = useAppStyles();
    const styles = phaseStyles(theme);
    const [voiceTranscription, setVoiceTranscription] = useState('');

    const handleVoiceTranscription = (text: string) => {
        setVoiceTranscription(text);
        if (text) {
            onNotesChange(notes ? `${notes} ${text}` : text);
        }
    };

    // ── Media type helpers (same logic as before) ──────────────────
    const isAudioChallenge =
        question.questionType === 'AUDIO' && !!question.audioChallengeType;

    const getMediaType = (): MediaType | null => {
        const mt = question.questionMediaType?.toUpperCase();
        if (mt && ['IMAGE', 'VIDEO', 'AUDIO'].includes(mt)) return mt as MediaType;
        const qt = question.questionType?.toUpperCase();
        if (qt && ['IMAGE', 'VIDEO', 'AUDIO'].includes(qt)) return qt as MediaType;
        return null;
    };

    const mediaType = getMediaType();
    const hasExternalMedia =
        !!question.externalMediaUrl || !!question.externalMediaId;
    const showMedia =
        !!mediaType &&
        !isAudioChallenge &&
        (!!question.questionMediaId || hasExternalMedia);

    // Determine media source type for QuestionMediaViewer
    const getMediaSourceType = (): MediaSourceType | undefined => {
        if (question.mediaSourceType) return question.mediaSourceType as MediaSourceType;
        if (question.externalMediaUrl || question.externalMediaId) return 'EXTERNAL' as MediaSourceType;
        if (question.questionMediaId) return 'UPLOADED' as MediaSourceType;
        return undefined;
    };

    // Check if external media is a YouTube link
    const youtubeVideoId = question.externalMediaUrl
        ? extractYouTubeVideoId(question.externalMediaUrl)
        : null;

    // ── Render ─────────────────────────────────────────────────────
    return (
        <KeyboardAvoidingView
            style={{flex: 1}}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <ScrollView
                style={{flex: 1}}
                contentContainerStyle={{
                    padding: theme.spacing['2xl'],
                    paddingBottom: theme.spacing['3xl'],
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* ── Timer ─────────────────────────────────── */}
                <View style={styles.timerContainer}>
                    <Text style={styles.timerText}>
                        {t('wwwPhases.discussion.timeRemaining', {seconds: timeLeft})}
                    </Text>
                    <View style={styles.timerBar}>
                        <Animated.View
                            style={[
                                styles.timerProgress,
                                {
                                    width: animation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%'],
                                    }),
                                },
                            ]}
                        />
                    </View>
                </View>

                {/* ── Question text ─────────────────────────── */}
                <Text style={styles.title}>{question.question}</Text>
                {question.additionalInfo ? (
                    <Text style={styles.text}>{question.additionalInfo}</Text>
                ) : null}

                {/* ── Audio challenge ───────────────────────── */}
                {isAudioChallenge && (
                    <AudioChallengeContainer question={question} mode="preview" />
                )}

                {/* ── YouTube external video ───────────────── */}
                {!isAudioChallenge && youtubeVideoId && (
                    <View style={{marginBottom: theme.spacing.lg}}>
                        <ExternalVideoPlayer
                            mediaSourceType={MediaSourceType.YOUTUBE}
                            videoId={youtubeVideoId}
                            height={200}
                        />
                    </View>
                )}

                {/* ── Uploaded/external media (non-YouTube) ── */}
                {showMedia && mediaType && !youtubeVideoId && (
                    <View style={styles.mediaContainer}>
                        <View style={styles.mediaHeader}>
                            <MaterialCommunityIcons
                                name={
                                    mediaType === 'AUDIO'
                                        ? 'music'
                                        : mediaType === 'VIDEO'
                                        ? 'video'
                                        : 'image'
                                }
                                size={16}
                                color={theme.colors.text.secondary}
                            />
                        </View>
                        <QuestionMediaViewer
                            questionId={question.id}
                            mediaType={mediaType}
                        />
                    </View>
                )}

                {/* ── Voice recorder ───────────────────────── */}
                {isVoiceEnabled && (
                    <View style={{marginBottom: theme.spacing.lg}}>
                        <VoiceRecorderV2
                            onTranscription={handleVoiceTranscription}
                            isActive={true}
                        />
                        {voiceTranscription ? (
                            <View style={styles.transcriptionContainer}>
                                <Text style={styles.transcriptionLabel}>
                                    {t('wwwPhases.discussion.latestTranscription')}
                                </Text>
                                <Text style={styles.transcriptionText}>
                                    {voiceTranscription}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                )}

                {/* ── Discussion notes ─────────────────────── */}
                <View style={{marginBottom: theme.spacing.lg}}>
                    <Text style={styles.label}>
                        {t('wwwPhases.discussion.discussionNotes')}
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={notes}
                        onChangeText={onNotesChange}
                        placeholder={t('wwwPhases.discussion.notesPlaceholder')}
                        multiline
                        textAlignVertical="top"
                        placeholderTextColor={theme.colors.text.disabled}
                    />
                </View>

                {/* ── Proceed to Answer button ─────────────── */}
                <TouchableOpacity
                    style={styles.button}
                    onPress={onSubmitEarly}
                    activeOpacity={0.7}
                >
                    <Text style={styles.buttonText}>
                        {t('wwwPhases.discussion.proceedToAnswer')}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};
