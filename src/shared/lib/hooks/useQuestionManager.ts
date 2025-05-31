// src/shared/lib/hooks/useQuestionManager.ts
import {useCallback, useEffect, useState} from 'react'
import {QuestionData, QuestionService} from '../../services/wwwGame/questionService'

type QuestionSource = 'app' | 'user'
type Difficulty = 'Easy' | 'Medium' | 'Hard'

interface UseQuestionManagerOptions {
    source: QuestionSource
    difficulty: Difficulty
    count: number
}

export const useQuestionManager = ({
                                       source,
                                       difficulty,
                                       count
                                   }: UseQuestionManagerOptions) => {
    const [questions, setQuestions] = useState<QuestionData[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadQuestions = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            let loadedQuestions: QuestionData[]

            if (source === 'user') {
                const userQuestions = await QuestionService.getUserQuestions()
                loadedQuestions = userQuestions.slice(0, count)
            } else {
                loadedQuestions = await QuestionService.getQuestionsByDifficulty(difficulty, count)
            }

            setQuestions(loadedQuestions)
            setCurrentQuestionIndex(0)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load questions')
            setQuestions([])
        } finally {
            setIsLoading(false)
        }
    }, [source, difficulty, count])

    useEffect(() => {
        loadQuestions()
    }, [loadQuestions])

    const getCurrentQuestion = useCallback(() => {
        return questions[currentQuestionIndex] || null
    }, [questions, currentQuestionIndex])

    const nextQuestion = useCallback(() => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
            return true
        }
        return false
    }, [currentQuestionIndex, questions.length])

    const previousQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1)
            return true
        }
        return false
    }, [currentQuestionIndex])

    const goToQuestion = useCallback((index: number) => {
        if (index >= 0 && index < questions.length) {
            setCurrentQuestionIndex(index)
            return true
        }
        return false
    }, [questions.length])

    return {
        questions,
        currentQuestion: getCurrentQuestion(),
        currentQuestionIndex,
        isLoading,
        error,
        hasNext: currentQuestionIndex < questions.length - 1,
        hasPrevious: currentQuestionIndex > 0,
        loadQuestions,
        nextQuestion,
        previousQuestion,
        goToQuestion
    }
}
