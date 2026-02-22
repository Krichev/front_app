import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

interface CreatorSectionProps {
    creatorId: string | undefined;
    onPress: () => void;
}

export const CreatorSection: React.FC<CreatorSectionProps> = ({
    creatorId,
    onPress,
}) => {
    return (
        <TouchableOpacity style={styles.creatorSection} onPress={onPress}>
            <Text style={styles.sectionTitle}>Created By</Text>
            <View style={styles.creatorInfo}>
                <Text style={styles.creatorName}>
                    {creatorId ? `User ID: ${creatorId}` : 'Unknown Creator'}
                </Text>
            </View>
        </TouchableOpacity>
    );
};
