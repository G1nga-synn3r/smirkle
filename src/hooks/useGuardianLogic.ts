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

// Threshold constants (should match constants.ts)
export const SMIRK_THRESHOLD = 0.3;
export const NEUTRAL_EXPRESSION_THRESHOLD = 0.15;
export const EYE_OPENNESS_THRESHOLD = 0.5;
export const FACE_CONFIDENCE_THRESHOLD = 0.7;
export const CONSECUTIVE_FRAMES_REQUIRED = 3;
export const WARNING_ZONE_FRAMES = 10;
export const CALIBRATION_STABILITY_DURATION = 1000;

// ===========================
// Debounce and Stability Constants
// ===========================

/**
 * Number of consecutive frames required to confirm face detection
 * Prevents flicker from momentary detection drops
 */
export const FACE_DETECTED_DEBOUNCE_FRAMES = 3;

/**
 * Number of consecutive frames required to confirm face loss
 * Higher threshold prevents false "face not detected" from brief occlusions
 */
export const FACE_LOST_DEBOUNCE_FRAMES = 10;

/**
 * Number of consecutive frames required to confirm eyes closed
 * Prevents false positives from blinking
 */
export const EYES_CLOSED_DEBOUNCE_FRAMES = 5;

/**
 * Grace frames allowed during calibration before resetting progress
 * Prevents calibration reset from single-frame detection failures
 */
export const CALIBRATION_GRACE_FRAMES = 3;

/**
 * Smoothing factor for happiness score (0-1)
 * Higher = more responsive, Lower = more smooth
 * 0.3 provides good balance between responsiveness and stability
 */
export const HAPPINESS_SMOOTHING_FACTOR = 0.3;

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
    
    // Recalculate isSmirking and neutralExpression based on smoothed score
    const isSmirking = smoothedHappiness >= SMIRK_THRESHOLD;
    const neutralExpression = smoothedHappiness < NEUTRAL_EXPRESSION_THRESHOLD;
    
    // Use debounced face detection for face centered
    const faceCentered = debouncedFaceDetected && result.faceCentered;
    
    // Handle game state transitions with debounced values
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
        // Face lost for 1 second
        callbacks.onFaceNotDetected?.();
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
      smirkFramesRef.current += 1;
      const currentSmirkFrames = smirkFramesRef.current;
      
      setState(prev => ({
        ...prev,
        consecutiveSmirkFrames: currentSmirkFrames,
        warningZoneFrames: 0
      }));
      
      // Check for warning zone
      if (currentSmirkFrames >= WARNING_ZONE_FRAMES && currentSmirkFrames < CONSECUTIVE_FRAMES_REQUIRED) {
        callbacks.onSmirkWarning?.();
        setState(prev => ({
          ...prev,
          warningZoneFrames: currentSmirkFrames
        }));
      }
      
      // Check for game over (3 consecutive frames)
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
      // Reset smirk counter if not smirking
      smirkFramesRef.current = 0;
      setState(prev => ({
        ...prev,
        consecutiveSmirkFrames: 0,
        warningZoneFrames: 0
      }));
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
