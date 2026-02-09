import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';

function CameraView({ onStream }) {
  const webcamRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [facingMode, setFacingMode] = useState('user');

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
        (window.innerWidth <= 428 && window.innerHeight <= 926);
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Guardian Logic: Handle screen orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      // Reset facing mode on orientation change to ensure correct camera
      setFacingMode('user');
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, []);

  // Mobile-optimized video constraints
  const videoConstraints = isMobile
    ? {
        width: { ideal: 720 },
        height: { ideal: 1280 },
        facingMode: facingMode,
        aspectRatio: 9 / 16
      }
    : {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: facingMode
      };

  const handleUserMedia = (stream) => {
    if (onStream) {
      onStream(stream);
    }
  };

  // Mobile-responsive container styles for iPhone 14 Pro (390x844)
  const containerStyles = isMobile
    ? "w-full aspect-[9/19.5] max-h-[60vh] rounded-2xl overflow-hidden"
    : "w-full h-full";

  return (
    <div className={containerStyles}>
      <Webcam
        ref={webcamRef}
        audio={false}
        videoConstraints={videoConstraints}
        onUserMedia={handleUserMedia}
        className="w-full h-full object-cover"
        screenshotFormat="image/jpeg"
      />
    </div>
  );
}

export default CameraView;
