import { useCallback } from 'react';

export function useMediaStream() {
  const startMedia = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      const error = new Error('getUserMedia is not supported in this browser or requires HTTPS');
      alert('Camera/Mic access is not available. Please use HTTPS or localhost.');
      throw error;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      return stream;
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        alert('Camera/Mic access denied. Please allow permissions and refresh.');
      } else if (err.name === 'NotFoundError') {
        alert('No camera/microphone found. Please connect a device.');
      } else {
        alert('Failed to access camera/microphone: ' + err.message);
      }
      throw err;
    }
  }, []);

  return { startMedia };
}

