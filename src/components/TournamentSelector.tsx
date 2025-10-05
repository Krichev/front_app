// src/components/TournamentSelector.tsx - Optional Enhancement
import React, {useState} from 'react';
import {ActivityIndicator, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Tournament {
    id: number;
    title: string;
    description?: string;
    questionCount: number;
    activeQuestions: number;
}

interface TournamentSelectorProps {
    selectedTournamentId: string;
    onSelectTournament: (id: string) => void;
    tournaments?: Tournament[]; // Optional: can be passed from API
    isLoading?: boolean;
}

const TournamentSelector: React.FC<TournamentSelectorProps> = ({
                                                                   selectedTournamentId,
                                                                   onSelectTournament,
                                                                   tournaments,
                                                                   isLoading = false,
                                                               }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Mock tournaments if none provided (for demo)
    const defaultTournaments: Tournament[] = [
        { id: 1, title: 'General Knowledge', questionCount: 150, activeQuestions: 145 },
        { id: 2, title: 'Science & Technology', questionCount: 200, activeQuestions: 190 },
        { id: 3, title: 'History & Culture', questionCount: 180, activeQuestions: 175 },
        { id: 4, title: 'Sports & Entertainment', questionCount: 120, activeQuestions: 115 },
        { id: 5, title: 'Advanced Challenge', questionCount: 250, activeQuestions: 240 },
    ];

    const displayTournaments = tournaments || defaultTournaments;

    // Filter tournaments based on search
    const filteredTournaments = displayTournaments.filter(
        (t) =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.id.toString().includes(searchQuery)
    );

    const selectedTournament = displayTournaments.find(
        (t) => t.id.toString() === selectedTournamentId
    );

    const handleSelectTournament = (id: number) => {
        onSelectTournament(id.toString());
        setModalVisible(false);
        setSearchQuery('');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Select Tournament</Text>

            <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setModalVisible(true)}
                disabled={isLoading}
            >
                <View style={styles.selectorContent}>
                    <MaterialCommunityIcons name="trophy" size={24} color="#4CAF50" />
                    <View style={styles.selectorTextContainer}>
                        <Text style={styles.selectorTitle}>
                            {selectedTournament?.title || `Tournament #${selectedTournamentId}`}
                        </Text>
                        {selectedTournament && (
                            <Text style={styles.selectorSubtitle}>
                                {selectedTournament.activeQuestions} active questions
                            </Text>
                        )}
                    </View>
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#4CAF50" />
                    ) : (
                        <MaterialCommunityIcons name="chevron-down" size={24} color="#999" />
                    )}
                </View>
            </TouchableOpacity>

            {/* Tournament Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Tournament</Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <MaterialCommunityIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* Search */}
                        <View style={styles.searchContainer}>
                            <MaterialCommunityIcons
                                name="magnify"
                                size={20}
                                color="#999"
                                style={styles.searchIcon}
                            />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search tournaments..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholderTextColor="#999"
                            />
                        </View>

                        {/* Tournament List */}
                        <FlatList
                            data={filteredTournaments}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.tournamentItem,
                                        item.id.toString() === selectedTournamentId &&
                                        styles.selectedTournamentItem,
                                    ]}
                                    onPress={() => handleSelectTournament(item.id)}
                                >
                                    <MaterialCommunityIcons
                                        name="trophy"
                                        size={24}
                                        color={
                                            item.id.toString() === selectedTournamentId
                                                ? '#4CAF50'
                                                : '#999'
                                        }
                                    />
                                    <View style={styles.tournamentInfo}>
                                        <Text
                                            style={[
                                                styles.tournamentTitle,
                                                item.id.toString() === selectedTournamentId &&
                                                styles.selectedTournamentTitle,
                                            ]}
                                        >
                                            {item.title}
                                        </Text>
                                        <Text style={styles.tournamentSubtitle}>
                                            ID: {item.id} • {item.activeQuestions} active questions
                                        </Text>
                                    </View>
                                    {item.id.toString() === selectedTournamentId && (
                                        <MaterialCommunityIcons
                                            name="check-circle"
                                            size={24}
                                            color="#4CAF50"
                                        />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <MaterialCommunityIcons
                                        name="trophy-outline"
                                        size={48}
                                        color="#ccc"
                                    />
                                    <Text style={styles.emptyText}>No tournaments found</Text>
                                </View>
                            }
                        />

                        {/* Manual ID Input */}
                        <View style={styles.manualInputContainer}>
                            <Text style={styles.manualInputLabel}>Or enter Tournament ID:</Text>
                            <View style={styles.manualInputRow}>
                                <TextInput
                                    style={styles.manualInput}
                                    placeholder="Enter ID"
                                    keyboardType="number-pad"
                                    onSubmitEditing={(e) => {
                                        const id = e.nativeEvent.text;
                                        if (id) {
                                            onSelectTournament(id);
                                            setModalVisible(false);
                                        }
                                    }}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontWeight: '500',
    },
    selectorButton: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
    },
    selectorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    selectorTextContainer: {
        flex: 1,
    },
    selectorTitle: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    selectorSubtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        margin: 16,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    tournamentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        gap: 12,
    },
    selectedTournamentItem: {
        backgroundColor: '#f0f9f4',
    },
    tournamentInfo: {
        flex: 1,
    },
    tournamentTitle: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    selectedTournamentTitle: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    tournamentSubtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 12,
    },
    manualInputContainer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    manualInputLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    manualInputRow: {
        flexDirection: 'row',
        gap: 8,
    },
    manualInput: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
    },
});

export default TournamentSelector;