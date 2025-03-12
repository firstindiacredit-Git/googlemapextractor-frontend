import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Get a unique identifier for the current device
export const getDeviceFingerprint = async () => {
  try {
    const fpPromise = FingerprintJS.load();
    const fp = await fpPromise;
    const result = await fp.get();
    
    return {
      visitorId: result.visitorId,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating device fingerprint:', error);
    
    // Fallback to a basic fingerprint if FingerprintJS fails
    return {
      visitorId: `${navigator.userAgent}-${window.screen.width}x${window.screen.height}`,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString()
    };
  }
};