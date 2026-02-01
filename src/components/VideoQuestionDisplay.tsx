import React, {useState, useRef, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView} from 'react-native';
import {QuizQuestion} from '../entities/QuizState/model/slice/quizApi';
import {MediaSourceType} from '../entities/QuizState/model/types/question.types';
import ExternalVideoPlayer from './ExternalVideoPlayer';
import {extractYouTubeVideoId} from '../utils/youtubeUtils';

interface VideoQuestionDisplayProps {
    question: QuizQuestion;
    showAnswer: boolean;
    onRevealAnswer?: () => void;
}

const VideoQuestionDisplay: React.FC<VideoQuestionDisplayProps> = ({
    question,
    showAnswer,
    onRevealAnswer,
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [showingAnswerVideo, setShowingAnswerVideo] = useState(false);

    // Determine question media source
    const mediaSourceType = question.mediaSourceType || MediaSourceType.UPLOADED;
    
    // For YouTube, we need video ID
    const questionVideoId = mediaSourceType === MediaSourceType.YOUTUBE
        ? (question.externalMediaId || extractYouTubeVideoId(question.externalMediaUrl || ''))
        : undefined;

    // For answer media (if different)
    const hasAnswerMedia = !!question.answerMediaUrl;
    const answerMediaSourceType = mediaSourceType; // Assume same type for now unless logic suggests otherwise
    
    const answerVideoId = mediaSourceType === MediaSourceType.YOUTUBE && question.answerMediaUrl
        ? extractYouTubeVideoId(question.answerMediaUrl)
        : undefined;

    // Determine current video props based on state
    const currentVideoId = showingAnswerVideo && hasAnswerMedia ? (answerVideoId || questionVideoId) : questionVideoId;
    const currentVideoUrl = showingAnswerVideo && hasAnswerMedia ? (question.answerMediaUrl || question.externalMediaUrl || question.questionMediaUrl) : (question.externalMediaUrl || question.questionMediaUrl);
    
    const currentStartTime = showingAnswerVideo 
        ? (question.answerVideoStartTime || 0) 
        : (question.questionVideoStartTime || 0);
        
    const currentEndTime = showingAnswerVideo
        ? question.answerVideoEndTime
        : question.questionVideoEndTime;

    // Auto-play answer when revealed if it has video
    useEffect(() => {
        if (showAnswer && (hasAnswerMedia || (question.answerVideoStartTime !== undefined))) {
            setShowingAnswerVideo(true);
            setIsPlaying(true);
        }
    }, [showAnswer, hasAnswerMedia, question.answerVideoStartTime]);

    const handleSegmentEnd = () => {
        setIsPlaying(false);
    };

    return (
        <View style={styles.container}>
            <ExternalVideoPlayer
                mediaSourceType={mediaSourceType}
                videoId={currentVideoId || undefined}
                videoUrl={currentVideoUrl || undefined}
                startTime={currentStartTime}
                endTime={currentEndTime}
                shouldPlay={isPlaying}
                autoPlay={false} // Managed by isPlaying
                onSegmentEnd={handleSegmentEnd}
                showControls={false}
                hideTitle={true}
                style={styles.videoPlayer}
            />

            <View style={styles.controls}>
                {!isPlaying && (
                    <TouchableOpacity
                        style={styles.playButton}
                        onPress={() => setIsPlaying(true)}
                    >
                        <Text style={styles.playButtonText}>
                            {showingAnswerVideo ? 'Replay Answer' : 'Replay Question'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {showAnswer && (
                <View style={styles.answerContainer}>
                    <Text style={styles.answerTitle}>Answer:</Text>
                    <Text style={styles.answerText}>{question.answer}</Text>
                    
                    {question.answerTextVerification && (
                        <View style={styles.verificationContainer}>
                            <Text style={styles.verificationLabel}>Explanation:</Text>
                            <Text style={styles.verificationText}>{question.answerTextVerification}</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    videoPlayer: {
        height: 220,
        backgroundColor: '#000',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    playButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
    },
    playButtonText: {
        color: '#333',
        fontWeight: '600',
    },
    answerContainer: {
        padding: 16,
        backgroundColor: '#e8f5e9',
    },
    answerTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 4,
    },
    answerText: {
        fontSize: 18,
        color: '#333',
        marginBottom: 12,
    },
    verificationContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    verificationLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: 2,
    },
    verificationText: {
        fontSize: 14,
        color: '#444',
        fontStyle: 'italic',
    },
});

export default VideoQuestionDisplay;
