import { useScreenDimensions } from '../lib/responsive';

/**
 * Hook for reactive screen dimensions (width, height, etc.)
 * SINGLE source of truth for screen dimensions across the app
 */
export const useDimensions = () => {
  const { width, height, scale, verticalScale, moderateScale, isSmallScreen, isNarrowScreen } = useScreenDimensions();
  return { width, height, scale, verticalScale, moderateScale, isSmallScreen, isNarrowScreen };
};
