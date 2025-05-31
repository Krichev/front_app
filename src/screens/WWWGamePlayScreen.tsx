// src/screens/WWWGamePlayScreen.tsx - Refactored version
// src/screens/WWWGameSetupScreen.tsx - Refactored version
// src/screens/CreateWWWQuestScreen.tsx - Refactored version
import React, {useEffect, useState} from 'react'
import {Alert, SafeAreaView, ScrollView, StyleSheet} from 'react-native'
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native'
import {NativeStackNavigationProp} from '@react-navigation/native-stack'

// Shared UI Components
// Shared UI Components
// Shared UI Components
import {
    Button,
    Card,
    ErrorState,
    GameHeader,
    GameModal,
    GamePhaseContainer,
    GameQuestion,
    GameResult,
    GameTimer,
    Input,
    LoadingState,
    PlayerSelector,
    SourceSelector,
    TeamMemberList
} from '../shared/ui'

// Game hooks and utilities
import {useGameSession} from '../features/game/lib/hooks/useGameSession'
import {useVoiceRecording} from '../shared/lib/hooks/useVoiceRecording'

// Navigation types
// Navigation types
// Navigation types
import {RootStackParamList} from '../navigation/AppNavigator'

// Form Components
// Form Components
import {GameSettingsForm} from '../shared/ui/FormComponents'

// Game hooks and services
// Game hooks
import {usePlayerManager} from '../shared/lib/hooks/usePlayerManager'
import {useQuestionManager} from '../shared/lib/hooks/useQuestionManager'

// Redux hooks
import {useCreateChallengeMutation} from '../entities/ChallengeState/model/slice/challengeApi'
import {useSelector} from 'react-redux'
import {RootState} from '../app/providers/StoreProvider/store'
import {navigateToTab} from '../utils/navigation'

type WWWGamePlayNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WWWGamePlay'>
type WWWGamePlayRouteProp = RouteProp<RootStackParamList, 'WWWGamePlay'>

