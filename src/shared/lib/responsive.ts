import { Dimensions, PixelRatio, ScaledSize } from 'react-native';
import { useState, useEffect } from 'react';

// Design baseline: 393dp width (Xiaomi 13 Lite as the "tight" target)
const DESIGN_WIDTH = 393;
const DESIGN_HEIGHT = 851;

const { width: INITIAL_WIDTH, height: INITIAL_HEIGHT } = Dimensions.get('window');

/**
 * Horizontal scaling (width-dependent values)
 */
export const scale = (size: number) => (INITIAL_WIDTH / DESIGN_WIDTH) * size;

/**
 * Vertical scaling (height-dependent values)
 */
export const verticalScale = (size: number) => (INITIAL_HEIGHT / DESIGN_HEIGHT) * size;

/**
 * Controlled scaling (default factor 0.5 = halfway between fixed and fully scaled)
 * Primary function to use for font sizes, padding, margins, icon sizes.
 */
export const moderateScale = (size: number, factor = 0.5) => 
  size + (scale(size) - size) * factor;

/**
 * Responsive font scaling that accounts for PixelRatio.getFontScale()
 * but provides a more controlled scaling for small screens.
 */
export const responsiveFontSize = (size: number) => {
  const { width } = Dimensions.get('window');
  
  // Base scale based on screen width
  let scaledSize = size;
  if (width < 400) {
    scaledSize = moderateScale(size, 0.3);
  }
  
  // Note: We don't multiply by getFontScale() here because React Native's Text 
  // component handles it by default. We just adjust the base size for the screen width.
  return scaledSize;
};

export const screenWidth = INITIAL_WIDTH;
export const screenHeight = INITIAL_HEIGHT;

export const isSmallScreen = INITIAL_WIDTH < 360;
export const isNarrowScreen = INITIAL_WIDTH < 380;

/**
 * Hook for reactive screen dimensions
 */
export const useScreenDimensions = () => {
  const [dimensions, setDimensions] = useState({
    window: Dimensions.get('window'),
    screen: Dimensions.get('screen'),
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window, screen }) => {
      setDimensions({ window, screen });
    });
    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions.window;

  return {
    width,
    height,
    scale: (size: number) => (width / DESIGN_WIDTH) * size,
    verticalScale: (size: number) => (height / DESIGN_HEIGHT) * size,
    moderateScale: (size: number, factor = 0.5) => size + ((width / DESIGN_WIDTH) * size - size) * factor,
    isSmallScreen: width < 360,
    isNarrowScreen: width < 380,
  };
};
