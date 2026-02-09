import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { SMILE_THRESHOLD } from '../utils/constants';

// Face API expression names (face-api labels "happy" for smile/smirk detection)
// We use this for smirk detection in the game
const SMILE_EXPRESSION = 'happy';

// Calibration constants
const CALIBRATION_STABILITY_DURATION = 3000; // 3 seconds stable detection
const CALIBRATION_DETECTION_INTERVAL = 100; // Check every 100ms
const NEUTRAL_EXPRESSION_THRESHOLD = 0.15; // Happiness below 15% considered neutral

// Punchline detection constants
const PUNCHLINE_THRESHOLD_REDUCTION = 0.2; // 20% reduction
const PUNCHLINE_WINDOW_DURATION = 3000; // 3 seconds window

// ========== DETECTION OPTIMIZATION CONSTANTS ==========
const DETECTION_FRAME_SKIP = 2; // Skip N frames between detections (every 3rd frame)
const DETECTION_MIN_INTERVAL = 100; // Minimum ms between detections
const SMIRK_CONFIDENCE_THRESHOLD = 0.85; // Higher threshold to reduce false positives
const SMIRK_DEBOUNCE_COUNT = 3; // Require N consecutive detections before triggering

function FaceTracker({ 
  onSmirkDetected, 
  onCameraReady,
  onCalibrationUpdate,
  onCalibrationComplete,
  isCalibrating = false,
  calibrationComplete = false,
  currentVideo = null
}) {
  const videoRef = useRef(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [smirkProbability, setSmirkProbability] = useState(0);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  
  // Calibration tracking refs
  const calibrationStartRef = useRef(null);
  const lastStableTimeRef = useRef(null);
  const calibrationTimerRef = useRef(null);
  
  // Punchline detection refs
  const punchlineWindowRef = useRef(false);
  const punchlineTimerRef = useRef(null);
  const lastPunchlineProcessedRef = useRef(null);
  
  // ========== OPTIMIZATION REFS ==========
  const frameCountRef = useRef(0); // Frame counter for throttling
  const lastDetectionTimeRef = useRef(0); // Last detection timestamp
  const smirkConsecutiveCountRef = useRef(0); // Consecutive smirk detections
  const lastSmirkStateRef = useRef(false); // Previous smirk state to detect changes
  const isSmirkingRef = useRef(false); // Debounced smirk state (ref for performance)
  
  // Use haptic feedback hook
  const { vibrate, isEnabled: hapticEnabled } = useHapticFeedback();


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
        const MODEL_URL = (import.meta.env?.BASE_URL || '') + '/models' || '/models';
        
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
      // Cleanup calibration timer
      if (calibrationTimerRef.current) {
        clearTimeout(calibrationTimerRef.current);
      }
      // Cleanup punchline timer
      if (punchlineTimerRef.current) {
        clearTimeout(punchlineTimerRef.current);
      }
    };
  }, []);

  // Punchline detection: Monitor video playback time and trigger sensitivity boost
  useEffect(() => {
    if (!currentVideo || !currentVideo.punchlineTimestamp) return;

    const checkPunchlineTime = () => {
      if (!videoRef.current) return;

      const currentTime = videoRef.current.currentTime;
      const punchlineTime = currentVideo.punchlineTimestamp;

      // Check if we've reached the punchline timestamp (with 500ms buffer)
      if (currentTime >= punchlineTime && currentTime < punchlineTime + 0.5) {
        // Only trigger if not already in punchline window and not recently triggered
        const now = Date.now();
        if (!punchlineWindowRef.current && 
            (!lastPunchlineProcessedRef.current || now - lastPunchlineProcessedRef.current > 4000)) {
          
          // Enter punchline window - increase sensitivity by 20% (reduce threshold from 0.3 to 0.24)
          punchlineWindowRef.current = true;
          lastPunchlineProcessedRef.current = now;
          
          console.log('🎯 Punchline reached - increasing happiness sensitivity by 20%');
          
          // Set timer to exit punchline window after 3 seconds
          if (punchlineTimerRef.current) {
            clearTimeout(punchlineTimerRef.current);
          }
          
          punchlineTimerRef.current = setTimeout(() => {
            punchlineWindowRef.current = false;
            console.log('🔄 Punchline window ended - sensitivity reset');
          }, PUNCHLINE_WINDOW_DURATION);
        }
      }
    };

    // Use requestAnimationFrame to continuously check video time during playback
    let animationId;
    const checkLoop = () => {
      checkPunchlineTime();
      if (videoRef.current && !videoRef.current.paused) {
        animationId = requestAnimationFrame(checkLoop);
      }
    };

    // Start checking when video is ready and playing
    if (videoRef.current && !videoRef.current.paused) {
      animationId = requestAnimationFrame(checkLoop);
    }

    // Also listen for timeupdate events as backup
    const handleTimeUpdate = () => checkPunchlineTime();
    if (videoRef.current) {
      videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (punchlineTimerRef.current) {
        clearTimeout(punchlineTimerRef.current);
      }
      if (videoRef.current) {
        videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
  }, [currentVideo]);

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
            // Notify parent that camera is ready
            if (onCameraReady) {
              onCameraReady(true);
            }
          };
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
        // Provide specific error messages based on error type
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Camera access denied. Please enable camera permissions in your browser settings and reload.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No camera found. Please connect a camera and reload.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError('Camera is in use by another application. Please close other apps using the camera.');
        } else if (err.name === 'OverconstrainedError') {
          setError('Camera does not support the required settings. Please try a different camera.');
        } else {
          setError(`Failed to access webcam: ${err.message || 'Unknown error'}`);
        }
      }
    }

    initWebcam();
  }, [isModelsLoaded, isMobile]);

  // Start face detection when video is ready
  const startFaceDetection = useCallback(() => {
    if (!videoRef.current || !isVideoReady) return;
    
    // Reset optimization refs on new detection session
    frameCountRef.current = 0;
    lastDetectionTimeRef.current = 0;
    smirkConsecutiveCountRef.current = 0;
    isSmirkingRef.current = false;

    const detectFaces = async () => {
      if (!videoRef.current) return;
      
      const now = Date.now();
      
      // ========== OPTIMIZATION 1: Frame Throttling ==========
      // Skip frames to reduce CPU usage
      frameCountRef.current += 1;
      if (frameCountRef.current <= DETECTION_FRAME_SKIP) {
        // Skip this frame, continue loop
        if (videoRef.current && !videoRef.current.paused && animationRef.current) {
          animationRef.current = requestAnimationFrame(detectFaces);
        }
        return;
      }
      
      // ========== OPTIMIZATION 2: Time-Based Throttling ==========
      // Only run detection if enough time has passed
      if (now - lastDetectionTimeRef.current < DETECTION_MIN_INTERVAL) {
        // Reset frame count to try again soon
        frameCountRef.current = 0;
        if (videoRef.current && !videoRef.current.paused && animationRef.current) {
          animationRef.current = requestAnimationFrame(detectFaces);
        }
        return;
      }
      
      // Update last detection time
      lastDetectionTimeRef.current = now;
      frameCountRef.current = 0;

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
          // Face-api uses "happy" for smile/smirk detection (always lowercase)
          // Use safe access pattern to handle any case variations
          const probability = expressions.happy ?? expressions.Happy ?? expressions['happy'] ?? 0;
          const isNeutral = probability < NEUTRAL_EXPRESSION_THRESHOLD;
          const detection = detections[0];
          
          // ========== OPTIMIZATION 3: Higher Confidence Threshold ==========
          // Only consider smirk if confidence exceeds higher threshold
          const highConfidenceSmirk = probability >= SMIRK_CONFIDENCE_THRESHOLD;
          
          // ========== OPTIMIZATION 4: Debouncing ==========
          // Require multiple consecutive detections before triggering
          // Use dynamic threshold (lower during punchline window)
          const baseThreshold = SMILE_THRESHOLD;
          const isInPunchlineWindow = punchlineWindowRef.current;
          const currentThreshold = isInPunchlineWindow 
            ? baseThreshold * (1 - PUNCHLINE_THRESHOLD_REDUCTION) 
            : baseThreshold;
          
          const aboveDynamicThreshold = probability > currentThreshold;
          
          // Update consecutive count based on dynamic threshold
          if (aboveDynamicThreshold) {
            smirkConsecutiveCountRef.current += 1;
          } else {
            smirkConsecutiveCountRef.current = 0;
          }
          
          // Only trigger if we have consecutive detections AND high confidence
          const isSmirking = highConfidenceSmirk && 
                            (smirkConsecutiveCountRef.current >= SMIRK_DEBOUNCE_COUNT || isInPunchlineWindow);
          
          // Update the ref for next iteration
          isSmirkingRef.current = isSmirking;
          
          // Only update state and trigger callbacks when state changes
          const smirkStateChanged = isSmirking !== lastSmirkStateRef.current;
          lastSmirkStateRef.current = isSmirking;
          
          // Batch state updates to reduce re-renders
          if (smirkStateChanged || probability !== smirkProbability) {
            // Use functional update to batch smirkProbability updates
            setSmirkProbability(prev => {
              // Only update if probability changed significantly (performance optimization)
              if (Math.abs(prev - probability) > 0.01) {
                return probability;
              }
              return prev;
            });
          }
          
          // ========== CALIBRATION PHASE LOGIC ==========
          if (isCalibrating && !calibrationComplete && onCalibrationUpdate) {
            const now = Date.now();
            
            // Check if expression is neutral (no smile)
            if (isNeutral) {
              // Initialize calibration start time on first neutral detection
              if (!calibrationStartRef.current) {
                calibrationStartRef.current = now;
              }
              
              // Check if we've been stable for 3 seconds
              const elapsedStable = now - calibrationStartRef.current;
              const progress = Math.min((elapsedStable / CALIBRATION_STABILITY_DURATION) * 100, 100);
              
              // Send calibration update
              onCalibrationUpdate({
                faceDetected: true,
                isNeutral: true,
                isStable: elapsedStable >= CALIBRATION_STABILITY_DURATION,
                progress: progress,
                elapsed: elapsedStable
              });
              
              // Check for calibration completion
              if (elapsedStable >= CALIBRATION_STABILITY_DURATION) {
                // Clear any existing timer
                if (calibrationTimerRef.current) {
                  clearTimeout(calibrationTimerRef.current);
                  calibrationTimerRef.current = null;
                }
                
                // Mark calibration complete
                if (onCalibrationComplete) {
                  onCalibrationComplete(true);
                }
                
                // Reset calibration refs
                calibrationStartRef.current = null;
              }
            } else {
              // Expression not neutral - reset calibration
              calibrationStartRef.current = null;
              
              onCalibrationUpdate({
                faceDetected: true,
                isNeutral: false,
                isStable: false,
                progress: 0,
                elapsed: 0
              });
            }
          }
          // ===========================================
          
          // Guardian Logic: Trigger haptic feedback on smirk detection
          // Only trigger when state changes to reduce unnecessary vibrations
          if (isSmirking && smirkStateChanged && isMobile && hapticEnabled) {
            vibrate();
          }
          
          // Only trigger callback on state change to reduce redundant calls
          if (onSmirkDetected && smirkStateChanged) {
            onSmirkDetected(isSmirking, probability, isInPunchlineWindow);
          }
        } else {
          // No face detected - reset debounce counter
          smirkConsecutiveCountRef.current = 0;
          
          // ========== CALIBRATION PHASE LOGIC ==========
          if (isCalibrating && !calibrationComplete && onCalibrationUpdate) {
            // Reset calibration on no face detected
            calibrationStartRef.current = null;
            
            onCalibrationUpdate({
              faceDetected: false,
              isNeutral: false,
              isStable: false,
              progress: 0,
              elapsed: 0
            });
          }
          // ===========================================
        }
      } catch (err) {
        console.error('Face detection error:', err);
        // Stop animation loop on error to prevent infinite error loop
        return;
      }

      // Continue detection loop only if video is still valid
      if (videoRef.current && !videoRef.current.paused && animationRef.current) {
        animationRef.current = requestAnimationFrame(detectFaces);
      }
    };

    detectFaces();
  }, [isVideoReady, isCalibrating, calibrationComplete, onCalibrationUpdate, onCalibrationComplete, onSmirkDetected, isMobile, hapticEnabled]);

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

      {/* Smirk Probability Display */}
      {isModelsLoaded && (
        <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-black/50 backdrop-blur-sm px-3 py-1 md:px-3 md:py-1 rounded-full">
          <span className="text-white text-xs font-medium">
            Smirk Probability: {(smirkProbability * 100).toFixed(1)}%
          </span>
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
