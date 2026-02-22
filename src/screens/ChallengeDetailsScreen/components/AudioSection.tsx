import React from 'react';
import { Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles';
import { QuestAudioPlayer } from '../../../components/QuestAudioPlayer';

interface AudioSectionProps {
    audioConfig: any;
}

export const AudioSection: React.FC<AudioSectionProps> = ({
    audioConfig,
}) => {
    const { t } = useTranslation();

    if (!audioConfig) return null;

    return (
        <View style={styles.audioContainer}>
            <Text style={styles.sectionTitle}>{t('challengeDetails.audio.title')}</Text>
            <QuestAudioPlayer
                audioConfig={audioConfig}
                autoPlay={false}
            />
            {audioConfig.minimumScorePercentage > 0 && (
                <View style={styles.audioRequirement}>
                    <MaterialCommunityIcons name="trophy" size={20} color="#FF9800" />
                    <Text style={styles.audioRequirementText}>
                        {t('challengeDetails.audio.requirement', { percentage: audioConfig.minimumScorePercentage })}
                    </Text>
                </View>
            )}
        </View>
    );
};
