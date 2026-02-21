// src/screens/PuzzleSetupScreen.tsx
import React, { useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    SafeAreaView, 
    TouchableOpacity, 
    ScrollView, 
    TextInput,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAppStyles } from '../shared/ui/hooks/useAppStyles';
import { useUploadMediaMutation } from '../entities/MediaState/model/slice/mediaApi';
import { useCreatePuzzleGameMutation, useGeneratePuzzlePiecesMutation } from '../entities/PuzzleState/model/slice/puzzleApi';
import { RootStackParamList } from '../navigation/AppNavigator';
import { PuzzleGameMode } from '../entities/PuzzleState/model/types';

type PuzzleSetupRouteProp = RouteProp<RootStackParamList, 'PuzzleSetup'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PuzzleSetup'>;

const PuzzleSetupScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<PuzzleSetupRouteProp>();
    const { challengeId } = route.params;
    const { screen, theme, form } = useAppStyles();

    const [gameMode, setGameMode] = useState<PuzzleGameMode>('INDIVIDUAL');
    const [gridSize, setGridSize] = useState(3);
    const [answer, setAnswer] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const [uploadMedia] = useUploadMediaMutation();
    const [createGame] = useCreatePuzzleGameMutation();
    const [generatePieces] = useGeneratePuzzlePiecesMutation();

    const handleSelectImage = useCallback(async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
        });

        if (result.assets && result.assets.length > 0) {
            setImageUri(result.assets[0].uri || null);
        }
    }, []);

    const handleCreate = useCallback(async () => {
        if (!imageUri || !answer.trim()) {
            Alert.alert('Error', 'Please select an image and provide the correct answer.');
            return;
        }

        setIsCreating(true);
        try {
            // 1. Upload image
            const formData = new FormData();
            formData.append('mediaFile', {
                uri: imageUri,
                name: 'puzzle_source.jpg',
                type: 'image/jpeg',
            } as any);

            const uploadResult = await uploadMedia(formData).unwrap();
            
            // 2. Create game
            const game = await createGame({
                challengeId: parseInt(challengeId),
                sourceImageMediaId: parseInt(uploadResult.id),
                gameMode,
                gridRows: gridSize,
                gridCols: gridSize,
                answer: answer.trim(),
                difficulty: 'MEDIUM',
            }).unwrap();

            // 3. Trigger piece generation
            await generatePieces(game.id).unwrap();

            // 4. Navigate to gameplay
            navigation.navigate('PuzzleGamePlay', {
                puzzleGameId: game.id,
                gameMode,
                gridRows: gridSize,
                gridCols: gridSize,
            });

        } catch (err) {
            console.error('Failed to create puzzle game', err);
            Alert.alert('Error', 'Failed to create puzzle game. Please try again.');
        } finally {
            setIsCreating(false);
        }
    }, [imageUri, answer, challengeId, gameMode, gridSize, uploadMedia, createGame, generatePieces, navigation]);

    return (
        <SafeAreaView style={screen.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="close" size={28} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Puzzle Setup</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity style={styles.imagePicker} onPress={handleSelectImage}>
                    {imageUri ? (
                        <View style={styles.imagePlaceholder}>
                            <MaterialCommunityIcons name="image-check" size={48} color={theme.colors.primary} />
                            <Text style={{ color: theme.colors.primary }}>Image Selected</Text>
                        </View>
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <MaterialCommunityIcons name="image-plus" size={48} color={theme.colors.textSecondary} />
                            <Text style={{ color: theme.colors.textSecondary }}>Select Source Image</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Game Mode</Text>
                    <View style={styles.row}>
                        <TouchableOpacity 
                            style={[styles.modeButton, gameMode === 'INDIVIDUAL' && { backgroundColor: theme.colors.primary }]}
                            onPress={() => setGameMode('INDIVIDUAL')}
                        >
                            <Text style={[styles.modeButtonText, gameMode === 'INDIVIDUAL' && { color: '#FFF' }]}>Individual</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.modeButton, gameMode === 'SHARED' && { backgroundColor: theme.colors.primary }]}
                            onPress={() => setGameMode('SHARED')}
                        >
                            <Text style={[styles.modeButtonText, gameMode === 'SHARED' && { color: '#FFF' }]}>Team Shared</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Grid Size ({gridSize}x{gridSize})</Text>
                    <View style={styles.row}>
                        {[2, 3, 4, 5].map(size => (
                            <TouchableOpacity 
                                key={size}
                                style={[styles.sizeButton, gridSize === size && { borderColor: theme.colors.primary, borderWidth: 2 }]}
                                onPress={() => setGridSize(size)}
                            >
                                <Text style={{ color: theme.colors.text }}>{size}x{size}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Correct Answer</Text>
                    <TextInput
                        style={[form.input, { color: theme.colors.text }]}
                        value={answer}
                        onChangeText={setAnswer}
                        placeholder="What should they guess?"
                        placeholderTextColor={theme.colors.textSecondary}
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleCreate}
                    disabled={isCreating}
                >
                    {isCreating ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.createButtonText}>Create & Generate Puzzle</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 56,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 16,
    },
    imagePicker: {
        height: 200,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    imagePlaceholder: {
        alignItems: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    modeButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginRight: 12,
    },
    modeButtonText: {
        fontWeight: '500',
    },
    sizeButton: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginBottom: 12,
    },
    createButton: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    createButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default PuzzleSetupScreen;
