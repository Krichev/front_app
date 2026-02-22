import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles';

interface DebugSectionProps {
    userIsCreator: boolean;
    hasUserJoined: boolean;
    participants: any;
}

export const DebugSection: React.FC<DebugSectionProps> = ({
    userIsCreator,
    hasUserJoined,
    participants,
}) => {
    return (
        <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Debug Info</Text>
            <Text style={styles.debugText}>Is Creator: {userIsCreator ? 'Yes' : 'No'}</Text>
            <Text style={styles.debugText}>Has joined: {hasUserJoined ? 'Yes' : 'No'}</Text>
            <Text style={styles.debugText}>Participants: {JSON.stringify(participants)}</Text>
        </View>
    );
};