const WWWGamePlayScreen: React.FC = () => {
    const route = useRoute<WWWGamePlayRouteProp>()
    const navigation = useNavigation<WWWGamePlayNavigationProp>()

    // Extract game settings from route params
    const gameSettings = route.params

    // Initialize game session with hooks
    const gameSession = useGameSession(gameSettings)

    // Local state for UI
    const [teamAnswer, setTeamAnswer] = useState('')
    const [discussionNotes, setDiscussionNotes] = useState('')
    const [showEndGameModal, setShowEndGameModal] = useState(false)

    // Voice recording (optional feature)
    const voiceRecording = useVoiceRecording({
        onTranscription: (text) => {
            if (gameSession.gamePhase === 'discussion') {
                setDiscussionNotes(prev => prev ? `${prev}\n${text}` : text)
            } else if (gameSession.gamePhase === 'answer') {
                setTeamAnswer(text)
            }
        },
        onError: (error) => {
            console.warn('Voice recording error:', error)
        }
    })

    // Handle game completion
    useEffect(() => {
        if (gameSession.isGameComplete) {
            setShowEndGameModal(true)
        }
    }, [gameSession.isGameComplete])

    // Handle loading and error states
    if (gameSession.isLoading) {
        return <LoadingState text="Loading game questions..." />
    }

    if (gameSession.error) {
        return (
            <ErrorState
                message={gameSession.error}
                onRetry={gameSession.loadQuestions}
            />
        )
    }

    if (!gameSession.currentQuestion) {
        return (
            <ErrorState
                message="No questions available for this game"
                onRetry={() => navigation.goBack()}
                retryText="Go Back"
            />
        )
    }

    // Game flow handlers
    const handleSubmitAnswer = () => {
        if (!teamAnswer.trim()) {
            Alert.alert('Error', 'Please enter an answer')
            return
        }

        if (!gameSession.selectedPlayer) {
            Alert.alert('Error', 'Please select a player')
            return
        }

        const success = gameSession.submitAnswer(teamAnswer, discussionNotes)
        if (success) {
            setTeamAnswer('')
            setDiscussionNotes('')
        }
    }

    const handleNextRound = () => {
        gameSession.nextRound()
        setTeamAnswer('')
        setDiscussionNotes('')
    }

    const handleEndGame = () => {
        setShowEndGameModal(false)
        navigation.navigate('WWWGameResults', {
            teamName: gameSession.settings.teamName,
            score: gameSession.score,
            totalRounds: gameSession.settings.roundCount,
            roundsData: gameSession.roundsData,
            challengeId: gameSettings.challengeId,
            sessionId: gameSettings.sessionId
        })
    }

    // Render game phase content
    const renderPhaseContent = () => {
        const currentQuestion = gameSession.currentQuestion!

        switch (gameSession.gamePhase) {
            case 'waiting':
                return (
                    <GamePhaseContainer>
                        <Button
                            icon="play-circle"
                            onPress={gameSession.startGame}
                            fullWidth
                        >
                            Start Game
                        </Button>
                    </GamePhaseContainer>
                )

            case 'question':
                return (
                    <GamePhaseContainer>
                        <GameQuestion
                            questionNumber={gameSession.currentRound + 1}
                            totalQuestions={gameSession.settings.roundCount}
                            question={currentQuestion.question}
                        />

                        <Button
                            icon="account-group"
                            onPress={gameSession.startDiscussion}
                            fullWidth
                        >
                            Start Discussion
                        </Button>
                    </GamePhaseContainer>
                )

            case 'discussion':
                return (
                    <GamePhaseContainer>
                        <GameTimer
                            timeRemaining={gameSession.timer.timeRemaining}
                            totalTime={gameSession.settings.roundTime}
                            isRunning={gameSession.timer.isRunning}
                            showProgress
                        />

                        <GameQuestion
                            questionNumber={gameSession.currentRound + 1}
                            totalQuestions={gameSession.settings.roundCount}
                            question={currentQuestion.question}
                            showCounter={false}
                        />

                        <Input
                            label="Discussion Notes"
                            value={discussionNotes}
                            onChangeText={setDiscussionNotes}
                            multiline
                            placeholder="Take notes on your team's discussion..."
                        />

                        {voiceRecording.isSupported && (
                            <Button
                                variant={voiceRecording.isRecording ? 'danger' : 'secondary'}
                                icon={voiceRecording.isRecording ? 'stop' : 'microphone'}
                                onPress={voiceRecording.isRecording ?
                                    voiceRecording.stopRecording :
                                    voiceRecording.startRecording
                                }
                            >
                                {voiceRecording.isRecording ? 'Stop Recording' : 'Record Discussion'}
                            </Button>
                        )}

                        <Button
                            variant="secondary"
                            icon="fast-forward"
                            onPress={() => {
                                gameSession.timer.stop()
                                gameSession.setGamePhase('answer')
                            }}
                        >
                            End Discussion Early
                        </Button>
                    </GamePhaseContainer>
                )

            case 'answer':
                return (
                    <GamePhaseContainer>
                        <GameQuestion
                            questionNumber={gameSession.currentRound + 1}
                            totalQuestions={gameSession.settings.roundCount}
                            question={currentQuestion.question}
                            showCounter={false}
                        />

                        <PlayerSelector
                            players={gameSession.players}
                            selectedPlayer={gameSession.selectedPlayer}
                            onSelectPlayer={gameSession.selectPlayer}
                            label="Select Player Answering"
                            required
                        />

                        <Input
                            label="Team Answer"
                            value={teamAnswer}
                            onChangeText={setTeamAnswer}
                            placeholder="Enter your team's final answer"
                        />

                        {voiceRecording.isSupported && (
                            <Button
                                variant={voiceRecording.isRecording ? 'danger' : 'secondary'}
                                icon={voiceRecording.isRecording ? 'stop' : 'microphone'}
                                onPress={voiceRecording.isRecording ?
                                    voiceRecording.stopRecording :
                                    voiceRecording.startRecording
                                }
                            >
                                {voiceRecording.isRecording ? 'Stop Recording' : 'Record Answer'}
                            </Button>
                        )}

                        <Button
                            icon="send"
                            onPress={handleSubmitAnswer}
                            fullWidth
                        >
                            Submit Answer
                        </Button>
                    </GamePhaseContainer>
                )

            case 'feedback':
                const lastRound = gameSession.roundsData[gameSession.roundsData.length - 1]
                if (!lastRound) return null

                return (
                    <GamePhaseContainer>
                        <GameResult
                            teamAnswer={lastRound.teamAnswer}
                            correctAnswer={lastRound.correctAnswer}
                            isCorrect={lastRound.isCorrect}
                            playerWhoAnswered={lastRound.playerWhoAnswered}
                        />

                        <Button
                            icon={gameSession.currentRound + 1 >= gameSession.settings.roundCount ?
                                "flag-checkered" : "arrow-right"}
                            onPress={handleNextRound}
                            fullWidth
                        >
                            {gameSession.currentRound + 1 >= gameSession.settings.roundCount ?
                                'See Final Results' : 'Next Question'}
                        </Button>
                    </GamePhaseContainer>
                )

            default:
                return null
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <GameHeader
                teamName={gameSession.settings.teamName}
                score={gameSession.score}
                totalRounds={gameSession.settings.roundCount}
                currentRound={gameSession.currentRound}
                gameStartTime={gameSession.gameStartTime}
            />

            <ScrollView contentContainerStyle={styles.content}>
                {renderPhaseContent()}
            </ScrollView>

            <GameModal
                visible={showEndGameModal}
                onClose={() => setShowEndGameModal(false)}
                title="Game Over!"
                message={`Your team scored ${gameSession.score} out of ${gameSession.settings.roundCount} questions.`}
                score={gameSession.score}
                totalRounds={gameSession.settings.roundCount}
                actions={[
                    {
                        text: 'See Detailed Results',
                        onPress: handleEndGame,
                        variant: 'primary'
                    }
                ]}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flexGrow: 1,
    },
})

