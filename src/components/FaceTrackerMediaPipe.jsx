/**
 * FaceTracker Component - MediaPipe Client-Side Version
 *
 * Refactored to use MediaPipe Tasks running entirely on the client.
 * No backend ML dependencies - all inference runs in the browser.
 *
 * Responsibilities:
 * - Capture frames from webcam
 * - Send frames to MediaPipe worker for real-time detection
 * - Handle detection results locally
 * - Trigger game events (game over, calibration, etc.)
 * - Manage worker state and errors
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useMediaPipe } from '../hooks/useMediaPipe';
import {
  useGuardianLogic,
  SMIRK_THRESHOLD,
  NEUTRAL_EXPRESSION_THRESHOLD,
} from '../hooks/useGuardianLogic';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import {
  MEDIAPIPE_TARGET_FPS,
  MEDIAPIPE_FRAME_SKIP,
  CALIBRATION_STABILITY_DURATION,
  PUNCHLINE_THRESHOLD_REDUCTION,
  PUNCHLINE_WINDOW_DURATION,
  LOW_LIGHT_THRESHOLD,
  BRIGHTNESS_CHECK_INTERVAL,
} from '../utils/constants';
import { isCapacitorNative } from '../utils/platform';
import { requestCameraPermission } from '../services/capacitorBridge';
import {
  initErrorTracker,
  trackError,
  trackWebcamError,
  trackDetectionError,
  trackCalibrationEvent,
  trackDetectionSuccess,
} from '../services/errorTracker';
import { CPUFallbackNotification } from './CPUFallbackNotification';
import WarningBox from './WarningBox';

function FaceTrackerMediaPipe({
  // Callbacks
  onSmirkDetected,
  onCameraReady,
  onCalibrationUpdate,
  onCalibrationComplete,
  onFaceCenteredUpdate,
  onLowLightWarning,
  onModelStatusChange,
  onConnectionError,
  onEyesOpenChange,

  // Props
  isCalibrating = false,
  calibrationComplete = false,
  currentVideo = null,
  cameraCanvasRef = null,
  userId = 'anonymous',
}) {
  // Refs
  const videoRef = useRef(null);
  const animationRef = useRef(null);
  const canvasRef = useRef(null);
  const punchlineTimerRef = useRef(null);
  const brightnessTimerRef = useRef(null);
  const streamRef = useRef(null); // Track webcam stream for cleanup
  const resetRef = useRef(null); // Store reset function for cleanup
  const resetGuardianRef = useRef(null); // Store resetGuardian function for cleanup

  // State
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLowLight, setIsLowLight] = useState(false);
  const [showCPUFallback, setShowCPUFallback] = useState(false);
  const [punchlineActive, setPunchlineActive] = useState(false);

  // MediaPipe hook
  const {
    isInitialized,
    isLoading,
    modelsLoaded,
    loadingStage,
    loadingProgress,
    gpuEnabled,
    cpuFallback,
    error: mpError,
    lastResult,
    performance,
    initialize,
    detect,
    setGPU,
    reset,
    setCameraReady,
    setFirstFrameReceived,
    setDetectionReady,
    setCameraStatus,
  } = useMediaPipe({
    onDetection: handleDetection,
    onError: handleDetectionError,
    onCPUFallback: handleCPUFallback,
  });

  // Store reset function in ref for cleanup
  useEffect(() => {
    resetRef.current = reset;
  }, [reset]);

  // Guardian Logic hook
  const {
    state: guardianState,
    processDetection,
    startCalibration,
    reset: resetGuardian,
    restart: restartGuardian,
    isPlaying,
    isCalibrating: guardianIsCalibrating,
    isGameOver: guardianIsGameOver,
  } = useGuardianLogic({
    onCalibrationComplete: handleCalibrationComplete,
    onGameOver: handleGameOver,
    onSmirkWarning: handleSmirkWarning,
    onFaceNotDetected: handleFaceNotDetected,
    onEyesClosed: handleEyesClosed,
  });

  // Store resetGuardian function in ref for cleanup
  useEffect(() => {
    resetGuardianRef.current = resetGuardian;
  }, [resetGuardian]);

  // Haptic feedback
  const { vibrate, isEnabled: hapticEnabled } = useHapticFeedback();

  // Frame processing state
  const frameCountRef = useRef(0);
  const lastProcessTimeRef = useRef(0);

  // ===========================
  // Initialization
  // ===========================

  useEffect(() => {
    initErrorTracker({
      isMobile,
      videoWidth: videoRef.current?.videoWidth || 0,
      videoHeight: videoRef.current?.videoHeight || 0,
      mode: 'mediapipe',
    });
  }, [isMobile]);

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

  // ===========================
  // CPU Fallback Handler
  // ===========================

  function handleCPUFallback(enabled) {
    setShowCPUFallback(enabled);

    if (onModelStatusChange) {
      onModelStatusChange({
        isInitialized: isInitialized,
        modelsLoaded: modelsLoaded,
        isLoading: isLoading,
        loadingStage: loadingStage,
        loadingProgress: loadingProgress,
        gpuEnabled: gpuEnabled,
        cpuFallback: enabled,
        error: mpError,
      });
    }
  }

  // ===========================
  // Camera Setup - Unified Camera Readiness
  // ===========================

  // Initialize webcam with unified camera readiness
  // cameraReady = stream.active AND first frame received AND no errors
  useEffect(() => {
    async function initWebcam() {
      try {
        // If running as a Capacitor native app, request camera permission first
        if (isCapacitorNative()) {
          try {
            const perm = await requestCameraPermission();
            if (!perm.granted) {
              const permErr = new Error('Camera permission denied');
              trackWebcamError(permErr);
              setCameraStatus('error');
              setCameraReady(false, 'Camera access denied in app settings');
              setError(
                'Camera access denied in app. Please enable camera permissions in your app settings.'
              );
              return;
            }
          } catch (permErr) {
            if (import.meta.env.DEV) {
              console.warn('[FaceTracker] Capacitor permission request failed:', permErr);
            }
            trackWebcamError(permErr);
            setCameraStatus('error');
            setCameraReady(false, 'Failed to request camera permission');
            setError('Failed to request camera permission. Please check app settings.');
            return;
          }
        }

        // Mobile-optimized camera constraints
        const mobileConstraints = isMobile
          ? {
              width: { ideal: 720 },
              height: { ideal: 1280 },
              facingMode: 'user',
            }
          : {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user',
            };

        const stream = await navigator.mediaDevices.getUserMedia({
          video: mobileConstraints,
          audio: false,
        });

        // Store stream reference for cleanup
        streamRef.current = stream;

        // Condition 1: Stream is active
        if (stream.active) {
          setCameraStatus('active');
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Condition 2: Wait for first frame (video.onloadeddata)
          videoRef.current.onloadeddata = () => {
            setFirstFrameReceived(true);

            // Condition 3: No errors occurred - set cameraReady = true
            setCameraReady(true);

            // Notify parent
            if (onCameraReady) {
              onCameraReady(true);
            }
          };

          // Also handle oncanplay for robustness
          videoRef.current.oncanplay = () => {
            if (videoRef.current && videoRef.current.readyState >= 3) {
              setFirstFrameReceived(true);
              setCameraReady(true);
            }
          };

          // Initialize MediaPipe after video is ready
          videoRef.current.onloadedmetadata = () => {
            setIsVideoReady(true);
            initialize();
          };
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[FaceTracker] Error accessing webcam:', err);
        }
        trackWebcamError(err);

        // Condition 3: Handle errors
        let errorMessage = `Camera error: ${err.message || 'Unknown error'}`;

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = 'Camera permission denied. Please enable camera permissions.';
          setCameraStatus('error');
          setCameraReady(false, errorMessage);
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = 'No camera found. Please connect a camera.';
          setCameraStatus('error');
          setCameraReady(false, errorMessage);
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage = 'Camera is in use by another application.';
          setCameraStatus('error');
          setCameraReady(false, errorMessage);
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'Camera does not support required settings.';
          setCameraStatus('error');
          setCameraReady(false, errorMessage);
        } else if (err.name === 'AbortError') {
          errorMessage = 'Camera access was interrupted.';
          setCameraStatus('error');
          setCameraReady(false, errorMessage);
        } else {
          setCameraStatus('error');
          setCameraReady(false, errorMessage);
        }

        setError(errorMessage);
      }
    }

    initWebcam();
  }, [isMobile, initialize, onCameraReady, setCameraReady, setFirstFrameReceived, setCameraStatus]);

  // ===========================
  // Frame Processing Loop
  // ===========================

  // Process video frames using requestAnimationFrame
  useEffect(() => {
    if (!isVideoReady || !isInitialized || !videoRef.current) return;

    const processFrame = (timestamp) => {
      const video = videoRef.current;

      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Throttle processing based on target FPS
      const interval = 1000 / MEDIAPIPE_TARGET_FPS;
      const elapsed = timestamp - lastProcessTimeRef.current;

      // Frame skipping for performance
      frameCountRef.current++;
      if (frameCountRef.current % MEDIAPIPE_FRAME_SKIP !== 0) {
        animationRef.current = requestAnimationFrame(processFrame);
        return;
      }

      if (elapsed >= interval) {
        lastProcessTimeRef.current = timestamp;

        // Create ImageBitmap from video frame
        createImageBitmap(video)
          .then((bitmap) => {
            detect(bitmap);
          })
          .catch((err) => {
            if (import.meta.env.DEV) {
              console.error('[FaceTracker] Error creating ImageBitmap:', err);
            }
          });
      }

      animationRef.current = requestAnimationFrame(processFrame);
    };

    animationRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVideoReady, isInitialized, detect]);

  // ===========================
  // Detection Result Handler
  // ===========================

  // Refs for tracking states that need persistence
  const detectionReadyRef = useRef(false);

  /**
   * Handle detection results from MediaPipe worker
   */
  function handleDetection(result, perf) {
    // Set detectionReady on first valid detection
    if (!detectionReadyRef.current && result.faceDetected) {
      detectionReadyRef.current = true;
      setDetectionReady(true);
    }

    // Track detection success with null checks for performance metrics
    if (perf) {
      trackDetectionSuccess({
        processingTime: perf.latency ?? 0,
        fps: perf.fps ?? 0,
        confidence: result.faceConfidence ?? 0,
      });
    }

    // Process through Guardian Logic
    processDetection(result);

    // Notify parent of smirk detection
    if (onSmirkDetected && result.isSmirking !== undefined) {
      const effectiveThreshold = punchlineActive
        ? SMIRK_THRESHOLD * (1 - PUNCHLINE_THRESHOLD_REDUCTION)
        : SMIRK_THRESHOLD;

      const adjustedHappiness = punchlineActive
        ? result.happinessScore / (1 - PUNCHLINE_THRESHOLD_REDUCTION)
        : result.happinessScore;

      onSmirkDetected(result.isSmirking, result.happinessScore, {
        consecutiveFrames: guardianState.consecutiveSmirkFrames,
        requiredFrames: 3,
        gameOver: guardianIsGameOver,
        inWarningZone: guardianState.warningZoneFrames > 0,
        punchlineActive,
        effectiveThreshold,
      });
    }

    // Notify parent of eyes open state
    if (onEyesOpenChange) {
      onEyesOpenChange(result.eyesOpen);
    }

    // Notify parent of face centered state
    if (onFaceCenteredUpdate) {
      onFaceCenteredUpdate(result.faceCentered);
    }
  }

  // ===========================
  // Error Handler
  // ===========================

  function handleDetectionError(errorMessage) {
    if (import.meta.env.DEV) {
      console.error('[FaceTracker] Detection error:', errorMessage);
    }
    trackDetectionError(new Error(errorMessage), { phase: 'detection' });

    if (onConnectionError) {
      onConnectionError({
        type: 'DETECTION_ERROR',
        message: errorMessage,
        retryable: true,
      });
    }
  }

  // ===========================
  // Guardian Logic Callbacks
  // ===========================

  function handleCalibrationComplete() {
    trackCalibrationEvent({ success: true, duration: CALIBRATION_STABILITY_DURATION });

    if (onCalibrationComplete) {
      onCalibrationComplete();
    }
  }

  function handleGameOver(reason) {
    if (hapticEnabled) {
      vibrate([100, 50, 100]);
    }
  }

  function handleSmirkWarning() {
    // Could show a visual warning here
  }

  function handleFaceNotDetected() {}

  function handleEyesClosed() {}

  // ===========================
  // Calibration
  // ===========================

  // Start calibration when requested
  // IMPORTANT: Wait for BOTH isInitialized AND modelsLoaded before calibration
  useEffect(() => {
    if (isCalibrating && isInitialized && modelsLoaded && !guardianIsCalibrating) {
      startCalibration();
    }
  }, [isCalibrating, isInitialized, modelsLoaded, guardianIsCalibrating, startCalibration]);

  // Pass detection data to calibration manager
  useEffect(() => {
    if (!isCalibrating || !lastResult) return;

    if (onCalibrationUpdate) {
      onCalibrationUpdate({
        faceDetected: lastResult.faceDetected,
        eyesOpen: lastResult.eyesOpen,
        happinessScore: lastResult.happinessScore,
        calibrationProgress: guardianState.calibrationProgress,
        faceCentered: lastResult.faceCentered,
      });
    }
  }, [isCalibrating, lastResult, guardianState.calibrationProgress, onCalibrationUpdate]);

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
        setPunchlineActive(true);

        // Set timer to reset sensitivity
        if (punchlineTimerRef.current) {
          clearTimeout(punchlineTimerRef.current);
        }

        punchlineTimerRef.current = setTimeout(() => {
          setPunchlineActive(false);
        }, PUNCHLINE_WINDOW_DURATION);
      }
    };

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
  }, [currentVideo]);

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

        if (isLow && onLowLightWarning) {
          onLowLightWarning(true);
        }
      }
    };

    brightnessTimerRef.current = setInterval(checkBrightness, BRIGHTNESS_CHECK_INTERVAL);

    return () => {
      if (brightnessTimerRef.current) {
        clearInterval(brightnessTimerRef.current);
      }
    };
  }, [isVideoReady, calculateFrameBrightness, onLowLightWarning]);

  // ===========================
  // Cleanup
  // ===========================

  useEffect(() => {
    return () => {
      // Use refs directly to avoid dependency issues
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (punchlineTimerRef.current) {
        clearTimeout(punchlineTimerRef.current);
      }
      if (brightnessTimerRef.current) {
        clearInterval(brightnessTimerRef.current);
      }
      // Stop webcam stream to prevent memory leak - use refs directly
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      // Call cleanup functions using refs
      if (resetRef.current) {
        resetRef.current();
      }
      if (resetGuardianRef.current) {
        resetGuardianRef.current();
      }
    };
  }, []);

  // ===========================
  // Render
  // ===========================

  return (
    <div className="face-tracker">
      {/* Hidden video element for capture */}
      <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />

      {/* Canvas for any visual feedback */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* CPU Fallback Notification */}
      <CPUFallbackNotification
        visible={showCPUFallback}
        onDismiss={() => setShowCPUFallback(false)}
      />

      {/* Error display */}
      {(error || mpError) && (
        <WarningBox
          type="error"
          message={error || mpError}
          onDismiss={() => {
            setError(null);
            reset();
          }}
        />
      )}

      {/* Low light warning */}
      {isLowLight && (
        <WarningBox
          type="warning"
          message="Low light detected. Please improve lighting conditions for better detection."
          onDismiss={() => setIsLowLight(false)}
        />
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="face-tracker-loading">
          <div className="loading-spinner" />
          <p>Loading MediaPipe models...</p>
        </div>
      )}

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && performance && (
        <div className="face-tracker-debug">
          <p>FPS: {performance.fps?.toFixed(1) || 'N/A'}</p>
          <p>Latency: {performance.latency?.toFixed(1) || 'N/A'}ms</p>
          <p>GPU: {gpuEnabled ? 'Enabled' : 'Disabled'}</p>
          <p>State: {guardianState.gameState}</p>
        </div>
      )}
    </div>
  );
}

export default FaceTrackerMediaPipe;
