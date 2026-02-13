/**
 * useGuardianLogic Hook
 * 
 * Guardian Logic state machine for smile detection game.
 * Manages calibration, consecutive frame counting, and game over conditions.
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
  }, []);
  
  /**
   * Process detection result and update state
   */
  const processDetection = useCallback((result: DetectionResult) => {
    const now = performance.now();
    
    // Update face detection state
    const faceDetected = result.faceDetected;
    const eyesOpen = result.eyesOpen;
    const happinessScore = result.happinessScore;
    const isSmirking = result.isSmirking;
    const neutralExpression = result.neutralExpression;
    const faceCentered = result.faceCentered;
    
    // Handle game state transitions
    if (state.gameState === 'CALIBRATING') {
      handleCalibration(
        faceDetected,
        eyesOpen,
        neutralExpression,
        happinessScore,
        now
      );
    } else if (state.gameState === 'PLAYING') {
      handlePlaying(
        faceDetected,
        eyesOpen,
        isSmirking
      );
    }
    
    // Update state
    setState(prev => ({
      ...prev,
      faceDetected,
      eyesOpen,
      happinessScore,
      isSmirking,
      neutralExpression,
      faceCentered
    }));
    
  }, [state.gameState]);
  
  /**
   * Handle calibration phase
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
      // Reset stability counter if conditions not met
      stableFramesRef.current = 0;
      setState(prev => ({
        ...prev,
        calibrationProgress: 0
      }));
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
