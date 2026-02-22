// questApp/src/features/question-form/ui/ExternalVideoSection.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import ExternalVideoPlayer from '../../../components/ExternalVideoPlayer';
import TimeRangeInput from '../../../components/TimeRangeInput';
import { MediaSourceType } from '../../../entities/QuizState/model/types/question.types';
import { isValidYouTubeUrl, extractYouTubeVideoId } from '../../../utils/youtubeUtils';

interface ExternalVideoSectionProps {
    externalUrl: string;
    setExternalUrl: (url: string) => void;
    qStartTime: number;
    setQStartTime: (time: number) => void;
    qEndTime?: number;
    setQEndTime: (time: number | undefined) => void;
    answerMediaType: 'SAME' | 'DIFFERENT' | 'TEXT';
    setAnswerMediaType: (type: 'SAME' | 'DIFFERENT' | 'TEXT') => void;
    answerUrl: string;
    setAnswerUrl: (url: string) => void;
    aStartTime: number;
    setAStartTime: (time: number) => void;
    aEndTime?: number;
    setAEndTime: (time: number | undefined) => void;
    answerTextVerification: string;
    setAnswerTextVerification: (text: string) => void;
}

export const ExternalVideoSection: React.FC<ExternalVideoSectionProps> = ({
    externalUrl,
    setExternalUrl,
    qStartTime,
    setQStartTime,
    qEndTime,
    setQEndTime,
    answerMediaType,
    setAnswerMediaType,
    answerUrl,
    setAnswerUrl,
    aStartTime,
    setAStartTime,
    aEndTime,
    setAEndTime,
    answerTextVerification,
    setAnswerTextVerification
}) => {
    const { t } = useTranslation();

    return (
        <View>
            <Text style={[styles.label, {fontSize: 14}]}>Video URL (YouTube/Vimeo)</Text>
            <TextInput
                style={styles.input}
                value={externalUrl}
                onChangeText={setExternalUrl}
                placeholder={t('questionEditor.pasteLinkPlaceholder')}
                placeholderTextColor="#999"
                autoCapitalize="none"
            />
            
            {externalUrl && (
                <View style={{marginTop: 12}}>
                    <ExternalVideoPlayer
                        mediaSourceType={isValidYouTubeUrl(externalUrl) ? MediaSourceType.YOUTUBE : MediaSourceType.EXTERNAL_URL}
                        videoUrl={externalUrl}
                        videoId={extractYouTubeVideoId(externalUrl) || undefined}
                        startTime={qStartTime}
                        endTime={qEndTime}
                        height={200}
                    />
                    
                    <Text style={[styles.label, {marginTop: 12, fontSize: 14}]}>{t('questionEditor.playbackRange')}</Text>
                    <TimeRangeInput
                        startTime={qStartTime}
                        endTime={qEndTime}
                        onStartTimeChange={setQStartTime}
                        onEndTimeChange={setQEndTime}
                    />
                </View>
            )}

            {/* Answer Configuration */}
            <View style={{marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee'}}>
                <Text style={styles.label}>Answer Verification</Text>
                
                <Text style={[styles.label, {fontSize: 14}]}>Answer Video</Text>
                <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12}}>
                    {['TEXT', 'SAME', 'DIFFERENT'].map((type) => (
                        <View key={type} style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 16,
                            backgroundColor: answerMediaType === type ? '#4CAF50' : '#f0f0f0',
                        }}>
                            <Text 
                                style={{color: answerMediaType === type ? '#fff' : '#666', fontSize: 12}}
                                onPress={() => setAnswerMediaType(type as any)}
                            >
                                {type === 'TEXT' ? 'Text Only' : type === 'SAME' ? 'Same Video' : 'Diff Video'}
                            </Text>
                        </View>
                    ))}
                </View>

                {answerMediaType === 'SAME' && (
                    <View>
                        <Text style={[styles.label, {fontSize: 14}]}>Answer Segment</Text>
                        <TimeRangeInput
                            startTime={aStartTime}
                            endTime={aEndTime}
                            onStartTimeChange={setAStartTime}
                            onEndTimeChange={setAEndTime}
                        />
                    </View>
                )}

                {answerMediaType === 'DIFFERENT' && (
                    <View>
                        <TextInput
                            style={[styles.input, {marginBottom: 8}]}
                            value={answerUrl}
                            onChangeText={setAnswerUrl}
                            placeholder="Answer Video URL..."
                        />
                        <TimeRangeInput
                            startTime={aStartTime}
                            endTime={aEndTime}
                            onStartTimeChange={setAStartTime}
                            onEndTimeChange={setAEndTime}
                        />
                    </View>
                )}

                <Text style={[styles.label, {fontSize: 14, marginTop: 12}]}>Text Verification (Optional)</Text>
                <TextInput
                    style={[styles.input, {minHeight: 60}]}
                    value={answerTextVerification}
                    onChangeText={setAnswerTextVerification}
                    placeholder="Explanation shown after answering..."
                    multiline
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#fff',
    },
});