export default WWWGamePlayScreen

type WWWGameSetupNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WWWGameSetup'>

const WWWGameSetupScreen: React.FC = () => {
    const navigation = useNavigation<WWWGameSetupNavigationProp>()

    // Form state
    const [teamName, setTeamName] = useState('Team Intellect')
    const [questionSource, setQuestionSource] = useState<'app' | 'user'>('app')
    const [gameSettings, setGameSettings] = useState({
        difficulty: 'Medium' as const,
        roundTime: 60,
        roundCount: 10,
        enableAIHost: true
    })
    const [newMember, setNewMember] = useState('')

    // Player management
    const playerManager = usePlayerManager(['Player 1'])

    // Question management
    const questionManager = useQuestionManager({
        source: questionSource,
        difficulty: gameSettings.difficulty,
        count: gameSettings.roundCount
    })

    // Handle form submission
    const handleStartGame = () => {
        // Validation
        if (!teamName.trim()) {
            Alert.alert('Error', 'Please enter a team name')
            return
        }

        if (playerManager.players.length === 0) {
            Alert.alert('Error', 'Please add at least one team member')
            return
        }

        if (questionSource === 'user' && questionManager.questions.length === 0) {
            Alert.alert('Error', 'No custom questions available')
            return
        }

        if (questionSource === 'app' && questionManager.questions.length === 0) {
            Alert.alert('Error', 'No app questions available')
            return
        }

        // Navigate to game
        navigation.navigate('WWWGamePlay', {
            teamName,
            teamMembers: playerManager.players,
            difficulty: gameSettings.difficulty,
            roundTime: gameSettings.roundTime,
            roundCount: Math.min(gameSettings.roundCount, questionManager.questions.length),
            enableAIHost: gameSettings.enableAIHost,
            questionSource
        })
    }

    // Handle player management
    const handleAddMember = (memberName: string) => {
        const success = playerManager.addPlayer(memberName)
        if (success) {
            setNewMember('')
        } else {
            Alert.alert('Error', 'Player name already exists or is invalid')
        }
    }

    const handleRemoveMember = (index: number) => {
        const success = playerManager.removePlayer(index)
        if (!success) {
            Alert.alert('Error', 'Cannot remove the last team member')
        }
    }

    // Loading state
    if (questionManager.isLoading) {
        return <LoadingState text="Loading questions..." />
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Team Setup */}
                <Card>
                    <Input
                        label="Team Name"
                        value={teamName}
                        onChangeText={setTeamName}
                        placeholder="Enter team name"
                        required
                    />

                    <TeamMemberList
                        members={playerManager.players}
                        onAddMember={handleAddMember}
                        onRemoveMember={handleRemoveMember}
                        newMemberValue={newMember}
                        onNewMemberChange={setNewMember}
                        placeholder="Add team member"
                    />
                </Card>

                {/* Question Source */}
                <Card>
                    <SourceSelector
                        value={questionSource}
                        onValueChange={setQuestionSource}
                        label="Question Source"
                    />

                    {questionSource === 'user' && (
                        <Button
                            variant="outline"
                            icon="playlist-edit"
                            onPress={() => navigation.navigate('UserQuestions')}
                        >
                            Manage My Questions
                        </Button>
                    )}

                    {questionManager.error && (
                        <ErrorState
                            message={questionManager.error}
                            onRetry={questionManager.loadQuestions}
                            retryText="Retry Loading Questions"
                        />
                    )}
                </Card>

                {/* Game Settings */}
                <GameSettingsForm
                    settings={gameSettings}
                    onSettingsChange={setGameSettings}
                />

                {/* Action Buttons */}
                <Card>
                    <Button
                        onPress={handleStartGame}
                        disabled={questionManager.questions.length === 0}
                        fullWidth
                        icon="play"
                    >
                        Start Game
                    </Button>

                    <Button
                        variant="outline"
                        onPress={() => navigation.goBack()}
                        fullWidth
                        style={styles.backButton}
                    >
                        Back
                    </Button>
                </Card>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    backButton: {
        marginTop: 12,
    },
})

export default WWWGameSetupScreen

type CreateWWWQuestNavigationProp = NativeStackNavigationProp<RootStackParamList>

