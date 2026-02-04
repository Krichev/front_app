import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface PlayerStatusProps {
    name: string;
    score: number;
    status: 'active' | 'locked_out' | 'answering';
    isMe?: boolean;
}

export const PlayerStatus: React.FC<PlayerStatusProps> = ({ name, score, status, isMe }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'answering': return '#4CAF50';
            case 'locked_out': return '#F44336';
            default: return '#2196F3';
        }
    };

    return (
        <View style={[styles.container, isMe && styles.isMe]}>
            <View style={styles.info}>
                <Text style={styles.name}>{name}{isMe ? ' (You)' : ''}</Text>
                <Text style={styles.score}>Score: {score}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
                <Text style={styles.badgeText}>{status.toUpperCase().replace('_', ' ')}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#FFF',
        borderRadius: 8,
        marginBottom: 8,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#EEE',
    },
    isMe: {
        borderColor: '#2196F3',
        borderWidth: 2,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    score: {
        fontSize: 14,
        color: '#666',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
