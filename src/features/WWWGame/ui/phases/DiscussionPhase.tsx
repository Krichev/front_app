import React, {useState, useRef} from 'react';
import {Animated, Text, TextInput, TouchableOpacity, View} from 'react-native';
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

interface DiscussionPhaseProps {
    question: QuizQuestion;
    timeLeft: number;
    animation?: Animated.Value;
    notes?: string;
    onNotesChange?: (text: string) => void;
    onSubmitEarly?: () => void;
    isVoiceEnabled?: boolean;
}

export const DiscussionPhase: React.FC<DiscussionPhaseProps> = ({
                                                                    question,
                                                                    timeLeft,
                                                                    animation,
                                                                    notes = '',
                                                                    onNotesChange = () => {},
                                                                    onSubmitEarly = () => {},
                                                                    isVoiceEnabled = false,
                                                                }) => {
    const {t} = useTranslation();
    const {theme} = useAppStyles();
    const styles = phaseStyles(theme);
    
    // Internal animation if not provided
    const internalAnim = useRef(new Animated.Value(0)).current;
    const activeAnim = animation || internalAnim;

    const isAudioChallenge = question.questionType === 'AUDIO' && !!question.audioChallengeType;

    // Helper to determine media type
    const getMediaType = (q: QuizQuestion): MediaType | null => {
        const mediaType = q.questionMediaType?.toUpperCase();
        if (mediaType && ['IMAGE', 'VIDEO', 'AUDIO'].includes(mediaType)) {
            return mediaType as MediaType;
        }
        // Fallback to questionType for external media where questionMediaType may be null
        const qType = q.questionType?.toUpperCase();
        if (qType && ['IMAGE', 'VIDEO', 'AUDIO'].includes(qType)) {
            return qType as MediaType;
        }
        return null;
    };

    const mediaType = getMediaType(question);
    const hasUploadedMedia = !!question.questionMediaId;
    const hasExternalMedia = !!question.mediaSourceType
        && question.mediaSourceType !== MediaSourceType.UPLOADED
        && (!!question.externalMediaUrl || !!question.externalMediaId);
    const showMedia = !!mediaType && !isAudioChallenge && (hasUploadedMedia || hasExternalMedia);

    const videoId = (hasExternalMedia && mediaType === 'VIDEO')
        ? (question.externalMediaId || extractYouTubeVideoId(question.externalMediaUrl || '') || undefined)
        : undefined;

    return (
        <View style={styles.container}>
            <View style={styles.timerContainer}>
                <Text style={styles.timerText}>{t('wwwPhases.discussion.timeRemaining', {seconds: timeLeft})}</Text>
                <View style={styles.timerBar}>
                    <Animated.View
                        style={[
                            styles.timerProgress,
                            {
                                width: activeAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%'],
                                }),
                            },
                        ]}
                    />
                </View>
            </View>

            <Text style={styles.title}>{t('wwwPhases.discussion.title')}</Text>

            {isAudioChallenge ? (
                <AudioChallengeContainer
                    question={question}
                    mode="preview"
                />
            ) : (
                <View style={styles.questionContent}>
                    {showMedia && mediaType && (
                        <View style={(hasExternalMedia && mediaType === 'VIDEO') ? styles.mediaContainerFlexible : styles.mediaContainer}>
                            <View style={styles.mediaHeader}>
                                <MaterialCommunityIcons
                                    name={mediaType === 'AUDIO' ? 'music' : mediaType === 'VIDEO' ? 'video' : 'image'}
                                    size={16}
                                    color={theme.colors.text.secondary}
                                />
                                <Text style={{
                                    ...theme.typography.body.small,
                                    color: theme.colors.text.secondary,
                                    fontWeight: theme.typography.fontWeight.medium
                                }}>
                                    {mediaType === 'AUDIO' ? t('wwwPhases.discussion.listenAudio') :
                                        mediaType === 'VIDEO' ? t('wwwPhases.discussion.watchVideo') : t('wwwPhases.discussion.viewImage')}
                                </Text>
                            </View>
                            {hasExternalMedia && mediaType === 'VIDEO' ? (
                                <View style={{width: '100%', borderRadius: 8, overflow: 'hidden'}}>
                                    {__DEV__ && (console.log('🎬 [DiscussionPhase] Rendering ExternalVideoPlayer:', {
                                        questionId: question.id,
                                        mediaSourceType: question.mediaSourceType,
                                        videoId,
                                        externalMediaUrl: question.externalMediaUrl?.substring(0, 60),
                                        showControls: true,
                                        onlyPlayButton: false,
                                    }), null)}
                                    <ExternalVideoPlayer
                                        mediaSourceType={question.mediaSourceType as MediaSourceType}
                                        videoId={videoId}
                                        videoUrl={question.externalMediaUrl}
                                        startTime={question.questionVideoStartTime || 0}
                                        endTime={question.questionVideoEndTime}
                                        autoPlay={false}
                                        showControls={true}
                                        hideTitle={true}
                                        enableFullscreen={true}
                                        initialFullscreen={false}
                                    />
                                </View>
                            ) : (
                                <QuestionMediaViewer
                                    questionId={Number(question.id)}
                                    mediaType={mediaType as MediaType}
                                    height={mediaType === 'AUDIO' ? 80 : 200}
                                    enableFullscreen={mediaType !== 'AUDIO'}
                                />
                            )}
                        </View>
                    )}
                    <Text style={styles.text}>{question.question}</Text>
                </View>
            )}

            <View style={{marginBottom: theme.spacing.lg}}>
                <Text style={styles.label}>{t('wwwPhases.discussion.discussionNotes')}</Text>
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

            <TouchableOpacity
                style={styles.button}
                onPress={onSubmitEarly}
            >
                <Text style={styles.buttonText}>{t('wwwPhases.discussion.submitAnswer')}</Text>
            </TouchableOpacity>
        </View>
    );
};