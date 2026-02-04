import { useContext } from 'react';
import { ScreenTimeContext } from '../../app/providers/ScreenTimeProvider';

export const useScreenTime = () => {
    const context = useContext(ScreenTimeContext);
    if (!context) {
        throw new Error('useScreenTime must be used within ScreenTimeProvider');
    }
    return context;
};

// Helper hook for formatted time
export const useFormattedScreenTime = () => {
    const { availableSeconds, urgencyLevel } = useScreenTime();
    
    const hours = Math.floor(availableSeconds / 3600);
    const minutes = Math.floor((availableSeconds % 3600) / 60);
    const seconds = availableSeconds % 60;
    
    const formatted = hours > 0 
        ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        : `${minutes}:${String(seconds).padStart(2, '0')}`;
    
    return { formatted, hours, minutes, seconds, urgencyLevel };
};
