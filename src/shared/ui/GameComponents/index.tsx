// src/shared/ui/GameComponents/index.ts
export { GameHeader } from './GameHeader/GameHeader'
export { GameTimer } from './GameTimer/GameTimer'
export { GameScore } from './GameScore/GameScore'
export { GamePhaseContainer } from './GamePhaseContainer/GamePhaseContainer'
export { GameQuestion } from './GameQuestion/GameQuestion'
export { GameResult } from './GameResult/GameResult'
export { GameModal } from './GameModal/GameModal'
export { VoiceRecorder } from './VoiceRecorder/VoiceRecorder'

// src/shared/ui/GameComponents/GameHeader/GameHeader.tsx
// src/shared/ui/GameComponents/GameTimer/GameTimer.tsx
// src/shared/ui/GameComponents/GameQuestion/GameQuestion.tsx
// src/shared/ui/GameComponents/GamePhaseContainer/GamePhaseContainer.tsx
// src/shared/ui/GameComponents/GameResult/GameResult.tsx
// src/shared/ui/GameComponents/GameModal/GameModal.tsx
// src/shared/ui/FormComponents/GameSettingsForm/GameSettingsForm.tsx
import React, {useEffect, useRef} from 'react'
import {Animated, Modal, StyleSheet, Text, TouchableOpacity, View, ViewStyle} from 'react-native'
import {ProgressBar} from '../../ProgressBar/ProgressBar'
import {theme} from '../../../styles/theme'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import {Badge} from '../../Badge/Badge'
import {Button} from '../../Button/Button'
import {Difficulty, DifficultySelector} from '../../DifficultySelector/DifficultySelector'
import {Toggle} from '../../Toggle/Toggle'

interface GameHeaderProps {
    teamName: string
    score: number
    totalRounds: number
    currentRound: number
    gameStartTime?: Date
    showProgress?: boolean
}

export const GameHeader: React.FC<GameHeaderProps> = ({
                                                          teamName,
                                                          score,
                                                          totalRounds,
                                                          currentRound,
                                                          gameStartTime,
                                                          showProgress = true
                                                      }) => {
    return (
        <View style={styles.header}>
        <View style={styles.headerTop}>
        <Text style={styles.teamName}>{teamName}</Text>
            <Text style={styles.scoreText}>Score: {score}/{totalRounds}</Text>
    </View>

    {showProgress && (
        <ProgressBar
            progress={currentRound / totalRounds}
        height={6}
        color="white"
        backgroundColor="rgba(255, 255, 255, 0.3)"
            />
    )}

    {gameStartTime && (
        <Text style={styles.gameTimeText}>
            Started: {gameStartTime.toLocaleTimeString()}
        </Text>
    )}
    </View>
)
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.lg,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    teamName: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.inverse,
    },
    scoreText: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.inverse,
    },
    gameTimeText: {
        fontSize: theme.fontSize.xs,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: theme.spacing.xs,
        textAlign: 'center',
    },
})

interface GameTimerProps {
    timeRemaining: number
    totalTime: number
    isRunning: boolean
    onTimeUp?: () => void
    size?: 'sm' | 'md' | 'lg'
    showProgress?: boolean
}

export const GameTimer: React.FC<GameTimerProps> = ({
                                                        timeRemaining,
                                                        totalTime,
                                                        isRunning,
                                                        onTimeUp,
                                                        size = 'md',
                                                        showProgress = true
                                                    }) => {
    const animatedValue = useRef(new Animated.Value(1)).current
    const progress = totalTime > 0 ? timeRemaining / totalTime : 0

    useEffect(() => {
        if (timeRemaining === 0 && onTimeUp) {
            onTimeUp()
        }
    }, [timeRemaining, onTimeUp])

    useEffect(() => {
        if (isRunning) {
            Animated.timing(animatedValue, {
                toValue: progress,
                duration: 1000,
                useNativeDriver: false,
            }).start()
        }
    }, [progress, isRunning])

    const getTimerColor = (): string => {
        if (progress > 0.5) return theme.gameColors.timerSafe
        if (progress > 0.25) return theme.gameColors.timerWarning
        return theme.gameColors.timerDanger
    }

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
    }

    return (
        <View style={[styles.container, styles[size]]}>
    <Text style={[styles.timerText, styles[`${size}Text`], { color: getTimerColor() }]}>
    {formatTime(timeRemaining)}
    </Text>

    {showProgress && (
        <View style={[styles.timerBar, styles[`${size}Bar`]]}>
        <Animated.View
            style={[
                styles.timerProgress,
        {
            width: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
            }),
                backgroundColor: getTimerColor(),
        }
    ]}
        />
        </View>
    )}
    </View>
)
}

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.md,
    },
    sm: {
        marginBottom: theme.spacing.sm,
    },
    md: {
        marginBottom: theme.spacing.md,
    },
    lg: {
        marginBottom: theme.spacing.lg,
    },
    timerText: {
        fontWeight: theme.fontWeight.bold,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },
    smText: {
        fontSize: theme.fontSize.sm,
    },
    mdText: {
        fontSize: theme.fontSize.lg,
    },
    lgText: {
        fontSize: theme.fontSize.xl,
    },
    timerBar: {
        backgroundColor: theme.colors.borderLight,
        borderRadius: theme.borderRadius.sm,
        overflow: 'hidden',
        width: '100%',
    },
    smBar: {
        height: 4,
    },
    mdBar: {
        height: 8,
    },
    lgBar: {
        height: 12,
    },
    timerProgress: {
        height: '100%',
        borderRadius: theme.borderRadius.sm,
    },
})

