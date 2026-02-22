import React from 'react';
import { WagerInvitationCard } from '../../../features/Wager/ui/WagerInvitationCard';

interface WagerSectionProps {
    pendingWagerInvitation: any;
}

export const WagerSection: React.FC<WagerSectionProps> = ({
    pendingWagerInvitation,
}) => {
    if (!pendingWagerInvitation) return null;

    return (
        <WagerInvitationCard wager={pendingWagerInvitation} />
    );
};
