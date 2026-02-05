import React, { useState } from 'react';
import { View, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { 
    useGetInvitationQuery, 
    useRespondToInvitationMutation,
    useCancelInvitationMutation,
    useCreateCounterOfferMutation,
    useRespondToCounterOfferMutation
} from '../../../entities/InvitationState/model/slice/invitationApi';
import { InvitationDetailsCard } from './InvitationDetailsCard';
import { CounterOfferModal } from './CounterOfferModal';
import { CreateCounterOfferRequest } from '../../../entities/InvitationState/model/types';
import { useTheme } from '../../../shared/ui/theme';

interface InvitationResponseSheetProps {
    invitationId: number;
    onClose: () => void;
    isSentView?: boolean;
}

export const InvitationResponseSheet: React.FC<InvitationResponseSheetProps> = ({ invitationId, onClose, isSentView }) => {
    const { theme } = useTheme();
    const { data: invitation, isLoading } = useGetInvitationQuery(invitationId);
    
    const [respondToInvitation, { isLoading: isResponding }] = useRespondToInvitationMutation();
    const [cancelInvitation, { isLoading: isCancelling }] = useCancelInvitationMutation();
    const [createCounterOffer, { isLoading: isCountering }] = useCreateCounterOfferMutation();
    const [respondToCounterOffer, { isLoading: isRespondingToCounter }] = useRespondToCounterOfferMutation();

    const [showCounterModal, setShowCounterModal] = useState(false);

    if (isLoading || !invitation) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
        );
    }

    const handleAccept = async () => {
        try {
            await respondToInvitation({ id: invitationId, body: { response: 'ACCEPT' } }).unwrap();
            Alert.alert('Success', 'Invitation accepted!');
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to accept invitation');
        }
    };

    const handleDecline = async () => {
        try {
            await respondToInvitation({ id: invitationId, body: { response: 'DECLINE' } }).unwrap();
            Alert.alert('Success', 'Invitation declined');
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to decline invitation');
        }
    };

    const handleCancel = async () => {
        try {
            await cancelInvitation(invitationId).unwrap();
            Alert.alert('Success', 'Invitation cancelled');
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to cancel invitation');
        }
    };

    const handleCounterSubmit = async (request: CreateCounterOfferRequest) => {
        try {
            await createCounterOffer({ id: invitationId, body: request }).unwrap();
            Alert.alert('Success', 'Counter-offer sent!');
            setShowCounterModal(false);
            // Optionally keep open to show updated state
        } catch (error) {
            Alert.alert('Error', 'Failed to send counter-offer');
        }
    };

    const handleRespondToCounter = async (negotiationId: number, accepted: boolean) => {
        try {
            await respondToCounterOffer({ 
                invitationId, 
                negotiationId, 
                body: { accepted } 
            }).unwrap();
            Alert.alert('Success', accepted ? 'Counter-offer accepted!' : 'Counter-offer rejected.');
        } catch (error) {
            Alert.alert('Error', 'Failed to respond to counter-offer');
        }
    };

    return (
        <>
            <InvitationDetailsCard
                invitation={invitation}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onNegotiate={() => setShowCounterModal(true)}
                onCancel={handleCancel}
                onRespondToCounter={handleRespondToCounter}
                currentUserId={isSentView ? invitation.inviterId : invitation.inviteeId} // Use local logic or actual auth id if available in store
                isLoading={isResponding || isCancelling || isCountering || isRespondingToCounter}
            />

            <CounterOfferModal
                visible={showCounterModal}
                invitation={invitation}
                onClose={() => setShowCounterModal(false)}
                onSubmit={handleCounterSubmit}
                isLoading={isCountering}
            />
        </>
    );
};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
