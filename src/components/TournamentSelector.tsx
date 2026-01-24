// src/components/TournamentSelector.tsx
import React, {useState} from 'react';
import {ActivityIndicator, FlatList, Modal, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAppStyles} from '../shared/ui/hooks/useAppStyles';
import {createStyles} from '../shared/ui/theme';

interface Tournament {
    id: string;
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
    const {theme} = useAppStyles();
    const styles = themeStyles;
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Mock tournaments if none provided (for demo)
    const defaultTournaments: Tournament[] = [
        { id: '1', title: 'General Knowledge', questionCount: 150, activeQuestions: 145 },
        { id: '2', title: 'Science & Technology', questionCount: 200, activeQuestions: 190 },
        { id: '3', title: 'History & Culture', questionCount: 180, activeQuestions: 175 },
        { id: '4', title: 'Sports & Entertainment', questionCount: 120, activeQuestions: 115 },
        { id: '5', title: 'Advanced Challenge', questionCount: 250, activeQuestions: 240 },
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

    const handleSelectTournament = (id: string) => {
        onSelectTournament(id);
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
                    <MaterialCommunityIcons name="trophy" size={24} color={theme.colors.success.main} />
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
                        <ActivityIndicator size="small" color={theme.colors.success.main} />
                    ) : (
                        <MaterialCommunityIcons name="chevron-down" size={24} color={theme.colors.text.disabled} />
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
                                <MaterialCommunityIcons name="close" size={24} color={theme.colors.text.secondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Search */}
                        <View style={styles.searchContainer}>
                            <MaterialCommunityIcons
                                name="magnify"
                                size={20}
                                color={theme.colors.text.disabled}
                                style={styles.searchIcon}
                            />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search tournaments..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholderTextColor={theme.colors.text.disabled}
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
                                                ? theme.colors.success.main
                                                : theme.colors.text.disabled
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
                                            color={theme.colors.success.main}
                                        />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <MaterialCommunityIcons
                                        name="trophy-outline"
                                        size={48}
                                        color={theme.colors.text.disabled}
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
                                    placeholderTextColor={theme.colors.text.disabled}
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

const themeStyles = createStyles(theme => ({
    container: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        ...theme.typography.body.small,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
        fontWeight: theme.typography.fontWeight.medium,
    },
    selectorButton: {
        backgroundColor: theme.colors.background.tertiary,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.md,
    },
    selectorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    selectorTextContainer: {
        flex: 1,
    },
    selectorTitle: {
        ...theme.typography.body.medium,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    selectorSubtitle: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay.medium,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.background.primary,
        borderTopLeftRadius: theme.layout.borderRadius.xl,
        borderTopRightRadius: theme.layout.borderRadius.xl,
        maxHeight: '80%',
        paddingBottom: theme.spacing.xl,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
    },
    modalTitle: {
        ...theme.typography.heading.h6,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    closeButton: {
        padding: theme.spacing.xs,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.borderRadius.md,
        margin: theme.spacing.lg,
        paddingHorizontal: theme.spacing.md,
    },
    searchIcon: {
        marginRight: theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        ...theme.typography.body.medium,
        color: theme.colors.text.primary,
    },
    tournamentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.background.tertiary,
        gap: theme.spacing.md,
    },
    selectedTournamentItem: {
        backgroundColor: theme.colors.success.background,
    },
    tournamentInfo: {
        flex: 1,
    },
    tournamentTitle: {
        ...theme.typography.body.medium,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    selectedTournamentTitle: {
        color: theme.colors.success.main,
        fontWeight: theme.typography.fontWeight.bold,
    },
    tournamentSubtitle: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing['4xl'],
    },
    emptyText: {
        ...theme.typography.body.medium,
        color: theme.colors.text.disabled,
        marginTop: theme.spacing.md,
    },
    manualInputContainer: {
        padding: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.light,
    },
    manualInputLabel: {
        ...theme.typography.body.small,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    manualInputRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    manualInput: {
        flex: 1,
        backgroundColor: theme.colors.background.tertiary,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        borderRadius: theme.layout.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        ...theme.typography.body.medium,
        color: theme.colors.text.primary,
    },
}));

export default TournamentSelector;
