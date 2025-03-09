import React from 'react';
import {ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from "react-native-screens/native-stack";
import {useGetChallengesQuery} from "../entities/ChallengeState/model/slice/challengeApi.ts"; // Adjust according to your file structure

// Define a type for your challenge data (expand as needed)
interface ChallengeScreen {
    id: string;
    title: string;
    description?: string;
    createdAt?: string;
    // Add any additional fields as required
}

interface Paging {
    page?: number;
    limit?: number
}

// Define the types for the navigation parameters
type RootStackParamList = {
    Home: undefined;
    Challenges: undefined;
    ChallengeDetails: { challengeId: string };
    CreateChallenge: undefined;
};

type ChallengesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Challenges'>;

const ChallengesScreen: React.FC = () => {
    const navigation = useNavigation<ChallengesScreenNavigationProp>();

    // RTK Query call to fetch challenges
    const {data: challenges, error, isLoading} = useGetChallengesQuery({ page: 1, limit: 10 });

    // Renders each challenge item in the list.
    const renderChallengeItem = ({item}: { item: ChallengeScreen }) => {
        return (
            <TouchableOpacity
                style={styles.challengeItem}
                onPress={() => navigation.navigate('ChallengeDetails', {challengeId: item.id})}
            >
                <Text style={styles.challengeTitle}>{item.title}</Text>
                {item.description && <Text style={styles.challengeDesc}>{item.description}</Text>}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Screen Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Challenges</Text>
            </View>

            {/* Main content area */}
            <View style={styles.content}>
                {isLoading ? (
                    <ActivityIndicator size="large" color="#4CAF50"/>
                ) : error ? (
                    <Text style={styles.errorText}>Failed to load challenges.</Text>
                ) : challenges && challenges.length > 0 ? (
                    <FlatList
                        data={challenges}
                        keyExtractor={(item) => item.id}
                        renderItem={renderChallengeItem}
                        contentContainerStyle={styles.challengeList}
                    />
                ) : (
                    <Text style={styles.noDataText}>No challenges available.</Text>
                )}
            </View>

            {/* Floating Action Button to create a new challenge */}
            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateChallenge')}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default ChallengesScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 16,
        backgroundColor: '#4CAF50',
        elevation: 4,
        shadowOpacity: 0.2,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    challengeList: {
        paddingBottom: 80, // Space for FAB
    },
    challengeItem: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    challengeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    challengeDesc: {
        fontSize: 14,
        color: '#757575',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
    },
    noDataText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#757575',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowOpacity: 0.3,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 3 },
    },
    fabText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
});
