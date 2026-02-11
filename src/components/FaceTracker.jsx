/**
 * FaceTracker Component - Backend API Version
 * 
 * Refactored to use backend emotion recognition API instead of local face-api.js.
 * Captures webcam frames and sends them to the FastAPI backend for analysis.
 * 
 * Responsibilities:
 * - Capture frames from webcam
 * - Send frames to backend API
 * - Handle detection results from backend
 * - Trigger game events (game over, calibration, etc.)
 * - Manage connection state and errors
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useDetectionAPI, CONNECTION_STATE } from '../hooks/useDetectionAPI';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { 
  SMILE_THRESHOLD,
  CONSECUTIVE_FRAMES_REQUIRED,
  FRAME_CAPTURE_INTERVAL,
  CALIBRATION_STABILITY_DURATION,
  CALIBRATION_DETECTION_INTERVAL,
  NEUTRAL_EXPRESSION_THRESHOLD,
  PUNCHLINE_THRESHOLD_REDUCTION,
  PUNCHLINE_WINDOW_DURATION,
  LOW_LIGHT_THRESHOLD,
  BRIGHTNESS_CHECK_INTERVAL
} from '../utils/constants';
import { isCapacitorNative } from '../utils/platform';
import { requestCameraPermission } from '../services/capacitorBridge';
import {
  initErrorTracker,
  trackError,
  trackWebcamError,
  trackDetectionError,
  trackLowConfidence,
  trackCalibrationEvent,
  trackDetectionSuccess,
  trackBrightnessWarning,
  trackBackendConnection
} from '../services/errorTracker';
import WarningBox from './WarningBox';

function FaceTracker({ 
  // Callbacks
  onSmirkDetected,
  onCameraReady,
  onCalibrationUpdate,
  onCalibrationComplete,
  onFaceCenteredUpdate,
  onLowLightWarning,
  onBackendStatusChange,
  onConnectionError,
  
  // Props
  isCalibrating = false,
  calibrationComplete = false,
  currentVideo = null,
  cameraCanvasRef = null,
  userId = 'anonymous'
}) {
  // Refs
  const videoRef = useRef(null);
  const animationRef = useRef(null);
  const canvasRef = useRef(null);
  const captureTimerRef = useRef(null);
  const calibrationTimerRef = useRef(null);
  const punchlineTimerRef = useRef(null);
  const brightnessTimerRef = useRef(null);
  const consecutiveNeutralRef = useRef(0);
  const calibrationStartTimeRef = useRef(null);
  
  // State
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLowLight, setIsLowLight] = useState(false);
  const [backendStatus, setBackendStatus] = useState(CONNECTION_STATE.DISCONNECTED);
  
  // Detection API
  const {
    connectionState,
    isConnected,
    sessionId,
    lastDetection,
    consecutiveSmirkCount,
    error: detectionError,
    errorType,
    isGameOver,
    happinessScore,
    isSmirking,
    createSession,
    connectWebSocket,
    sendFrame,
    disconnect,
    resetSession
  } = useDetectionAPI();
  
  // Haptic feedback
  const { vibrate, isEnabled: hapticEnabled } = useHapticFeedback();

  // ===========================
  // Initialization
  // ===========================
  
  useEffect(() => {
    initErrorTracker({
      isMobile,
      videoWidth: videoRef.current?.videoWidth || 0,
      videoHeight: videoRef.current?.videoHeight || 0,
      backendUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
    });
    
    console.log('[FaceTracker] Backend API initialized');
  }, [isMobile]);
  
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

  // ===========================
  // Backend Connection Status
  // ===========================
  
  useEffect(() => {
    setBackendStatus(connectionState);
    
    // Notify parent of backend status change
    if (onBackendStatusChange) {
      onBackendStatusChange({
        state: connectionState,
        isConnected,
        sessionId,
        error: detectionError
      });
    }
    
    // Track connection events
    trackBackendConnection({
      state: connectionState,
      sessionId,
      error: detectionError
    });
    
    // Handle connection errors
    if (connectionState === CONNECTION_STATE.ERROR && onConnectionError) {
      onConnectionError({
        type: errorType,
        message: detectionError,
        retryable: reconnectAttempts < 3
      });
    }
  }, [connectionState, isConnected, sessionId, detectionError, errorType, onBackendStatusChange, onConnectionError]);

  // ===========================
  // Camera Setup
  // ===========================
  
  // Initialize webcam
  useEffect(() => {
    async function initWebcam() {
      try {
        // If running as a Capacitor native app, request camera permission first
        if (isCapacitorNative()) {
          try {
            const perm = await requestCameraPermission();
            if (!perm.granted) {
              const permErr = new Error('Capacitor camera permission denied');
              trackWebcamError(permErr);
              setError('Camera access denied in app. Please enable camera permissions in your app settings.');
              return;
            }
          } catch (permErr) {
            console.warn('[FaceTracker] Capacitor permission request failed:', permErr);
            trackWebcamError(permErr);
            setError('Failed to request camera permission. Please check app settings.');
            return;
          }
        }
        
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

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          videoRef.current.onloadedmetadata = () => {
            setIsVideoReady(true);
            
            // Create session and connect to backend
            if (!sessionId) {
              initializeBackendConnection();
            }
            
            if (onCameraReady) {
              onCameraReady(true);
            }
          };
        }
      } catch (err) {
        console.error('[FaceTracker] Error accessing webcam:', err);
        trackWebcamError(err);
        
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
  }, [isMobile, sessionId, onCameraReady]);
  
  // ===========================
  // Backend Connection
  // ===========================
  
  const initializeBackendConnection = useCallback(async () => {
    try {
      console.log('[FaceTracker] Initializing backend connection...');
      
      // Create session
      const session = await createSession(userId);
      console.log('[FaceTracker] Session created:', session.session_id);
      
      // Connect WebSocket
      connectWebSocket(session);
      
    } catch (err) {
      console.error('[FaceTracker] Failed to initialize backend:', err);
      trackDetectionError(err, { phase: 'initialization' });
      setError(`Failed to connect to emotion recognition service: ${err.message}`);
    }
  }, [userId, createSession, connectWebSocket]);
  
  // ===========================
  // Frame Capture & Detection
  // ===========================
  
  // Capture frames and send to backend
  const startFrameCapture = useCallback(() => {
    if (!isVideoReady || !isConnected || !videoRef.current) return;
    
    console.log('[FaceTracker] Starting frame capture');
    
    const captureFrame = () => {
      if (!videoRef.current || !isConnected) return;
      
      const video = videoRef.current;
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        captureTimerRef.current = setTimeout(captureFrame, FRAME_CAPTURE_INTERVAL);
        return;
      }
      
      // Create canvas for frame capture
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Use smaller size for bandwidth optimization
      const width = 320;
      const height = 240;
      canvas.width = width;
      canvas.height = height;
      
      // Draw video frame (mirrored)
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -width, 0, width, height);
      ctx.restore();
      
      // Convert to base64 JPEG
      const frameData = canvas.toDataURL('image/jpeg', 0.7);
      
      // Send to backend
      sendFrame(frameData, {
        timestamp: Date.now(),
        qualityCheck: true
      });
      
      // Schedule next capture
      captureTimerRef.current = setTimeout(captureFrame, FRAME_CAPTURE_INTERVAL);
    };
    
    captureFrame();
  }, [isVideoReady, isConnected, sendFrame]);
  
  // Stop frame capture
  const stopFrameCapture = useCallback(() => {
    if (captureTimerRef.current) {
      clearTimeout(captureTimerRef.current);
      captureTimerRef.current = null;
    }
  }, []);
  
  // Start/stop capture based on connection state
  useEffect(() => {
    if (isConnected && isVideoReady) {
      startFrameCapture();
    } else {
      stopFrameCapture();
    }
    
    return () => stopFrameCapture();
  }, [isConnected, isVideoReady, startFrameCapture, stopFrameCapture]);

  // ===========================
  // Detection Results Handling
  // ===========================
  
  // Handle smirk detection
  useEffect(() => {
    if (lastDetection) {
      // Track successful detection
      if (lastDetection.status === 'success') {
        trackDetectionSuccess({
          processingTime: lastDetection.processing_time_ms,
          confidence: lastDetection.face_data?.confidence
        });
      }
      
      // Notify parent of smirk detection
      if (onSmirkDetected && lastDetection.is_smirk !== undefined) {
        onSmirkDetected(lastDetection.is_smirk, lastDetection.happiness || 0, {
          consecutiveFrames: consecutiveSmirkCount,
          requiredFrames: CONSECUTIVE_FRAMES_REQUIRED,
          gameOver: isGameOver
        });
      }
      
      // Trigger haptic feedback on game over
      if (isGameOver && hapticEnabled) {
        vibrate([100, 50, 100]);
      }
    }
  }, [lastDetection, consecutiveSmirkCount, isGameOver, onSmirkDetected, hapticEnabled, vibrate]);

  // ===========================
  // Calibration
  // ===========================
  
  // Calibration logic
  useEffect(() => {
    if (!isCalibrating || !lastDetection) return;
    
    const checkCalibration = () => {
      if (!lastDetection.face_detected) {
        consecutiveNeutralRef.current = 0;
        if (onCalibrationUpdate) {
          onCalibrationUpdate({ 
            status: 'no_face', 
            progress: 0,
            message: 'Face not detected'
          });
        }
        return;
      }
      
      const happiness = lastDetection.happiness || 0;
      
      // Check if expression is neutral (happiness < 0.15)
      if (happiness < NEUTRAL_EXPRESSION_THRESHOLD) {
        consecutiveNeutralRef.current += 1;
      } else {
        consecutiveNeutralRef.current = 0;
      }
      
      // Calculate progress (need 3 seconds of stable detection)
      const requiredFrames = CALIBRATION_STABILITY_DURATION / CALIBRATION_DETECTION_INTERVAL;
      const progress = Math.min(consecutiveNeutralRef.current / requiredFrames, 1);
      
      if (onCalibrationUpdate) {
        onCalibrationUpdate({
          status: progress >= 1 ? 'complete' : 'calibrating',
          progress,
          happiness,
          message: progress >= 1 ? 'Calibration complete!' : `Hold steady... ${Math.round(progress * 100)}%`
        });
      }
      
      // Complete calibration
      if (progress >= 1 && !calibrationStartTimeRef.current) {
        calibrationStartTimeRef.current = Date.now();
      }
      
      if (progress >= 1) {
        trackCalibrationEvent({ 
          duration: Date.now() - calibrationStartTimeRef.current,
          success: true 
        });
        
        if (onCalibrationComplete) {
          onCalibrationComplete({
            success: true,
            baselineHappiness: happiness,
            personalizedThreshold: SMILE_THRESHOLD
          });
        }
        
        // Stop calibration timer
        if (calibrationTimerRef.current) {
          clearInterval(calibrationTimerRef.current);
        }
      }
    };
    
    // Start calibration check
    calibrationTimerRef.current = setInterval(checkCalibration, CALIBRATION_DETECTION_INTERVAL);
    
    return () => {
      if (calibrationTimerRef.current) {
        clearInterval(calibrationTimerRef.current);
      }
    };
  }, [isCalibrating, lastDetection, onCalibrationUpdate, onCalibrationComplete]);

  // ===========================
  // Punchline Detection
  // ===========================
  
  useEffect(() => {
    if (!currentVideo?.punchlineTimestamp) return;
    
    const checkPunchlineTime = () => {
      if (!videoRef.current) return;
      
      const currentTime = videoRef.current.currentTime;
      const punchlineTime = currentVideo.punchlineTimestamp;
      
      if (currentTime >= punchlineTime && currentTime < punchlineTime + 0.5) {
        console.log('[FaceTracker] Punchline reached - increasing sensitivity by 20%');
        
        if (onSmirkDetected) {
          // Temporarily lower threshold
          onSmirkDetected(false, happinessScore, {
            punchlineActive: true,
            effectiveThreshold: SMILE_THRESHOLD * (1 - PUNCHLINE_THRESHOLD_REDUCTION)
          });
        }
        
        // Set timer to reset sensitivity
        if (punchlineTimerRef.current) {
          clearTimeout(punchlineTimerRef.current);
        }
        
        punchlineTimerRef.current = setTimeout(() => {
          console.log('[FaceTracker] Punchline window ended - sensitivity reset');
          if (onSmirkDetected) {
            onSmirkDetected(false, happinessScore, {
              punchlineActive: false,
              effectiveThreshold: SMILE_THRESHOLD
            });
          }
        }, PUNCHLINE_WINDOW_DURATION);
      }
    };
    
    // Check during video playback
    const video = videoRef.current;
    if (video) {
      video.addEventListener('timeupdate', checkPunchlineTime);
    }
    
    return () => {
      if (video) {
        video.removeEventListener('timeupdate', checkPunchlineTime);
      }
      if (punchlineTimerRef.current) {
        clearTimeout(punchlineTimerRef.current);
      }
    };
  }, [currentVideo, happinessScore, onSmirkDetected]);

  // ===========================
  // Low-Light Detection
  // ===========================
  
  const calculateFrameBrightness = useCallback(() => {
    if (!videoRef.current) return null;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const sampleWidth = 64;
    const sampleHeight = 48;
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;
    
    ctx.drawImage(video, 0, 0, sampleWidth, sampleHeight);
    
    const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
    const data = imageData.data;
    
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      totalBrightness += luminance;
    }
    
    return totalBrightness / (data.length / 4);
  }, []);
  
  useEffect(() => {
    if (!isVideoReady) return;
    
    const checkBrightness = () => {
      const brightness = calculateFrameBrightness();
      
      if (brightness !== null) {
        const isLow = brightness < LOW_LIGHT_THRESHOLD;
        setIsLowLight(isLow);
        
        if (isLow) {
          trackBrightnessWarning(brightness, LOW_LIGHT_THRESHOLD);
        }
        
        if (onLowLightWarning) {
          onLowLightWarning(isLow);
        }
      }
    };
    
    checkBrightness();
    brightnessTimerRef.current = setInterval(checkBrightness, BRIGHTNESS_CHECK_INTERVAL);
    
    return () => {
      if (brightnessTimerRef.current) {
        clearInterval(brightnessTimerRef.current);
      }
    };
  }, [isVideoReady, calculateFrameBrightness, onLowLightWarning]);

  // ===========================
  // Camera Preview
  // ===========================
  
  // Draw camera feed to canvas for fullscreen display
  useEffect(() => {
    if (!isVideoReady || !cameraCanvasRef?.current || !videoRef?.current) return;

    const canvas = cameraCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const video = videoRef.current;
    let animId;

    const drawCameraFrame = () => {
      if (canvas && ctx && video && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Mirror the video horizontally
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0);
        ctx.scale(-1, 1);
      }
      animId = requestAnimationFrame(drawCameraFrame);
    };

    drawCameraFrame();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isVideoReady, cameraCanvasRef]);

  // ===========================
  // Cleanup
  // ===========================
  
  useEffect(() => {
    return () => {
      // Cleanup all timers
      if (captureTimerRef.current) clearTimeout(captureTimerRef.current);
      if (calibrationTimerRef.current) clearInterval(calibrationTimerRef.current);
      if (punchlineTimerRef.current) clearTimeout(punchlineTimerRef.current);
      if (brightnessTimerRef.current) clearInterval(brightnessTimerRef.current);
      
      // Stop video stream
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      
      // Disconnect from backend
      disconnect();
    };
  }, [disconnect]);

  // ===========================
  // Render
  // ===========================
  
  // Error display
  if (error) {
    return (
      <WarningBox
        type="error"
        title="Camera Error"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }
  
  // Backend connection error
  if (connectionState === CONNECTION_STATE.ERROR && !isVideoReady) {
    return (
      <WarningBox
        type="warning"
        title="Backend Connection Error"
        message="Could not connect to emotion recognition service. Please check your internet connection and refresh."
        onRetry={() => initializeBackendConnection()}
      />
    );
  }

  return (
    <div className="face-tracker">
      {/* Hidden video element for frame capture */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
      />
      
      {/* Low light warning overlay */}
      {isLowLight && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <WarningBox
            type="warning"
            title="Low Light"
            message="Please increase lighting for better detection"
            onDismiss={() => setIsLowLight(false)}
          />
        </div>
      )}
      
      {/* Backend connection status indicator (debug) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50 bg-black/50 px-2 py-1 rounded text-xs text-white">
          Backend: {connectionState}
          {sessionId && <span className="ml-2">Session: {sessionId.slice(0, 8)}...</span>}
          {lastDetection && (
            <span className="ml-2">
              Happy: {(lastDetection.happiness || 0).toFixed(2)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default FaceTracker;
