// src/shared/lib/fileSystem.ts
let RNFS: any = null;
try {
  RNFS = require('react-native-fs');
} catch (e) {
  console.warn('react-native-fs not available:', e);
}

export const safeRNFS = RNFS;
export const isRNFSAvailable = () => RNFS !== null;
