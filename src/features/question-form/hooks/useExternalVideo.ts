// questApp/src/features/question-form/hooks/useExternalVideo.ts
import { useState, useMemo } from 'react';
import { MediaSourceType } from "../../../entities/QuizState/model/types/question.types";
import { isValidYouTubeUrl, extractYouTubeVideoId } from "../../../utils/youtubeUtils";

export function useExternalVideo() {
    const [mediaSourceType, setMediaSourceType] = useState<MediaSourceType>(MediaSourceType.UPLOADED);
    const [externalUrl, setExternalUrl] = useState('');
    const [qStartTime, setQStartTime] = useState(0);
    const [qEndTime, setQEndTime] = useState<number | undefined>(undefined);
    
    const [answerMediaType, setAnswerMediaType] = useState<'SAME' | 'DIFFERENT' | 'TEXT'>('TEXT');
    const [answerUrl, setAnswerUrl] = useState('');
    const [aStartTime, setAStartTime] = useState(0);
    const [aEndTime, setAEndTime] = useState<number | undefined>(undefined);
    const [answerTextVerification, setAnswerTextVerification] = useState('');

    const youtubeVideoId = useMemo(() => extractYouTubeVideoId(externalUrl), [externalUrl]);
    const isYouTube = useMemo(() => isValidYouTubeUrl(externalUrl), [externalUrl]);

    return {
        videoState: {
            mediaSourceType,
            externalUrl,
            qStartTime,
            qEndTime,
            answerMediaType,
            answerUrl,
            aStartTime,
            aEndTime,
            answerTextVerification,
            youtubeVideoId,
            isYouTube,
        },
        videoHandlers: {
            setMediaSourceType,
            setExternalUrl,
            setQStartTime,
            setQEndTime,
            setAnswerMediaType,
            setAnswerUrl,
            setAStartTime,
            setAEndTime,
            setAnswerTextVerification,
        }
    };
}
