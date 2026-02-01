import { useCallback } from 'react';
import { 
    useCreateWagerMutation,
    useAcceptWagerMutation,
    useDeclineWagerMutation,
    useCancelWagerMutation,
    useSettleWagerMutation,
} from '../../../entities/WagerState/model/slice/wagerApi';
import { CreateWagerRequest } from '../../../entities/WagerState/model/types';

export function useWager() {
    const [createWagerMutation, { isLoading: isCreating }] = useCreateWagerMutation();
    const [acceptWagerMutation, { isLoading: isAccepting }] = useAcceptWagerMutation();
    const [declineWagerMutation, { isLoading: isDeclining }] = useDeclineWagerMutation();
    const [cancelWagerMutation, { isLoading: isCancelling }] = useCancelWagerMutation();
    const [settleWagerMutation, { isLoading: isSettling }] = useSettleWagerMutation();

    const createWager = useCallback(async (request: CreateWagerRequest) => {
        return createWagerMutation(request).unwrap();
    }, [createWagerMutation]);

    const acceptWager = useCallback(async (wagerId: number) => {
        return acceptWagerMutation(wagerId).unwrap();
    }, [acceptWagerMutation]);

    const declineWager = useCallback(async (wagerId: number) => {
        return declineWagerMutation(wagerId).unwrap();
    }, [declineWagerMutation]);

    const cancelWager = useCallback(async (wagerId: number) => {
        return cancelWagerMutation(wagerId).unwrap();
    }, [cancelWagerMutation]);

    const settleWager = useCallback(async (wagerId: number) => {
        return settleWagerMutation(wagerId).unwrap();
    }, [settleWagerMutation]);

    return {
        isCreating,
        isAccepting,
        isDeclining,
        isCancelling,
        isSettling,
        createWager,
        acceptWager,
        declineWager,
        cancelWager,
        settleWager,
    };
}
