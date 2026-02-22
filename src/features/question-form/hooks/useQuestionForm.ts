// questApp/src/features/question-form/hooks/useQuestionForm.ts
import { useState, useCallback } from 'react';
import { 
    LocalizedString, 
    EMPTY_LOCALIZED_STRING, 
    createLocalizedString 
} from "../../../shared/types/localized";
import { QuestionVisibility } from "../../../entities/QuizState/model/types/question.types";
import { SelectableTopic } from "../../../entities/TopicState";
import { UserQuestion } from "../../../services/wwwGame/questionService";
import { QuestionType, DifficultyLevel } from "../model/types";

interface UseQuestionFormOptions {
    existingQuestion?: UserQuestion;
    isEditing: boolean;
}

export function useQuestionForm({ existingQuestion, isEditing }: UseQuestionFormOptions) {
    const [questionText, setQuestionText] = useState<LocalizedString>(
        existingQuestion?.questionLocalized || (existingQuestion?.question ? createLocalizedString(existingQuestion.question, 'en') : EMPTY_LOCALIZED_STRING)
    );
    const [answer, setAnswer] = useState<LocalizedString>(
        existingQuestion?.answerLocalized || (existingQuestion?.answer ? createLocalizedString(existingQuestion.answer, 'en') : EMPTY_LOCALIZED_STRING)
    );
    const [difficulty, setDifficulty] = useState<DifficultyLevel>(
        (existingQuestion?.difficulty as DifficultyLevel) || 'MEDIUM'
    );
    const [topic, setTopic] = useState(existingQuestion?.topic || '');
    const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>(undefined);
    const [additionalInfo, setAdditionalInfo] = useState<LocalizedString>(
        existingQuestion?.additionalInfoLocalized || (existingQuestion?.additionalInfo ? createLocalizedString(existingQuestion.additionalInfo, 'en') : EMPTY_LOCALIZED_STRING)
    );
    const [questionType, setQuestionType] = useState<QuestionType>('TEXT');
    const [visibility, setVisibility] = useState<QuestionVisibility>(
        (existingQuestion?.visibility as QuestionVisibility) || QuestionVisibility.PRIVATE
    );

    const handleSelectTopic = useCallback((selectedTopic: SelectableTopic | null) => {
        if (selectedTopic) {
            setTopic(selectedTopic.name);
            setSelectedTopicId(selectedTopic.id);
        } else {
            setTopic('');
            setSelectedTopicId(undefined);
        }
    }, []);

    return {
        formState: {
            questionText,
            answer,
            difficulty,
            topic,
            selectedTopicId,
            additionalInfo,
            questionType,
            visibility,
        },
        formHandlers: {
            setQuestionText,
            setAnswer,
            setDifficulty,
            setTopic,
            setSelectedTopicId,
            setAdditionalInfo,
            setQuestionType,
            setVisibility,
            handleSelectTopic,
        }
    };
}
