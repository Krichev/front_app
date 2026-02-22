import React from 'react';
import { Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from '../styles';
import { QuestAudioPlayer } from '../../../components/QuestAudioPlayer';

interface AudioSectionProps {
    audioConfig: any;
}

export const AudioSection: React.FC<AudioSectionProps> = ({
    audioConfig,
}) => {
    if (!audioConfig) return null;

    return (
        <View style={styles.audioContainer}>
            <Text style={styles.sectionTitle}>Quest Audio Track</Text>
            <QuestAudioPlayer
                audioConfig={audioConfig}
                autoPlay={false}
            />
            {audioConfig.minimumScorePercentage > 0 && (
                <View style={styles.audioRequirement}>
                    <MaterialCommunityIcons name="trophy" size={20} color="#FF9800" />
                    <Text style={styles.audioRequirementText}>
                        You must score at least {audioConfig.minimumScorePercentage}% to complete this quest
                    </Text>
                </View>
            )}
        </View>
    );
};