const CreateWWWQuestScreen: React.FC = () => {
    const navigation = useNavigation<CreateWWWQuestNavigationProp>()
    const { user } = useSelector((state: RootState) => state.auth)

    // API mutation
    const [createChallenge, { isLoading: isCreatingChallenge }] = useCreateChallengeMutation()

    // Form state
    const [title, setTitle] = useState('What? Where? When? Quiz')
    const [description, setDescription] = useState('Test your knowledge in this team-based quiz game.')
    const [reward, setReward] = useState('100 points')
    const [teamName, setTeamName] = useState('Team Intellect')
    const [questionSource, setQuestionSource] = useState<'app' | 'user'>('app')
    const [gameSettings, setGameSettings] = useState({
        difficulty: 'Medium' as const,
        roundTime: 60,
        roundCount: 10,
        enableAIHost: true
    })
    const [newMember, setNewMember] = useState('')

    // Player management
    const playerManager = usePlayerManager([user?.name || 'Player 1'])

    // Question management
    const questionManager = useQuestionManager({
        source: questionSource,
        difficulty: gameSettings.difficulty,
        count: gameSettings.roundCount
    })

    // Handle player management
    const handleAddMember = (memberName: string) => {
        const success = playerManager.addPlayer(memberName)
        if (success) {
            setNewMember('')
        } else {
            Alert.alert('Error', 'Player name already exists or is invalid')
        }
    }

    const handleRemoveMember = (index: number) => {
        const success = playerManager.removePlayer(index)
        if (!success) {
            Alert.alert('Error', 'Cannot remove the last team member')
        }
    }

    // Handle form submission
    const handleCreateQuest = async () => {
        // Validation
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title for your quiz')
            return
        }

        if (questionSource === 'user' && questionManager.questions.length === 0) {
            Alert.alert('Error', 'No custom questions available')
            return
        }

        if (questionSource === 'app' && questionManager.questions.length === 0) {
            Alert.alert('Error', 'No app questions available')
            return
        }

        try {
            const challengeResult = await createChallenge({
                title,
                description,
                type: 'QUIZ',
                verificationMethod: 'QUIZ',
                visibility: 'PUBLIC',
                status: 'ACTIVE',
                reward,
                quizConfig: JSON.stringify({
                    gameType: 'WWW',
                    teamName,
                    teamMembers: playerManager.players,
                    difficulty: gameSettings.difficulty,
                    roundTime: gameSettings.roundTime,
                    roundCount: gameSettings.roundCount,
                    enableAIHost: gameSettings.enableAIHost,
                    questionSource
                })
            }).unwrap()

            Alert.alert('Success', 'Quiz challenge created successfully!', [
                {
                    text: 'Start Game Now',
                    onPress: () => {
                        navigation.navigate('WWWGameSetup', {
                            challengeId: challengeResult.id
                        })
                    }
                },
                {
                    text: 'Back to Challenges',
                    onPress: () => navigateToTab(navigation, 'Challenges')
                }
            ])
        } catch (error) {
            console.error('Failed to create quiz:', error)
            Alert.alert('Error', 'Failed to create quiz challenge. Please try again.')
        }
    }

    // Loading state
    if (questionManager.isLoading) {
        return <LoadingState text="Loading questions..." />
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Challenge Details */}
                <Card>
                    <Input
                        label="Title"
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Enter quiz title"
                        required
                    />

                    <Input
                        label="Description"
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Describe your quiz challenge"
                        multiline
                    />

                    <Input
                        label="Reward"
                        value={reward}
                        onChangeText={setReward}
                        placeholder="Enter reward"
                    />
                </Card>

                {/* Question Source */}
                <Card>
                    <SourceSelector
                        value={questionSource}
                        onValueChange={setQuestionSource}
                        label="Question Source"
                    />

                    {questionSource === 'user' && (
                        <Button
                            variant="outline"
                            icon="playlist-edit"
                            onPress={() => navigation.navigate('UserQuestions')}
                        >
                            Manage My Questions
                        </Button>
                    )}
                </Card>

                {/* Team Setup */}
                <Card>
                    <Input
                        label="Team Name"
                        value={teamName}
                        onChangeText={setTeamName}
                        placeholder="Enter team name"
                        required
                    />

                    <TeamMemberList
                        members={playerManager.players}
                        onAddMember={handleAddMember}
                        onRemoveMember={handleRemoveMember}
                        newMemberValue={newMember}
                        onNewMemberChange={setNewMember}
                        placeholder="Add team member"
                    />
                </Card>

                {/* Game Settings */}
                <GameSettingsForm
                    settings={gameSettings}
                    onSettingsChange={setGameSettings}
                />

                {/* Action Buttons */}
                <Card>
                    <Button
                        onPress={handleCreateQuest}
                        loading={isCreatingChallenge}
                        disabled={isCreatingChallenge || questionManager.questions.length === 0}
                        fullWidth
                        icon="plus"
                    >
                        Create Quiz Challenge
                    </Button>
                </Card>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
})

export default CreateWWWQuestScreen