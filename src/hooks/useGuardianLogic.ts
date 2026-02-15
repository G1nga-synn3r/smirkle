/**
 * useGuardianLogic Hook
 * 
 * Guardian Logic state machine for smile detection game.
 * Manages calibration, consecutive frame counting, and game over conditions.
 * 
 * Updated with debounce and hysteresis for stable face visibility detection:
 * - Face detection requires consecutive frames to confirm presence/absence
 * - Happiness score is smoothed using exponential moving average
 * - Eye openness uses debounce to prevent flicker
 * - Calibration allows grace frames before resetting progress
 */

import { useState, useCallback, useRef } from 'react';
import { DetectionResult } from '../types/WorkerMessageProtocol';

// Import all constants from single source of truth
import {
  CONSECUTIVE_FRAMES_REQUIRED,
  CALIBRATION_STABILITY_DURATION,
  NEUTRAL_EXPRESSION_THRESHOLD,
  SMIRK_ENTER_THRESHOLD,
  SMIRK_EXIT_THRESHOLD,
  SMIRK_RESET_GRACE_FRAMES,
  FACE_DETECTED_DEBOUNCE_FRAMES,
  FACE_LOST_DEBOUNCE_FRAMES,
  EYES_CLOSED_DEBOUNCE_FRAMES,
  CALIBRATION_GRACE_FRAMES,
  HAPPINESS_SMOOTHING_FACTOR,
  FACE_LOSS_TIMEOUT_FRAMES,
  EYE_OPENNESS_THRESHOLD_MEDIAPIPE,
  FACE_CONFIDENCE_THRESHOLD_MEDIAPIPE,
} from '../utils/constants';

// Re-export constants for backward compatibility
export {
  CONSECUTIVE_FRAMES_REQUIRED,
  CALIBRATION_STABILITY_DURATION,
  NEUTRAL_EXPRESSION_THRESHOLD,
  SMIRK_ENTER_THRESHOLD,
  SMIRK_EXIT_THRESHOLD,
  SMIRK_RESET_GRACE_FRAMES,
  FACE_DETECTED_DEBOUNCE_FRAMES,
  FACE_LOST_DEBOUNCE_FRAMES,
  EYES_CLOSED_DEBOUNCE_FRAMES,
  CALIBRATION_GRACE_FRAMES,
  HAPPINESS_SMOOTHING_FACTOR,
  FACE_LOSS_TIMEOUT_FRAMES,
};

// Legacy aliases for backward compatibility
export const SMIRK_THRESHOLD = SMIRK_ENTER_THRESHOLD;
export const EYE_OPENNESS_THRESHOLD = EYE_OPENNESS_THRESHOLD_MEDIAPIPE;
export const FACE_CONFIDENCE_THRESHOLD = FACE_CONFIDENCE_THRESHOLD_MEDIAPIPE;
export const WARNING_ZONE_FRAMES = 10;

export type GameState = 'IDLE' | 'CALIBRATING' | 'PLAYING' | 'GAME_OVER';

export interface GuardianState {
  gameState: GameState;
  faceDetected: boolean;
  eyesOpen: boolean;
  happinessScore: number;
  isSmirking: boolean;
  neutralExpression: boolean;
  faceCentered: boolean;
  calibrationReady: boolean;
  consecutiveSmirkFrames: number;
  warningZoneFrames: number;
  isGameOver: boolean;
  gameOverReason: string | null;
  calibrationProgress: number;
}

export interface GuardianCallbacks {
  onCalibrationComplete?: () => void;
  onGameOver?: (reason: string) => void;
  onSmirkWarning?: () => void;
  onFaceNotDetected?: () => void;
  onEyesClosed?: () => void;
}

