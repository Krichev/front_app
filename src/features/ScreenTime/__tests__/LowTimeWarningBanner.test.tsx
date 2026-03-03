import React from 'react';
import { render } from '@testing-library/react-native';
import { LowTimeWarningBanner } from '../ui/LowTimeWarningBanner';

// Mock vector icons
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

// Mock react-redux
let mockIsAuthenticated = false;
jest.mock('react-redux', () => ({
    useSelector: (selector: any) => selector({ auth: { isAuthenticated: mockIsAuthenticated } }),
}));

// Mock the hooks
jest.mock('../../../shared/hooks/useScreenTime', () => ({
    useScreenTime: () => ({
        availableSeconds: 0,
        isLocked: false,
    }),
}));

jest.mock('../../../shared/ui/theme', () => ({
    useTheme: () => ({
        theme: {
            colors: {
                warning: { main: 'orange' },
            }
        }
    })
}));

jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0 }),
}));

describe('LowTimeWarningBanner', () => {
    it('does not show when user is not authenticated', () => {
        mockIsAuthenticated = false;

        const { queryByText } = render(
            <LowTimeWarningBanner />
        );

        expect(queryByText(/minutes remaining/i)).toBeNull();
    });

    it('shows when user is authenticated and time is low', () => {
        mockIsAuthenticated = true;

        const { getByText } = render(
            <LowTimeWarningBanner thresholdMinutes={15} />
        );

        expect(getByText(/minutes remaining/i)).toBeTruthy();
    });
});
