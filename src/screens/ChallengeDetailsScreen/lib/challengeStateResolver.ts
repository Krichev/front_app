import { ApiChallenge } from '../../../entities/ChallengeState/model/types';

export interface ChallengeState {
    isCancelled: boolean;
    isCreator: boolean;
    hasUserJoined: boolean;
    isQuizType: boolean;
    canJoin: boolean;
    canSubmitCompletion: boolean;
    canDelete: boolean;
    canInvite: boolean;
}

export function resolveChallengeState(
    challenge: ApiChallenge | undefined,
    userId: string | undefined
): ChallengeState {
    if (!challenge || !userId) {
        return {
            isCancelled: false,
            isCreator: false,
            hasUserJoined: false,
            isQuizType: false,
            canJoin: false,
            canSubmitCompletion: false,
            canDelete: false,
            canInvite: false,
        };
    }

    const isCancelled = challenge.status === 'CANCELLED';
    const isCreator = !!challenge.userIsCreator;
    
    // Participants can be string[], string, or null
    let participantsArray: string[] = [];
    if (Array.isArray(challenge.participants)) {
        participantsArray = challenge.participants;
    } else if (typeof challenge.participants === 'string') {
        try {
            const parsed = JSON.parse(challenge.participants);
            if (Array.isArray(parsed)) {
                participantsArray = parsed;
            } else {
                participantsArray = [challenge.participants];
            }
        } catch (e) {
            participantsArray = [challenge.participants];
        }
    }
    
    const hasUserJoined = participantsArray.includes(userId) || isCreator;
    
    const isQuizType = challenge.type === 'QUIZ';

    return {
        isCancelled,
        isCreator,
        hasUserJoined,
        isQuizType,
        canJoin: !hasUserJoined && !isCreator && !isCancelled,
        canSubmitCompletion: (hasUserJoined || isCreator) && !isCancelled,
        canDelete: isCreator && !isCancelled,
        canInvite: isCreator,
    };
}
