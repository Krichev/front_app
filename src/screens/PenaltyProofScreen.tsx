import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    SafeAreaView, 
    Image, 
    TouchableOpacity, 
    ScrollView,
    Alert
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useTheme } from '../shared/ui/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useGetPenaltyQuery, useSubmitPenaltyProofMutation } from '../entities/WagerState/model/slice/wagerApi';
import { Input } from '../shared/ui/Input/Input';
import { Button } from '../shared/ui/Button/Button';
import { launchImageLibrary } from 'react-native-image-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type PenaltyProofRouteProp = RouteProp<RootStackParamList, 'PenaltyProof'>;

export const PenaltyProofScreen: React.FC = () => {
    const { theme } = useTheme();
    const route = useRoute<PenaltyProofRouteProp>();
    const navigation = useNavigation();
    const { penaltyId } = route.params;

    const { data: penalty, isLoading } = useGetPenaltyQuery(penaltyId);
    const [submitProof, { isLoading: isSubmitting }] = useSubmitPenaltyProofMutation();

    const [description, setDescription] = useState('');
    const [image, setImage] = useState<{ uri: string; name: string; type: string } | null>(null);

    const handlePickImage = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
        });

        if (result.assets && result.assets[0]) {
            const asset = result.assets[0];
            setImage({
                uri: asset.uri || '',
                name: asset.fileName || 'photo.jpg',
                type: asset.type || 'image/jpeg',
            });
        }
    };

    const handleSubmit = async () => {
        if (!image && !description.trim()) {
            Alert.alert('Error', 'Please provide either a photo or a text description.');
            return;
        }

        try {
            await submitProof({
                id: penaltyId,
                description,
                file: image || undefined,
            }).unwrap();
            
            Alert.alert('Success', 'Proof submitted successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Failed to submit proof:', error);
            Alert.alert('Error', 'Failed to submit proof. Please try again.');
        }
    };

    if (isLoading || !penalty) {
        return <View style={styles.center}><Text>Loading...</Text></View>;
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.colors.text.primary }]}>Submit Proof</Text>
                    <View style={[styles.penaltyInfo, { backgroundColor: theme.colors.background.secondary }]}>
                        <Text style={[styles.penaltyType, { color: theme.colors.text.secondary }]}>{penalty.penaltyType}</Text>
                        <Text style={[styles.penaltyDesc, { color: theme.colors.text.primary }]}>{penalty.description}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Photo Proof</Text>
                    <TouchableOpacity 
                        style={[
                            styles.imagePicker, 
                            { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.main }
                        ]}
                        onPress={handlePickImage}
                    >
                        {image ? (
                            <Image source={{ uri: image.uri }} style={styles.preview} />
                        ) : (
                            <View style={styles.pickerContent}>
                                <MaterialCommunityIcons name="camera-plus" size={48} color={theme.colors.text.disabled} />
                                <Text style={{ color: theme.colors.text.secondary, marginTop: 8 }}>Tap to select an image</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Input
                        label="Description (Optional)"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        placeholder="Explain how you completed the penalty..."
                    />
                </View>

                <View style={styles.footer}>
                    <Button 
                        onPress={handleSubmit} 
                        loading={isSubmitting}
                        fullWidth
                    >
                        Submit Completion
                    </Button>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        padding: 20,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    penaltyInfo: {
        padding: 16,
        borderRadius: 12,
    },
    penaltyType: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    penaltyDesc: {
        fontSize: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    imagePicker: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    pickerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    preview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    footer: {
        marginTop: 12,
        marginBottom: 40,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