export function useGuardianLogic(callbacks: GuardianCallbacks = {}) {
  const [state, setState] = useState<GuardianState>({
    gameState: 'IDLE',
    faceDetected: false,
    eyesOpen: true,
    happinessScore: 0,
    isSmirking: false,
    neutralExpression: true,
    faceCentered: false,
    calibrationReady: false,
    consecutiveSmirkFrames: 0,
    warningZoneFrames: 0,
    isGameOver: false,
    gameOverReason: null,
    calibrationProgress: 0
  });
  
  const calibrationStartRef = useRef<number | null>(null);
  const stableFramesRef = useRef(0);
  const faceLostFramesRef = useRef(0);
  const smirkFramesRef = useRef(0); // Track smirk frames in ref to avoid stale closure
  
  /**
   * Counter for grace period before resetting smirk frames
   * Increments when not smirking, resets to 0 when smirking
   * Smirk frames only reset after this exceeds SMIRK_RESET_GRACE_FRAMES
   */
  const smirkResetCounterRef = useRef(0);
  
  /**
   * Current smirking state for hysteresis
   * Tracks whether we're currently in a smirking state to apply correct threshold
   */
  const isCurrentlySmirkingRef = useRef(false);
  
  // ===========================
  // Debounce and Smoothing Refs
  // ===========================
  
  /**
   * Consecutive frames where face was detected in raw input
   * Used to confirm face presence with hysteresis
   */
  const faceDetectedCountRef = useRef(0);
  
  /**
   * Consecutive frames where face was NOT detected in raw input
   * Used to confirm face loss with hysteresis
   */
  const faceNotDetectedCountRef = useRef(0);
  
  /**
   * Current debounced face detection state
   * Only changes after debounce thresholds are met
   */
  const debouncedFaceDetectedRef = useRef(false);
  
  /**
   * Consecutive frames where eyes were closed
   * Used to debounce eye closure detection
   */
  const eyesClosedCountRef = useRef(0);
  
  /**
   * Consecutive frames where eyes were open
   * Used to debounce eye open detection
   */
  const eyesOpenCountRef = useRef(0);
  
  /**
   * Current debounced eyes open state
   */
  const debouncedEyesOpenRef = useRef(true);
  
  /**
   * Smoothed happiness score using exponential moving average
   */
  const smoothedHappinessRef = useRef(0);
  
  /**
   * Grace frame counter for calibration
   * Allows brief detection failures without resetting progress
   */
  const calibrationGraceFramesRef = useRef(0);
  
  /**
   * Start calibration phase
   */
  const startCalibration = useCallback(() => {
    setState(prev => ({
      ...prev,
      gameState: 'CALIBRATING',
      calibrationReady: false,
      calibrationProgress: 0,
      consecutiveSmirkFrames: 0,
      warningZoneFrames: 0
    }));
    calibrationStartRef.current = performance.now();
    stableFramesRef.current = 0;
    
    // Reset smirk hysteresis and grace period refs
    smirkResetCounterRef.current = 0;
    isCurrentlySmirkingRef.current = false;
    
    // Reset debounce counters
    faceDetectedCountRef.current = 0;
    faceNotDetectedCountRef.current = 0;
    debouncedFaceDetectedRef.current = false;
    eyesClosedCountRef.current = 0;
    eyesOpenCountRef.current = 0;
    debouncedEyesOpenRef.current = true;
    smoothedHappinessRef.current = 0;
    calibrationGraceFramesRef.current = 0;
  }, []);
  
  /**
   * Apply debounce logic to face detection signal
   * Returns the debounced face detected state
   */
  function debounceFaceDetected(rawFaceDetected: boolean): boolean {
    if (rawFaceDetected) {
      // Increment detected counter, reset not-detected counter
      faceDetectedCountRef.current++;
      faceNotDetectedCountRef.current = 0;
      
      // Confirm face detected after threshold frames
      if (!debouncedFaceDetectedRef.current && 
          faceDetectedCountRef.current >= FACE_DETECTED_DEBOUNCE_FRAMES) {
        debouncedFaceDetectedRef.current = true;
      }
    } else {
      // Increment not-detected counter, reset detected counter
      faceNotDetectedCountRef.current++;
      faceDetectedCountRef.current = 0;
      
      // Confirm face lost after threshold frames
      if (debouncedFaceDetectedRef.current && 
          faceNotDetectedCountRef.current >= FACE_LOST_DEBOUNCE_FRAMES) {
        debouncedFaceDetectedRef.current = false;
      }
    }
    
    return debouncedFaceDetectedRef.current;
  }
  
  /**
   * Apply debounce logic to eyes open signal
   * Returns the debounced eyes open state
   */
  function debounceEyesOpen(rawEyesOpen: boolean | { left: number; right: number }): boolean {
    // Handle both boolean and object format
    const eyesOpenValue = typeof rawEyesOpen === 'boolean' 
      ? rawEyesOpen 
      : (rawEyesOpen.left > EYE_OPENNESS_THRESHOLD && rawEyesOpen.right > EYE_OPENNESS_THRESHOLD);
    
    if (eyesOpenValue) {
      eyesOpenCountRef.current++;
      eyesClosedCountRef.current = 0;
      
      if (!debouncedEyesOpenRef.current && 
          eyesOpenCountRef.current >= EYES_CLOSED_DEBOUNCE_FRAMES) {
        debouncedEyesOpenRef.current = true;
      }
    } else {
      eyesClosedCountRef.current++;
      eyesOpenCountRef.current = 0;
      
      if (debouncedEyesOpenRef.current && 
          eyesClosedCountRef.current >= EYES_CLOSED_DEBOUNCE_FRAMES) {
        debouncedEyesOpenRef.current = false;
      }
    }
    
    return debouncedEyesOpenRef.current;
  }
  
  /**
   * Apply exponential moving average smoothing to happiness score
   * Reduces jitter and prevents false smirk detection from momentary spikes
   */
  function smoothHappinessScore(rawScore: number): number {
    smoothedHappinessRef.current = 
      HAPPINESS_SMOOTHING_FACTOR * rawScore + 
      (1 - HAPPINESS_SMOOTHING_FACTOR) * smoothedHappinessRef.current;
    return smoothedHappinessRef.current;
  }
  
  /**
   * Process detection result and update state
   */
  const processDetection = useCallback((result: DetectionResult) => {
    const now = performance.now();
    
    // Apply debounce and smoothing to raw detection values
    const debouncedFaceDetected = debounceFaceDetected(result.faceDetected);
    const debouncedEyesOpen = debounceEyesOpen(result.eyesOpen);
    const smoothedHappiness = smoothHappinessScore(result.happinessScore);
    
    // Apply hysteresis for smirk detection to prevent flickering
    // When currently smirking: use EXIT threshold (lower, more stable)
    // When not smirking: use ENTER threshold (higher, more sensitive to enter)
    const isSmirking = isCurrentlySmirkingRef.current
      ? smoothedHappiness >= SMIRK_EXIT_THRESHOLD  // Already smirking: stay smirking until below exit threshold
      : smoothedHappiness >= SMIRK_ENTER_THRESHOLD; // Not smirking: need to reach enter threshold
    
    // Update the current smirking state for next frame's hysteresis
    isCurrentlySmirkingRef.current = isSmirking;
    
    const neutralExpression = smoothedHappiness < NEUTRAL_EXPRESSION_THRESHOLD;
    
    // Use debounced face detection for face centered
    const faceCentered = debouncedFaceDetected && result.faceCentered;
    
    // Handle game state transitions with debounced values
    // Explicit handling for all states to prevent stale state issues
    if (state.gameState === 'IDLE') {
      // In IDLE state, no game logic processing needed
      // Just update detection values for UI feedback
      setState(prev => ({
        ...prev,
        faceDetected: debouncedFaceDetected,
        eyesOpen: debouncedEyesOpen,
        happinessScore: smoothedHappiness,
        isSmirking,
        neutralExpression,
        faceCentered
      }));
      return;
    }
    
    if (state.gameState === 'GAME_OVER') {
      // In GAME_OVER state, no further game logic processing
      // Just update detection values for UI feedback
      setState(prev => ({
        ...prev,
        faceDetected: debouncedFaceDetected,
        eyesOpen: debouncedEyesOpen,
        happinessScore: smoothedHappiness,
        isSmirking,
        neutralExpression,
        faceCentered
      }));
      return;
    }
    
    if (state.gameState === 'CALIBRATING') {
      handleCalibration(
        debouncedFaceDetected,
        debouncedEyesOpen,
        neutralExpression,
        smoothedHappiness,
        now
      );
    } else if (state.gameState === 'PLAYING') {
      handlePlaying(
        debouncedFaceDetected,
        debouncedEyesOpen,
        isSmirking
      );
    }
    
    // Update state with debounced/smoothed values
    setState(prev => ({
      ...prev,
      faceDetected: debouncedFaceDetected,
      eyesOpen: debouncedEyesOpen,
      happinessScore: smoothedHappiness,
      isSmirking,
      neutralExpression,
      faceCentered
    }));
    
  }, [state.gameState]);
  
  /**
   * Handle calibration phase
   * Uses grace frames to prevent progress reset from brief detection failures
   */
  function handleCalibration(
    faceDetected: boolean,
    eyesOpen: boolean,
    neutralExpression: boolean,
    happinessScore: number,
    now: number
  ) {
    // Check if calibration conditions are met
    const conditionsMet = 
      faceDetected &&
      eyesOpen &&
      neutralExpression &&
      happinessScore < NEUTRAL_EXPRESSION_THRESHOLD;
    
    if (conditionsMet) {
      // Reset grace frame counter when conditions are good
      calibrationGraceFramesRef.current = 0;
      stableFramesRef.current++;
      
      // Calculate calibration progress
      const elapsed = now - (calibrationStartRef.current || now);
      const progress = Math.min(100, (elapsed / CALIBRATION_STABILITY_DURATION) * 100);
      
      setState(prev => ({
        ...prev,
        calibrationProgress: progress
      }));
      
      // Check if calibration is complete (1 second of stable conditions)
      if (stableFramesRef.current >= 30 && elapsed >= CALIBRATION_STABILITY_DURATION) {
        setState(prev => ({
          ...prev,
          gameState: 'PLAYING',
          calibrationReady: true,
          calibrationProgress: 100
        }));
        callbacks.onCalibrationComplete?.();
      }
    } else {
      // Use grace frames before resetting calibration progress
      calibrationGraceFramesRef.current++;
      
      // Only reset if grace period is exceeded
      if (calibrationGraceFramesRef.current > CALIBRATION_GRACE_FRAMES) {
        stableFramesRef.current = 0;
        setState(prev => ({
          ...prev,
          calibrationProgress: 0
        }));
      }
    }
  }
  
  /**
   * Handle playing phase
   */
  function handlePlaying(
    faceDetected: boolean,
    eyesOpen: boolean,
    isSmirking: boolean
  ) {
    // Check for face loss
    if (!faceDetected) {
      faceLostFramesRef.current++;
      
      if (faceLostFramesRef.current >= 30) {
        // Face lost for 1 second - trigger warning callback
        callbacks.onFaceNotDetected?.();
      }
      
      // Extended face loss timeout - transition to GAME_OVER
      // Prevents players from avoiding detection by covering camera
      if (faceLostFramesRef.current >= FACE_LOSS_TIMEOUT_FRAMES) {
        setState(prev => ({
          ...prev,
          gameState: 'GAME_OVER',
          isGameOver: true,
          gameOverReason: 'face_not_detected'
        }));
        callbacks.onGameOver?.('face_not_detected');
      }
      
      return;
    }
    
    faceLostFramesRef.current = 0;
    
    // Check for eyes closed
    if (!eyesOpen) {
      callbacks.onEyesClosed?.();
      return;
    }
    
    // Handle smirk detection
    if (isSmirking) {
      // Reset the grace period counter when smirking
      smirkResetCounterRef.current = 0;
      
      smirkFramesRef.current += 1;
      const currentSmirkFrames = smirkFramesRef.current;
      
      setState(prev => ({
        ...prev,
        consecutiveSmirkFrames: currentSmirkFrames,
        warningZoneFrames: 0
      }));
      
      // Check for warning zone (frames 1 and 2, before game over on frame 3)
      // Fixed: Previous condition with WARNING_ZONE_FRAMES=10 was never true
      if (currentSmirkFrames >= 1 && currentSmirkFrames < CONSECUTIVE_FRAMES_REQUIRED) {
        callbacks.onSmirkWarning?.();
        setState(prev => ({
          ...prev,
          warningZoneFrames: currentSmirkFrames
        }));
      }
      
      // Check for game over (3 consecutive frames) - triggers immediately
      if (currentSmirkFrames >= CONSECUTIVE_FRAMES_REQUIRED) {
        setState(prev => ({
          ...prev,
          gameState: 'GAME_OVER',
          isGameOver: true,
          gameOverReason: 'smirk_detected',
          consecutiveSmirkFrames: currentSmirkFrames
        }));
        callbacks.onGameOver?.('smirk_detected');
      }
    } else {
      // Increment grace period counter when not smirking
      smirkResetCounterRef.current += 1;
      
      // Only reset smirk counter after grace period expires
      if (smirkResetCounterRef.current > SMIRK_RESET_GRACE_FRAMES) {
        smirkFramesRef.current = 0;
        setState(prev => ({
          ...prev,
          consecutiveSmirkFrames: 0,
          warningZoneFrames: 0
        }));
      }
    }
  }
  
  /**
   * Reset to idle state
   */
  const reset = useCallback(() => {
    setState({
      gameState: 'IDLE',
      faceDetected: false,
      eyesOpen: true,
      happinessScore: 0,
      isSmirking: false,
      neutralExpression: true,
      faceCentered: false,
      calibrationReady: false,
      consecutiveSmirkFrames: 0,
      warningZoneFrames: 0,
      isGameOver: false,
      gameOverReason: null,
      calibrationProgress: 0
    });
    calibrationStartRef.current = null;
    stableFramesRef.current = 0;
    faceLostFramesRef.current = 0;
    smirkFramesRef.current = 0;
    
    // Reset smirk hysteresis and grace period refs
    smirkResetCounterRef.current = 0;
    isCurrentlySmirkingRef.current = false;
    
    // Reset debounce refs
    faceDetectedCountRef.current = 0;
    faceNotDetectedCountRef.current = 0;
    debouncedFaceDetectedRef.current = false;
    eyesClosedCountRef.current = 0;
    eyesOpenCountRef.current = 0;
    debouncedEyesOpenRef.current = true;
    smoothedHappinessRef.current = 0;
    calibrationGraceFramesRef.current = 0;
  }, []);
  
  /**
   * Restart game after game over
   */
  const restart = useCallback(() => {
    setState(prev => ({
      ...prev,
      gameState: 'CALIBRATING',
      isGameOver: false,
      gameOverReason: null,
      consecutiveSmirkFrames: 0,
      warningZoneFrames: 0,
      calibrationProgress: 0
    }));
    stableFramesRef.current = 0;
    faceLostFramesRef.current = 0;
    smirkFramesRef.current = 0;
    
    // Reset smirk hysteresis and grace period refs
    smirkResetCounterRef.current = 0;
    isCurrentlySmirkingRef.current = false;
    
    // Reset debounce refs for new game
    faceDetectedCountRef.current = 0;
    faceNotDetectedCountRef.current = 0;
    debouncedFaceDetectedRef.current = false;
    eyesClosedCountRef.current = 0;
    eyesOpenCountRef.current = 0;
    debouncedEyesOpenRef.current = true;
    smoothedHappinessRef.current = 0;
    calibrationGraceFramesRef.current = 0;
  }, []);
  
  /**
   * Get current state
   */
  const getState = useCallback(() => state, [state]);
  
  /**
   * Check if game is in progress
   */
  const isPlaying = state.gameState === 'PLAYING';
  const isCalibrating = state.gameState === 'CALIBRATING';
  const isGameOver = state.gameState === 'GAME_OVER';
  
  return {
    state,
    processDetection,
    startCalibration,
    reset,
    restart,
    getState,
    isPlaying,
    isCalibrating,
    isGameOver
  };
}
