import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

function FaceTracker({ onSmirkDetected }) {
  const videoRef = useRef(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const streamRef = useRef(null);
  const animationRef = useRef(null);


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
  const handleOrientationChange = useCallback(() => {
    if (videoRef.current && streamRef.current) {
      // Recalculate display size on orientation change
      const displaySize = {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight
      };
      // Restart face detection with new dimensions
      if (isVideoReady) {
        startFaceDetection();
      }
    }
  }, [isVideoReady]);

  useEffect(() => {
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, [handleOrientationChange]);

  // Load face-api.js models on component mount
  useEffect(() => {
    async function loadModels() {
      try {
        const MODEL_URL = import.meta.env.BASE_URL + '/models' || '/models';
        
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        
        setIsModelsLoaded(true);
      } catch (err) {
        console.error('Error loading models:', err);
        setError('Failed to load AI models. Please refresh the page.');
      }
    }

    loadModels();

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Initialize webcam when models are loaded
  useEffect(() => {
    if (!isModelsLoaded) return;

    async function initWebcam() {
      try {
        // Guardian Logic: Mobile-optimized camera constraints
        const mobileConstraints = isMobile ? {
          width: { ideal: 720 },
          height: { ideal: 1280 },
          facingMode: 'user'
        } : {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        };

        const stream = await navigator.mediaDevices.getUserMedia({
          video: mobileConstraints,
          audio: false
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          videoRef.current.onloadedmetadata = () => {
            setIsVideoReady(true);
            startFaceDetection();
          };
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
        setError('Failed to access webcam. Please allow camera permissions.');
      }
    }

    initWebcam();
  }, [isModelsLoaded, isMobile]);

  // Start face detection when video is ready
  function startFaceDetection() {
    if (!videoRef.current || !isVideoReady) return;

    const detectFaces = async () => {
      if (!videoRef.current) return;

      try {
        const displaySize = {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight
        };

        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
        ).withFaceExpressions();

        // Process detections here if needed
        if (detections && detections.length > 0) {
          const expressions = detections[0].expressions;
          // Detect smirk (lower threshold for happy expression)
          const isSmirking = expressions.happy > 0.3;
          if (onSmirkDetected) {
            onSmirkDetected(isSmirking);
          }
        }
      } catch (err) {
        console.error('Face detection error:', err);
      }

      // Continue detection loop
      if (videoRef.current && !videoRef.current.paused) {
        animationRef.current = requestAnimationFrame(detectFaces);
      }
    };

    detectFaces();
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-900/20 rounded-3xl border-2 border-red-500/30">
        <div className="text-center p-6">
          <p className="text-red-400 text-lg mb-2">⚠️ Error</p>
          <p className="text-white">{error}</p>
        </div>
      </div>
    );
  }

  // Mobile-responsive container styles for iPhone 14 Pro (390x844)
  const containerStyles = isMobile 
    ? "relative w-full aspect-[9/19.5] max-h-[60vh] bg-black rounded-2xl overflow-hidden shadow-2xl border border-purple-500/20 backdrop-blur-sm"
    : "relative w-full h-full bg-black rounded-3xl overflow-hidden shadow-2xl border border-purple-500/20 backdrop-blur-sm";

  return (
    <div className={containerStyles}>
      {/* Loading Overlay - only visible until models are loaded */}
      {!isModelsLoaded && (
        <div className="absolute inset-0 z-50 bg-gradient-to-br from-purple-900/90 via-pink-900/90 to-red-900/90 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-t-4 border-b-4 border-white mb-4"></div>
          <p className="text-white text-lg md:text-xl font-semibold">Loading AI Models...</p>
          <p className="text-purple-200 text-sm mt-2">Initializing Face Detection</p>
        </div>
      )}

      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${!isModelsLoaded ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Status Badge - responsive positioning for mobile */}
      {isModelsLoaded && (
        <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 md:px-4 md:py-2 rounded-full font-semibold text-xs md:text-sm shadow-lg">
          🦁 Eye of the Beholder
        </div>
      )}

      {/* Model Status Indicator */}
      <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 bg-black/50 backdrop-blur-sm px-2 py-1 md:px-3 md:py-1 rounded-full">
        <div className="flex items-center gap-1 md:gap-2">
          <div className={`w-2 h-2 rounded-full ${isModelsLoaded ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`}></div>
          <span className="text-white text-xs">
            {isModelsLoaded ? 'AI Active' : 'Loading...'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default FaceTracker;