interface GameQuestionProps {
    questionNumber: number
    totalQuestions: number
    question: string
    style?: ViewStyle
    showCounter?: boolean
}

export const GameQuestion: React.FC<GameQuestionProps> = ({
                                                              questionNumber,
                                                              totalQuestions,
                                                              question,
                                                              style,
                                                              showCounter = true
                                                          }) => {
    return (
        <View style={[styles.container, style]}>
    {showCounter && (
        <Text style={styles.questionNumber}>
            Question {questionNumber} of {totalQuestions}
        </Text>
    )}
    <Text style={styles.question}>{question}</Text>
        </View>
)
}

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.xl,
    },
    questionNumber: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.light,
        marginBottom: theme.spacing.sm,
    },
    question: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        lineHeight: 28,
    },
})

interface GamePhaseContainerProps {
    children: React.ReactNode
    style?: ViewStyle
}

export const GamePhaseContainer: React.FC<GamePhaseContainerProps> = ({
                                                                          children,
                                                                          style
                                                                      }) => {
    return (
        <View style={[styles.container, style]}>
    {children}
    </View>
)
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        margin: theme.spacing.lg,
        ...theme.shadow.medium,
    },
})

interface GameResultProps {
    teamAnswer: string
    correctAnswer: string
    isCorrect: boolean
    playerWhoAnswered: string
    showDetails?: boolean
}

export const GameResult: React.FC<GameResultProps> = ({
                                                          teamAnswer,
                                                          correctAnswer,
                                                          isCorrect,
                                                          playerWhoAnswered,
                                                          showDetails = true
                                                      }) => {
    return (
        <View style={styles.container}>
        <View style={styles.resultItem}>
        <Text style={styles.resultLabel}>Your Answer:</Text>
    <Text style={styles.resultValue}>{teamAnswer}</Text>
        </View>

        <View style={styles.resultItem}>
    <Text style={styles.resultLabel}>Correct Answer:</Text>
    <Text style={styles.resultValue}>{correctAnswer}</Text>
        </View>

        <View style={styles.resultItem}>
    <Text style={styles.resultLabel}>Result:</Text>
    <View style={styles.badgeContainer}>
    <MaterialCommunityIcons
        name={isCorrect ? "check-circle" : "close-circle"}
    size={16}
    color={isCorrect ? theme.colors.success : theme.colors.error}
    style={styles.badgeIcon}
    />
    <Badge
    text={isCorrect ? 'CORRECT' : 'INCORRECT'}
    variant={isCorrect ? 'success' : 'error'}
    />
    </View>
    </View>

    {showDetails && (
        <View style={styles.resultItem}>
        <Text style={styles.resultLabel}>Answered By:</Text>
    <Text style={styles.resultValue}>{playerWhoAnswered}</Text>
        </View>
    )}
    </View>
)
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.background,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.lg,
    },
    resultItem: {
        marginBottom: theme.spacing.md,
    },
    resultLabel: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.light,
        marginBottom: theme.spacing.xs,
    },
    resultValue: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.primary,
        fontWeight: theme.fontWeight.medium,
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badgeIcon: {
        marginRight: theme.spacing.sm,
    },
})

interface GameModalProps {
    visible: boolean
    onClose: () => void
    title: string
    message: string
    score?: number
    totalRounds?: number
    icon?: string
    iconColor?: string
    actions?: Array<{
        text: string
        onPress: () => void
        variant?: 'primary' | 'secondary'
    }>
}

export const GameModal: React.FC<GameModalProps> = ({
                                                        visible,
                                                        onClose,
                                                        title,
                                                        message,
                                                        score,
                                                        totalRounds,
                                                        icon = 'trophy',
                                                        iconColor = '#FFD700',
                                                        actions = []
                                                    }) => {
    const getScoreMessage = () => {
        if (score === undefined || totalRounds === undefined) return ''

        if (score === totalRounds) return 'Perfect score! Incredible!'
        if (score > totalRounds / 2) return 'Well done!'
        return 'Better luck next time!'
    }

    return (
        <Modal
            visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
    >
    <View style={styles.overlay}>
    <View style={styles.content}>
    <MaterialCommunityIcons
        name={icon}
    size={48}
    color={iconColor}
    />

    <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

    {score !== undefined && totalRounds !== undefined && (
        <Text style={styles.scoreMessage}>
            {getScoreMessage()}
            </Text>
    )}

    <View style={styles.actionsContainer}>
        {actions.map((action, index) => (
                <Button
                    key={index}
            variant={action.variant || 'primary'}
            onPress={action.onPress}
            style={styles.actionButton}
            >
            {action.text}
            </Button>
))}
    </View>
    </View>
    </View>
    </Modal>
)
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.xl,
        width: '80%',
        alignItems: 'center',
        ...theme.shadow.large,
    },
    title: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        textAlign: 'center',
    },
    message: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    scoreMessage: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.primary,
        marginBottom: theme.spacing.xl,
        textAlign: 'center',
    },
    actionsContainer: {
        width: '100%',
    },
    actionButton: {
        marginBottom: theme.spacing.sm,
    },
})

