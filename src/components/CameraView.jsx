import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';

function CameraView({ onStream }) {
  const webcamRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [isSecureContext, setIsSecureContext] = useState(false);

  // Check if we're in a secure context
  useEffect(() => {
    setIsSecureContext(window.isSecureContext);
  }, []);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile =
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
        (window.innerWidth <= 428 && window.innerHeight <= 926);
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Request camera permission explicitly using getUserMedia
  const requestCameraPermission = useCallback(async () => {
    try {
      setPermissionError(null);

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      setPermissionGranted(true);
      setPermissionError(null);

      // Pass the stream to parent
      if (onStream) {
        onStream(stream);
      }
    } catch (err) {
      console.error('Camera permission error:', err);

      // Provide more helpful error messages
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError(
          'Camera permission denied. Please allow camera access in your browser settings.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionError('No camera found. Please connect a camera and try again.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setPermissionError('Camera is already in use by another app.');
      } else if (!window.isSecureContext) {
        setPermissionError(
          'Camera access requires HTTPS. Please use localhost or deploy with HTTPS.'
        );
      } else {
        setPermissionError(`Camera error: ${err.message || 'Unknown error'}`);
      }
    }
  }, [onStream]);

  // Handle screen orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      setFacingMode('user');
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, []);

  // Video constraints
  const videoConstraints = {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: facingMode,
  };

  const handleUserMedia = (stream) => {
    setPermissionGranted(true);
    setPermissionError(null);
    if (onStream) {
      onStream(stream);
    }
  };

  const handleUserMediaError = (err) => {
    console.error('Camera error:', err);
    setPermissionError('Unable to access camera. Please check your permissions.');
  };

  // Mobile-responsive container styles
  const containerStyles = isMobile
    ? 'w-full aspect-[9/19.5] max-h-[60vh] rounded-2xl overflow-hidden'
    : 'w-full h-full';

  return (
    <div className={containerStyles}>
      {!isSecureContext && !permissionGranted && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/80 rounded-3xl p-4">
          <p className="text-yellow-400 mb-4 text-center">⚠️ Camera requires HTTPS or localhost</p>
          <p className="text-gray-400 text-sm text-center mb-4">
            Current: {window.location.protocol}//{window.location.host}
          </p>
        </div>
      )}

      {!permissionGranted && !permissionError && isSecureContext && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/80 rounded-3xl p-4">
          <p className="text-gray-400 mb-4 text-center">Camera access required</p>
          <button
            onClick={requestCameraPermission}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Enable Camera
          </button>
        </div>
      )}

      {permissionError && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/80 rounded-3xl p-4">
          <p className="text-red-400 mb-4 text-center">{permissionError}</p>
          <button
            onClick={requestCameraPermission}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      )}

      {(permissionGranted || (!permissionError && isSecureContext)) && (
        <Webcam
          ref={webcamRef}
          audio={false}
          videoConstraints={videoConstraints}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
          className="w-full h-full object-cover scale-x-[-1]"
          screenshotFormat="image/jpeg"
        />
      )}
    </div>
  );
}

export default CameraView;
