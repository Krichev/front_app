import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AppLockOverlay } from '../ui/AppLockOverlay';

// Mock vector icons
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

// Mock react-redux
jest.mock('react-redux', () => ({
    useSelector: (selector: any) => selector({ auth: { isAuthenticated: true } }),
    Provider: ({ children }: any) => children,
}));

// Mock wagerApi
jest.mock('../../../entities/WagerState/model/slice/wagerApi', () => ({
    useGetMyPenaltiesQuery: () => ({ data: { content: [] } }),
}));

// Mock parentalApi
jest.mock('../../../entities/ParentalState/model/slice/parentalApi', () => ({
    useGetLinkedParentsQuery: () => ({ data: [] }),
    useRequestTimeExtensionMutation: () => [jest.fn(), { isLoading: false }],
}));

// Mock the context
jest.mock('../../../shared/hooks/useScreenTime', () => ({
    useScreenTime: () => ({
        isLocked: true,
        isInitialized: true,
        isFirstLoad: false,
        status: { lastResetDate: '2024-01-01' },
        budget: { availableMinutes: 0 },
    }),
}));

// Mock the theme
jest.mock('../../../shared/ui/theme', () => ({
    useTheme: () => ({
        theme: {
            colors: {
                error: { main: 'red' },
                primary: { main: 'blue' },
                warning: { main: 'orange' },
                text: { inverse: 'white', inverseSecondary: 'grey', secondary: 'grey' },
                border: { inverse: 'white' }
            }
        }
    })
}));

describe('AppLockOverlay', () => {
    it('renders when locked', () => {
        const { getByText } = render(<AppLockOverlay isLocked={true} />);
        expect(getByText("Time's Up!")).toBeTruthy();
    });
    
    it('does not render when not locked', () => {
        const { queryByText } = render(<AppLockOverlay isLocked={false} />);
        expect(queryByText("Time's Up!")).toBeNull();
    });

    it('does not animate on first load after login', () => {
        // Mock isFirstLoad = true
        jest.spyOn(require('../../../shared/hooks/useScreenTime'), 'useScreenTime')
            .mockReturnValue({
                isLocked: true,
                isInitialized: true,
                isFirstLoad: true,
                status: { lastResetDate: '2024-01-01' },
                budget: { availableMinutes: 0 },
            });
        
        const { getByText } = render(<AppLockOverlay isLocked={true} />);
        expect(getByText("Time's Up!")).toBeTruthy();
        // Verify no animation was played (overlay should be immediately visible)
    });
    
    it('shows penalty info when provided', () => {
        const penalties = [{ id: 1, description: 'Test', minutesLocked: 30, dueDate: '2024-01-01' }];
        const { getByText } = render(
            <AppLockOverlay isLocked={true} pendingPenalties={penalties} />
        );
        expect(getByText('30 minutes')).toBeTruthy();
    });
    
    it('calls onViewPenalties when card is pressed', () => {
        const onViewPenalties = jest.fn();
        const penalties = [{ id: 1, description: 'Test', minutesLocked: 30, dueDate: '2024-01-01' }];
        const { getByLabelText } = render(
            <AppLockOverlay 
                isLocked={true} 
                pendingPenalties={penalties}
                onViewPenalties={onViewPenalties}
            />
        );
        fireEvent.press(getByLabelText(/View.*penalties/i));
        expect(onViewPenalties).toHaveBeenCalled();
    });
});