// src/shared/ui/FormComponents/index.ts
export { GameSettingsForm } from './GameSettingsForm/GameSettingsForm'
export { TeamSetupForm } from './TeamSetupForm/TeamSetupForm'
export { QuestionSourceForm } from './QuestionSourceForm/QuestionSourceForm'

interface GameSettings {
    difficulty: Difficulty
    roundTime: number
    roundCount: number
    enableAIHost: boolean
}

interface GameSettingsFormProps {
    settings: GameSettings
    onSettingsChange: (settings: GameSettings) => void
    disabled?: boolean
}

export const GameSettingsForm: React.FC<GameSettingsFormProps> = ({
                                                                      settings,
                                                                      onSettingsChange,
                                                                      disabled = false
                                                                  }) => {
    const timeOptions = [30, 60, 90, 120]
    const countOptions = [5, 10, 15]

    const updateSettings = (updates: Partial<GameSettings>) => {
        onSettingsChange({ ...settings, ...updates })
    }

    return (
        <View style={styles.container}>
        <Text style={styles.title}>Game Settings</Text>

    <View style={styles.setting}>
    <Text style={styles.label}>Difficulty</Text>
        <DifficultySelector
    value={settings.difficulty}
    onValueChange={(difficulty) => updateSettings({ difficulty })}
    disabled={disabled}
    />
    </View>

    <View style={styles.setting}>
    <Text style={styles.label}>Discussion Time (seconds)</Text>
    <View style={styles.optionsRow}>
        {timeOptions.map((time) => (
                <TouchableOpacity
                    key={time}
            style={[
                    styles.optionButton,
                settings.roundTime === time && styles.selectedOption,
                disabled && styles.disabled
]}
    onPress={() => !disabled && updateSettings({ roundTime: time })}
    disabled={disabled}
    >
    <Text
        style={[
            styles.optionText,
        settings.roundTime === time && styles.selectedOptionText
]}
>
    {time}
    </Text>
    </TouchableOpacity>
))}
    </View>
    </View>

    <View style={styles.setting}>
    <Text style={styles.label}>Number of Questions</Text>
    <View style={styles.optionsRow}>
        {countOptions.map((count) => (
                <TouchableOpacity
                    key={count}
            style={[
                    styles.optionButton,
                settings.roundCount === count && styles.selectedOption,
                disabled && styles.disabled
]}
    onPress={() => !disabled && updateSettings({ roundCount: count })}
    disabled={disabled}
    >
    <Text
        style={[
            styles.optionText,
        settings.roundCount === count && styles.selectedOptionText
]}
>
    {count}
    </Text>
    </TouchableOpacity>
))}
    </View>
    </View>

    <View style={styles.setting}>
    <Toggle
        value={settings.enableAIHost}
    onValueChange={(enableAIHost) => updateSettings({ enableAIHost })}
    label="Enable AI Host"
    disabled={disabled}
    />
    <Text style={styles.description}>
        {settings.enableAIHost
                ? "AI Host will analyze team discussions and provide feedback"
                : "AI Host features will be disabled"}
        </Text>
        </View>
        </View>
)
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        ...theme.shadow.small,
    },
    title: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
    },
    setting: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    optionsRow: {
        flexDirection: 'row',
    },
    optionButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginRight: theme.spacing.sm,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    selectedOption: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    optionText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    selectedOptionText: {
        color: theme.colors.text.inverse,
        fontWeight: theme.fontWeight.bold,
    },
    description: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.light,
        fontStyle: 'italic',
        marginTop: theme.spacing.sm,
    },
    disabled: {
        opacity: 0.5,
    },
})

// src/shared/ui/index.ts - Updated exports
export { Button } from './Button/Button'
export { Input } from './Input/Input'
export { Card } from './Card/Card'
export { Badge } from './Badge/Badge'
export { Modal } from './Modal/Modal'
export { LoadingState } from './LoadingState/LoadingState'
export { ErrorState } from './ErrorState/ErrorState'
export { ProgressBar } from './ProgressBar/ProgressBar'
export { Toggle } from './Toggle/Toggle'
export { TeamMemberList } from './TeamMemberList/TeamMemberList'
export { DifficultySelector } from './DifficultySelector/DifficultySelector'
export { Timer } from './Timer/Timer'
export { PlayerSelector } from './PlayerSelector/PlayerSelector'
export { SourceSelector } from './SourceSelector/SourceSelector'

// Game Components
export * from './GameComponents'
export * from './FormComponents'