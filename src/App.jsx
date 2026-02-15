/**
 * @fileoverview Smirkle Game Application
 *
 * ## Component Purpose
 *
 * The `App` component is the main entry point and orchestrator for the Smirkle game - a smile detection
 * challenge game where players must maintain a neutral expression while watching videos. This component
 * manages the entire game lifecycle including initialization, gameplay, checkpoint progression, and
 * user interactions.
 *
 * ## Key Features
 *
 * 1. **System Check Overlay** - Initial startup screen that validates camera access, MediaPipe model
 *    loading, and system compatibility before allowing gameplay
 *
 * 2. **Tutorial System** - Interactive tutorial for new users explaining game rules and mechanics,
 *    shown only on first visit (controlled by localStorage 'smirkle_hasSeenTutorial')
 *
 * 3. **Video Playback with Emotion Detection** - Renders VideoPlayer component with emotion tracking
 *    using MediaPipe Face Landmarker for real-time smile/smirk detection
 *
 * 4. **Checkpoint Bonus System** - Rewards players for sustained gameplay at specific time intervals
 *    with cumulative bonus points (see CHECKPOINTS constant below)
 *
 * 5. **Two-Stage Smile Detection** - Progressive fail system:
 *    - **Warning Phase**: Triggered when smirk probability is in neutral zone (0.15 - 0.30)
 *    - **Fail Phase**: Triggered after warning timer expires OR immediate fail if probability >= 0.30
 *
 * 6. **Calibration Workflow** - Initial face detection calibration to establish user's neutral
 *    expression baseline before gameplay begins
 *
 * ## State Categories
 *
 * ### Game State
 * - `isSmiling` - Whether the user is currently smiling (happiness >= SMILE_THRESHOLD)
 * - `isSmirking` - Whether the user is smirking (happiness >= SMILE_FAIL_THRESHOLD)
 * - `gameOver` - Game session has ended due to smile detection
 * - `survivalTime` - Total time survived in seconds (starts when all prerequisites are met)
 *
 * ### View Navigation State
 * - `currentView` - Current active view: 'game', 'leaderboard', 'social', 'submit', 'settings', 'teams', 'profile'
 * - `showTutorial` - Whether to display tutorial overlay
 * - `showSystemCheck` - Whether to display system initialization overlay
 *
 * ### Camera State
 * - `cameraReady` - Camera stream is active and first frame processed successfully
 * - `cameraError` - Any camera initialization errors
 *
 * ### Calibration States
 * - `isCalibrating` - Calibration phase is active
 * - `calibrationComplete` - Calibration finished successfully
 * - `calibrationProgress` - Calibration progress percentage (0-100)
 * - `calibrationStatus` - Current calibration status: 'waiting', 'detecting', 'stable', 'complete', 'failed'
 *
 * ### Guardian Logic States
 * - `isFaceDetected` - Face is currently visible in camera frame
 * - `isFaceCentered` - Face is properly centered in the camera view
 * - `isLowLight` - Ambient lighting is too low for reliable detection
 * - `isEyesOpen` - User's eyes are open (required for valid detection)
 *
 * ### Two-Stage Detection States
 * - `warningActive` - Warning phase is currently active
 * - `warningTimer` - Reference to the warning timeout timer
 * - `isFailPhase` - Fail phase is active (game over imminent)
 * - `smileFailTimer` - Reference to fail phase timer
 *
 * ## Important Workflows
 *
 * ### Unified Startup Flow
 *
 * The application follows a strict initialization sequence:
 *
 * 1. **System Check Phase** (showSystemCheck=true)
 *    - Loads MediaPipe models via FaceTrackerMediaPipe
 *    - Validates camera access
 *    - Checks for GPU/CPU fallback requirements
 *    - Waits for both cameraReady AND modelsLoaded
 *
 * 2. **Tutorial Phase** (showTutorial=true, if first visit)
 *    - Displays interactive tutorial overlay
 *    - User must complete tutorial to proceed
 *
 * 3. **Calibration Phase** (isCalibrating=true)
 *    - Detects user's neutral expression baseline
 *    - Validates face detection, eye openness, and lighting
 *    - Sets calibrationComplete=true on success
 *
 * 4. **Game Ready State**
 *    - All prerequisites met: cameraReady, calibrationComplete, isFaceDetected, currentVideo !== null
 *    - Survival timer starts automatically
 *
 * ### Checkpoint Progression System
 *
 * The game awards bonus points at specific survival time milestones:
 *
 * | Checkpoint | Time (seconds) | Time (minutes) | Bonus Points |
 * |------------|----------------|----------------|--------------|
 * | 1          | 300            | 5              | 1,000        |
 * | 2          | 900            | 15             | 2,000        |
 * | 3          | 2,100          | 35             | 3,000        |
 * | 4          | 4,500          | 75             | 4,000        |
 * | 5          | 9,300          | 155            | 5,000        |
 *
 * Time progression pattern: +5min, +10min, +20min, +40min, +80min
 * Bonus progression pattern: +1000, +2000, +3000, +4000, +5000...
 *
 * ### Game Over Triggers
 *
 * Game over occurs when:
 * 1. **Immediate Fail**: Smirk probability >= SMILE_FAIL_THRESHOLD (0.30)
 * 2. **Warning Timeout**: Warning phase active and timer expires while still smirking
 * 3. **Fail Phase**: Any smirking detected during fail phase
 *
 * State transitions on game over:
 * - Sets gameOver=true
 * - Stops survival timer
 * - Plays buzzer sound
 * - Exits fullscreen mode
 * - Submits score to leaderboard (non-guests only)
 * - Displays WASTED overlay with survival time
 *
 * ## Dependencies
 *
 * ### Component Imports
 * - `CameraView` - Camera preview component
 * - `WarningBox` - Displays guardian logic warnings
 * - `Navbar` - Application navigation bar
 * - `Leaderboard` - Score leaderboard display
 * - `SubmitVideoForm` - Video submission form
 * - `ProfilePage` - User profile management
 * - `ProfileSettings` - User settings configuration
 * - `SocialHub` - Social features and interactions
 * - `AuthGate` - Authentication gate wrapper
 * - `Teams` - Team/squad management
 * - `TutorialOverlay` - Tutorial display component
 * - `CalibrationOverlay` - Calibration UI feedback
 * - `SystemCheckOverlay` - System initialization UI
 * - `CameraPiP` - Picture-in-picture camera view
 * - `FaceTrackerMediaPipe` - MediaPipe face tracking wrapper
 * - `VideoPlayer` - Video playback with emotion overlays
 *
 * ### Hook Imports
 * - `useSoundEffects` - Audio playback management
 * - `useHapticFeedback` - Vibration/feedback on supported devices
 * - `useGuardianLogic` - Guardian warning system logic
 *
 * ### Utility Imports
 * - `getCurrentUser`, `isGuest`, `setCurrentUser` from './utils/auth.js'
 * - `VIDEO_DATABASE`, `videoQueueManager` from './data/videoLibrary.js'
 * - `saveScore`, `updateUserLifetimeScore` from './services/scoreService.js'
 * - `SMILE_FAIL_THRESHOLD`, `NEUTRAL_EXPRESSION_THRESHOLD`, `SMILE_WARNING_DURATION`, `CALIBRATION_COMPLETE_TRANSITION`, `PIP_CONFIG` from './utils/constants.js'
 * - `createCalibrationManager` from './utils/calibrationLogic.js'
 *
 * ## Constants
 *
 * @constant {Array<{time: number, bonus: number}>} CHECKPOINTS
 * @desc Checkpoint system configuration defining time milestones and bonus rewards.
 *      Each checkpoint represents a survival time achievement with associated point bonus.
 *      Time values are in seconds, bonuses are cumulative points awarded at each milestone.
 *
 * Time progression formula: Each interval increases by doubling the previous interval
 * - 5min (300s) initial checkpoint
 * - +10min intervals: 15min (900s), 35min (2100s), 75min (4500s), 155min (9300s)
 *
 * Bonus progression formula: Each bonus increases by 1000 points
 * - 1000, 2000, 3000, 4000, 5000...
 *
 * @example
 * // Checkpoint structure
 * { time: 300, bonus: 1000 } // 5 minutes = +1000 points
 * { time: 900, bonus: 2000 } // 15 minutes = +2000 points
 * { time: 2100, bonus: 3000 } // 35 minutes = +3000 points
 *
 * @see {@link https://github.com/nicolesmirkle/smirkle/blob/main/docs/two-stage-smile-detection-architecture.md|Two-Stage Smile Detection Architecture}
 * @see {@link https://github.com/nicolesmirkle/smirkle/blob/main/docs/guardian-logic-architecture.md|Guardian Logic Architecture}
 */
import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import './style.css';
import { useSoundEffects } from './hooks/useSoundEffects.js';
import { useHapticFeedback } from './hooks/useHapticFeedback.js';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Core game components - eager load (critical path)
import CameraView from './components/CameraView.jsx';
import WarningBox from './components/WarningBox.jsx';
import Navbar from './components/Navbar.jsx';
import SystemCheckOverlay from './components/SystemCheckOverlay.tsx';
import FaceTrackerMediaPipe from './components/FaceTrackerMediaPipe.jsx';
import VideoPlayer from './components/VideoPlayer.jsx';

// Lazy-loaded views - loaded on-demand when user navigates
const Leaderboard = lazy(() => import('./components/Leaderboard.jsx'));
const SubmitVideoForm = lazy(() => import('./components/SubmitVideoForm.jsx'));
const ProfilePage = lazy(() => import('./components/ProfilePage.jsx'));
const ProfileSettings = lazy(() => import('./components/ProfileSettings.jsx'));
const SocialHub = lazy(() => import('./components/SocialHub.jsx'));
const Teams = lazy(() => import('./components/Teams.jsx'));
const AuthGate = lazy(() => import('./components/AuthGate.jsx'));

// Lazy-loaded overlays - shown conditionally
const TutorialOverlay = lazy(() => import('./components/TutorialOverlay.jsx'));
const CalibrationOverlay = lazy(() => import('./components/CalibrationOverlay.jsx'));
const CameraPiP = lazy(() => import('./components/CameraPiP.jsx'));

// Loading fallback component for Suspense
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);
import { getCurrentUser, isGuest, setCurrentUser } from './utils/auth.js';
import {
  VIDEO_DATABASE,
  videoQueueManager,
} from './data/videoLibrary.js';
import { saveScore, updateUserLifetimeScore } from './services/scoreService.js';
import {
  SMILE_FAIL_THRESHOLD,
  NEUTRAL_EXPRESSION_THRESHOLD,
  SMILE_WARNING_DURATION,
  CALIBRATION_COMPLETE_TRANSITION,
  PIP_CONFIG,
} from './utils/constants.js';
import { createCalibrationManager } from './utils/calibrationLogic.js';

// Checkpoint system configuration
// Time progression: 5min, 15min (5+10), 35min (15+20), 75min (35+40), 155min (75+80)
// Bonus progression: 1000, 2000, 3000, 4000, 5000...
const CHECKPOINTS = [
  { time: 300, bonus: 1000 }, // 5 minutes
  { time: 900, bonus: 2000 }, // 15 minutes
  { time: 2100, bonus: 3000 }, // 35 minutes
  { time: 4500, bonus: 4000 }, // 75 minutes
  { time: 9300, bonus: 5000 }, // 155 minutes
];

function App() {
  const [isSmiling, setIsSmiling] = useState(false);
  const [isSmirking, setIsSmirking] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [survivalTime, setSurvivalTime] = useState(0);
  const [currentView, setCurrentView] = useState('game');
  const [hasPlayedDing, setHasPlayedDing] = useState(false);
  const [currentUser, setCurrentUserState] = useState(null);
  // Initialize tutorial state synchronously to prevent render timing issues
  const shouldShowTutorial = !localStorage.getItem('smirkle_hasSeenTutorial');
  const [showTutorial, setShowTutorial] = useState(shouldShowTutorial);

  // System Check state
  const hasCompletedSystemCheck = localStorage.getItem('smirkle_systemCheckComplete');
  const [showSystemCheck, setShowSystemCheck] = useState(!hasCompletedSystemCheck);
  const [systemCheckPassed, setSystemCheckPassed] = useState(false);

  // Unified camera ready state (from FaceTrackerMediaPipe)
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Checkpoint system
  const [checkpointsHit, setCheckpointsHit] = useState([]);
  const [checkpointBonus, setCheckpointBonus] = useState(0);

  // Calibration Phase states
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationComplete, setCalibrationComplete] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [calibrationStatus, setCalibrationStatus] = useState('waiting'); // 'waiting' | 'detecting' | 'stable' | 'complete' | 'failed'

  // Guardian Logic: Warning states
  const [isFaceDetected, setIsFaceDetected] = useState(true);
  const [isFaceCentered, setIsFaceCentered] = useState(true);
  const [isLowLight, setIsLowLight] = useState(false);
  const [isEyesOpen, setIsEyesOpen] = useState(false);

  // Two-Stage Smile Detection State
  const [warningActive, setWarningActive] = useState(false);
  const [warningTimer, setWarningTimer] = useState(null);
  const [isFailPhase, setIsFailPhase] = useState(false);
  const [smileFailTimer, setSmileFailTimer] = useState(null);

  // Game Ready state - timer only starts when all prerequisites are met
  const isGameReady =
    cameraReady &&
    calibrationComplete &&
    isFaceDetected &&
    currentVideo !== null &&
    !gameOver &&
    !isSmirking;

  // Video Library State - Initialize with random video from database
  // Video starts paused until camera initialization is complete
  const [currentVideo, setCurrentVideo] = useState(() => {
    const randomIndex = Math.floor(Math.random() * VIDEO_DATABASE.length);
    return VIDEO_DATABASE[randomIndex];
  });
  const [selectedDifficulty, setSelectedDifficulty] = useState(null); // 'Easy', 'Medium', 'Hard', or null for all
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false); // Track fullscreen state
  const [showCameraPiP, setShowCameraPiP] = useState(false); // PiP camera visibility
  const videoRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const calibrationManagerRef = useRef(null); // Calibration manager instance
  const warningTimerRef = useRef(null); // Two-stage warning timer ref
  const { isMuted, playBuzzer, playDing, toggleMute, resumeAudio } = useSoundEffects();
  const { triggerVibration } = useHapticFeedback();

  // Model loading state for SystemCheckOverlay
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingStage, setLoadingStage] = useState('initializing');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [cpuFallback, setCpuFallback] = useState(false);
  const [modelError, setModelError] = useState(null);

  // Callback when camera is ready from FaceTrackerMediaPipe
  // Uses unified cameraReady state - cameraReady = stream.active + first frame + no errors
  const handleCameraReady = useCallback((ready) => {
    setCameraReady(ready);
  }, []);

  // Handle camera errors
  const handleCameraError = useCallback((error) => {
    setCameraError(error);
  }, []);

  // Handle calibration updates from FaceTracker
  const handleCalibrationUpdate = useCallback(
    (data) => {
      if (!isCalibrating || calibrationComplete || !calibrationManagerRef.current) {
        return;
      }

      // Process detection data through calibration manager
      const calibrationState = calibrationManagerRef.current.processDetection({
        faceDetected: data.faceDetected,
        eyesOpen: data.eyesOpen,
        happinessScore: data.happinessScore || 0,
      });

      // Update UI state
      setCalibrationStatus(calibrationState.status);
      setCalibrationProgress(calibrationState.progress);
    },
    [isCalibrating, calibrationComplete]
  );

  // Handle calibration completion
  const handleCalibrationComplete = useCallback((success, reason) => {
    if (success) {
      setCalibrationComplete(true);
      setIsCalibrating(false);
      setCalibrationStatus('complete');
      setCalibrationProgress(100);

      // Stop calibration manager
      if (calibrationManagerRef.current) {
        calibrationManagerRef.current.stop();
      }
    } else {
      setCalibrationStatus('failed');
      // Reset for retry
      setTimeout(() => {
        setIsCalibrating(false);
        setCalibrationStatus('idle');
      }, 2000);
    }
  }, []);

  // Handle system check completion - waits for BOTH cameraReady AND modelsLoaded
  const handleSystemCheckComplete = useCallback(
    (data) => {
      setSystemCheckPassed(data.cameraReady && data.modelsLoaded);
      setShowSystemCheck(false);
      // Mark system check as complete so next visit skips it
      localStorage.setItem('smirkle_systemCheckComplete', 'true');

      // Start calibration phase if models are loaded
      if (data.cameraReady && data.modelsLoaded) {
        setCameraReady(true);
        setIsCalibrating(true);
        setCalibrationStatus('checking');
        setCalibrationProgress(0);

        // Initialize calibration manager
        calibrationManagerRef.current = createCalibrationManager({
          onComplete: handleCalibrationComplete,
          onUpdate: (state) => {
            // Use functional updates to avoid stale state
            setCalibrationStatus((prev) => state.status || prev);
            setCalibrationProgress((prev) => state.progress ?? prev);
          },
        });

        // Start calibration
        calibrationManagerRef.current.start();
      }
    },
    [handleCalibrationComplete]
  );

  // Handle model status changes from FaceTrackerMediaPipe
  const handleModelStatusChange = useCallback((status) => {
    setModelsLoading(status.isLoading);
    setModelsLoaded(status.modelsLoaded);
    if (status.loadingStage) setLoadingStage(status.loadingStage);
    if (status.loadingProgress !== undefined) setLoadingProgress(status.loadingProgress);
    if (status.cpuFallback !== undefined) setCpuFallback(status.cpuFallback);
    if (status.error) setModelError(status.error);
  }, []);

  // Guardian Logic: Handle face centering updates from FaceTracker
  const handleFaceCenteredUpdate = useCallback((isCentered) => {
    setIsFaceCentered(isCentered);
  }, []);

  // Guardian Logic: Handle low-light warnings from FaceTracker
  const handleLowLightWarning = useCallback((isLow) => {
    setIsLowLight(isLow);
  }, []);

  // Load user data from localStorage on mount
  useEffect(() => {
    // First, get the current user from auth system
    let user = getCurrentUser();

    // Check for additional user data in smirkle_user_data
    const savedUserData = localStorage.getItem('smirkle_user_data');
    if (savedUserData) {
      try {
        const parsedData = JSON.parse(savedUserData);
        const userName = parsedData.name?.value || '';

        // If we have a user logged in, merge the name from userData
        if (user && userName) {
          user = { ...user, username: userName };
          setCurrentUser(user);
        }

        setCurrentUserState({
          ...user,
          name: userName,
          bio: parsedData.bio?.value || '',
          motto: parsedData.motto?.value || '',
          birthdate: parsedData.birthdate?.value || '',
        });
      } catch (e) {
        console.error('Failed to load user data:', e);
        setCurrentUserState(user);
      }
    } else {
      setCurrentUserState(user);
    }
  }, []);

  // Start survival timer only when game is fully ready
  // Prerequisites: camera ready, calibration complete, face detected, video loaded
  useEffect(() => {
    // Cleanup any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Only start timer when game is fully ready and not game over
    if (currentView === 'game' && !gameOver && isGameReady) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setSurvivalTime((Date.now() - startTimeRef.current) / 1000);
      }, 100);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentView, gameOver, isGameReady]);

  // Check for checkpoint achievements
  useEffect(() => {
    if (gameOver || survivalTime <= 0) return;

    let newCheckpointBonus = 0;
    const newCheckpointsHit = [...checkpointsHit];

    CHECKPOINTS.forEach((checkpoint) => {
      if (survivalTime >= checkpoint.time && !checkpointsHit.includes(checkpoint.time)) {
        // Checkpoint just reached!
        newCheckpointsHit.push(checkpoint.time);
        newCheckpointBonus += checkpoint.bonus;
        // Play notification sound
        playDing();
        console.log(
          `🎯 Checkpoint reached! ${(checkpoint.time / 60).toFixed(1)} minutes - +${checkpoint.bonus} bonus`
        );
      }
    });

    if (newCheckpointsHit.length > checkpointsHit.length) {
      setCheckpointsHit(newCheckpointsHit);
      setCheckpointBonus((prev) => prev + newCheckpointBonus);
    }
  }, [survivalTime, checkpointsHit, gameOver, playDing]);

  // Submit score to leaderboard (only for non-guests) - defined early to avoid initialization issues
  const submitScore = useCallback(() => {
    const user = getCurrentUser();

    // Don't submit scores for guests
    if (isGuest()) {
      return;
    }

    if (!user || !survivalTime) return;

    // Calculate score (survival time in seconds * 100 + checkpoint bonuses)
    const baseScore = Math.floor(survivalTime * 100);
    const scoreValue = baseScore + checkpointBonus;

    // Save to Firestore
    try {
      saveScore({
        userId: user.id,
        username: user.username,
        scoreValue: scoreValue,
        survivalTime: survivalTime,
        isGuest: false,
      });

      // Update user's lifetime score
      updateUserLifetimeScore(user.id, scoreValue);
    } catch (error) {
      console.error('Error saving score to Firestore:', error);
    }

    // Also save to localStorage as fallback
    const savedScores = localStorage.getItem('smirkle-scores');
    const scores = savedScores ? JSON.parse(savedScores) : [];

    const newScore = {
      id: Date.now(),
      name: user.username,
      score: scoreValue,
      time: survivalTime,
      date: new Date().toISOString().split('T')[0],
      isGuest: false,
    };

    scores.push(newScore);
    localStorage.setItem('smirkle-scores', JSON.stringify(scores));
  }, [survivalTime, checkpointBonus]);

  // Trigger game over when smirking (happiness ≥ 0.3)
  useEffect(() => {
    if (isSmirking && !gameOver) {
      setGameOver(true);
      playBuzzer(); // Play comical buzzer sound on game over
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Submit score to leaderboard
      submitScore();
      // Exit fullscreen on game over
      setIsVideoFullscreen(false);
    }
  }, [isSmirking, gameOver, playBuzzer, submitScore]);

  // CALIBRATION COMPLETE TRANSITION
  // When calibration becomes true, trigger fullscreen, PiP, and timer
  useEffect(() => {
    if (calibrationComplete && !gameOver && currentView === 'game') {
      // Step 1: Hide calibration UI (with fade delay)
      const uiHideTimer = setTimeout(() => {
        setIsCalibrating(false);
      }, CALIBRATION_COMPLETE_TRANSITION.UI_HIDE_DELAY);

      // Step 2: Trigger fullscreen
      const fullscreenTimer = setTimeout(() => {
        setIsVideoFullscreen(true);
      }, CALIBRATION_COMPLETE_TRANSITION.FULLSCREEN_DELAY);

      // Step 3: Show PiP camera
      const pipTimer = setTimeout(() => {
        setShowCameraPiP(true);
      }, CALIBRATION_COMPLETE_TRANSITION.PIP_SHOW_DELAY);

      // Step 4: Start score counter immediately
      startTimeRef.current = Date.now();

      return () => {
        clearTimeout(uiHideTimer);
        clearTimeout(fullscreenTimer);
        clearTimeout(pipTimer);
      };
    }
  }, [calibrationComplete, gameOver, currentView]);

  // Auto-trigger fullscreen when game is ready and conditions met
  // This ensures video plays in full screen with camera corner immediately
  useEffect(() => {
    if (isGameReady && isEyesOpen && !isSmiling && currentView === 'game' && !isVideoFullscreen) {
      setIsVideoFullscreen(true);
    } else if ((gameOver || isSmiling) && isVideoFullscreen) {
      setIsVideoFullscreen(false);
    }
  }, [isGameReady, isSmiling, gameOver, currentView, isVideoFullscreen]);

  // Trigger haptic feedback and visual effects when smile is detected
  useEffect(() => {
    if (isSmiling && currentView === 'game') {
      // Trigger strong haptic feedback pattern
      triggerVibration([100, 50, 100, 50, 100]); // Escalating vibration pattern
    }
  }, [isSmiling, currentView, triggerVibration]);

  // Play ding sound when surviving 30 seconds
  useEffect(() => {
    if (survivalTime >= 30 && !hasPlayedDing && !gameOver) {
      playDing();
      setHasPlayedDing(true);
    }
  }, [survivalTime, hasPlayedDing, gameOver, playDing, setHasPlayedDing]);

  // Initialize video queue on first game start
  useEffect(() => {
    if (currentView === 'game' && !currentVideo) {
      const nextVideo = videoQueueManager.getNextVideo();
      setCurrentVideo(nextVideo);
    }
  }, [currentView, currentVideo]);

  const handleResume = () => {
    setIsSmiling(false);
    setIsSmirking(false);
    setGameOver(false);
    setSurvivalTime(0);
    setHasPlayedDing(false);
    setCheckpointsHit([]);
    setCheckpointBonus(0);
    setIsVideoFullscreen(false); // Exit fullscreen on reset
    setShowCameraPiP(false); // Hide PiP on game over/reset

    // Reset two-stage detection state
    setWarningActive(false);
    setWarningTimer(null);
    setIsFailPhase(false);
    setSmileFailTimer(null);
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }

    resumeAudio(); // Resume audio context on interaction

    // Get next video from queue (anti-repeat)
    const nextVideo = videoQueueManager.getNextVideo();
    setCurrentVideo(nextVideo);

    // Note: Timer will start automatically via useEffect when isGameReady becomes true
    // This happens when: isCameraReady && calibrationComplete && isFaceDetected && currentVideo !== null

    if (videoRef.current) {
      videoRef.current.currentTime = 0; // Reset video to start
      videoRef.current.play().catch((err) => console.warn('Auto-play error on resume:', err));
    }
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  // Two-Stage Smile Detection: Trigger fail phase
  const triggerFailPhase = useCallback(() => {
    if (isFailPhase) return; // Already in fail phase

    setIsFailPhase(true);

    // Pause video immediately
    setIsSmiling(true);
    setIsSmirking(true);

    // Play buzzer sound
    playBuzzer();

    // Clear any existing timers
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }

    // Haptic feedback for 2 seconds (if supported)
    triggerVibration([2000]);

    // Stop survival timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // After vibration completes (2 seconds), exit and reset
    setTimeout(() => {
      // Exit fullscreen
      setIsVideoFullscreen(false);

      // Submit score
      submitScore();

      // Set game over
      setGameOver(true);
    }, 2000);
  }, [isFailPhase, playBuzzer, triggerVibration, submitScore]);

  // Two-Stage Smile Detection: Reset warning state
  const resetWarningState = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    setWarningActive(false);
    setWarningTimer(null);
  }, []);

  // Two-Stage Smile Detection: Handle smirk detection with warning phase
  const handleSmirkDetected = useCallback(
    (isSmirking, probability, metadata = {}) => {
      // Handle two-stage detection
      const inWarningZone =
        metadata.inWarningZone ||
        (probability >= NEUTRAL_EXPRESSION_THRESHOLD && probability < SMILE_FAIL_THRESHOLD);

      // Stage 1: Warning Phase (0.15 ≤ probability < 0.30)
      if (inWarningZone && !warningActive && !isFailPhase) {
        setWarningActive(true);

        // Start warning timer
        warningTimerRef.current = setTimeout(() => {
          // Timer completed - check if still smiling
          setWarningActive(false);
          warningTimerRef.current = null;

          // If still smirking after warning, trigger fail
          if (isSmirking || probability >= SMILE_FAIL_THRESHOLD) {
            triggerFailPhase();
          }
        }, SMILE_WARNING_DURATION);

        setWarningTimer(warningTimerRef.current);
        return;
      }

      // Player recovered to neutral during warning
      if (!inWarningZone && warningActive && !isFailPhase) {
        resetWarningState();
        return;
      }

      // Stage 2: Fail Phase - Smirk detected after warning OR immediate fail
      if (isSmirking && !isFailPhase) {
        if (warningActive) {
          // Was in warning phase - clear timer and trigger fail
          resetWarningState();
        }
        triggerFailPhase();
        return;
      }

      // Normal state updates
      setIsSmirking(isSmirking);
    },
    [warningActive, isFailPhase, triggerFailPhase, resetWarningState]
  );

  // Handle tutorial completion
  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
  }, []);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthGate>
        <div
          className={`min-h-screen pop-art-bg halftone-overlay ${gameOver ? 'grayscale-game-over' : ''} ${isSmiling && currentView === 'game' ? 'smile-detected' : ''}`}
        >
        {/* FAIL Overlay - Two-Stage Detection Fail Phase */}
        {isFailPhase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-pop-red animate-pulse" style={{ backgroundColor: '#FF0000' }}>
            <div className="text-center pop-card p-8" style={{ backgroundColor: '#FFFF00' }}>
              <h2 className="text-6xl md:text-8xl font-bold text-pop-black mb-8 tracking-wider animate-bounce" style={{ color: '#000000', textShadow: '4px 4px 0 #FF0000' }}>
                FAIL!
              </h2>
              <p className="text-xl font-bold mb-4" style={{ color: '#000000' }}>You smiled! </p>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameOver && !isFailPhase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}>
            <div className="wasted-modal">
              <div className="text-center">
                <h2 className="wasted-text text-6xl md:text-8xl font-bold mb-8 tracking-wider" style={{ color: '#FF0000', textShadow: '4px 4px 0 #000000' }}>
                  WASTED
                </h2>
                <div className="survival-time mb-8">
                  <p className="text-lg mb-2 font-bold" style={{ color: '#000000' }}>You survived for</p>
                  <p className="text-4xl md:text-5xl font-bold" style={{ color: '#000000' }}>
                    {survivalTime.toFixed(2)} seconds
                  </p>
                </div>
                <button
                  onClick={handleResume}
                  className="try-again-btn font-bold py-4 px-12 transition-all duration-200"
                  style={{ 
                    backgroundColor: '#FF0000', 
                    color: '#FFFFFF', 
                    border: '3px solid #000000',
                    boxShadow: '4px 4px 0 #000000',
                    textTransform: 'uppercase'
                  }}
                >
                  TRY AGAIN
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <Navbar activeTab={currentView} setActiveTab={setCurrentView} user={currentUser} />

        {/* System Check Overlay - Shows on first load before anything else */}
        {/* Waits for BOTH cameraReady AND modelsLoaded before completing */}
        {showSystemCheck && currentView === 'game' && (
          <SystemCheckOverlay
            onCheckComplete={handleSystemCheckComplete}
            cameraReady={cameraReady}
            cameraError={cameraError}
            modelsLoaded={modelsLoaded}
            loadingProgress={loadingProgress}
            cpuFallback={cpuFallback}
            modelError={modelError}
            loadingStage={loadingStage}
          />
        )}

        {/* FaceTrackerMediaPipe - Mounted alongside SystemCheckOverlay to load models */}
        {showSystemCheck && currentView === 'game' && (
          <div style={{ display: 'none' }}>
            <FaceTrackerMediaPipe
              onCameraReady={handleCameraReady}
              onModelStatusChange={handleModelStatusChange}
              onCalibrationUpdate={handleCalibrationUpdate}
              onCalibrationComplete={handleCalibrationComplete}
              isCalibrating={false}
              calibrationComplete={false}
            />
          </div>
        )}

        {/* Calibration Overlay - Shows when camera is ready but before tutorial/game */}
        {isCalibrating && !calibrationComplete && !showTutorial && currentView === 'game' && (
          <Suspense fallback={<LoadingFallback />}>
            <CalibrationOverlay status={calibrationStatus} progress={calibrationProgress} />
          </Suspense>
        )}

        {/* Camera PiP - Shows in top-right corner after calibrationComplete */}
        {showCameraPiP && (
          <Suspense fallback={null}>
            <CameraPiP videoRef={cameraCanvasRef} config={PIP_CONFIG} />
          </Suspense>
        )}

        {/* Tutorial Overlay - Shows once on top of everything */}
        {showTutorial && (
          <Suspense fallback={<LoadingFallback />}>
            <TutorialOverlay onComplete={handleTutorialComplete} />
          </Suspense>
        )}

        {/* Main Content */}
        <div className="pt-6 pb-24 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Game View */}
            {currentView === 'game' && (
              <>
                <div className="text-center mb-12">
                  <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 via-pink-500 to-blue-400 bg-clip-text text-transparent bg-[length:300%_auto] animate-gradient">
                    Smirkle
                  </h1>
                  <p className="text-xl text-gray-400">Smile Detection Challenge</p>

                  {/* Game Readiness Status Indicator */}
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${isGameReady ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`}
                    ></div>
                    <span
                      className={`text-sm font-medium ${isGameReady ? 'text-green-400' : 'text-yellow-400'}`}
                    >
                      {isGameReady
                        ? '🎮 GAME READY - Timer Active'
                        : '⏳ Setting up camera and calibration...'}
                    </span>
                  </div>

                  {/* Readiness Details */}
                  {!isGameReady && (
                    <div className="mt-2 flex items-center justify-center gap-4 text-xs text-gray-500">
                      <span className={cameraReady ? 'text-green-400' : 'text-yellow-400'}>
                        {cameraReady ? '✅' : '⏳'} Camera
                      </span>
                      <span className={calibrationComplete ? 'text-green-400' : 'text-yellow-400'}>
                        {calibrationComplete ? '✅' : '⏳'} Calibration
                      </span>
                      <span className={isFaceDetected ? 'text-green-400' : 'text-yellow-400'}>
                        {isFaceDetected ? '✅' : '⏳'} Face
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                  {/* Video Player - Glassmorphism Card */}
                  <div className="lg:col-span-1">
                    <div className="rounded-3xl overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                      <VideoPlayer
                        isSmiling={isSmiling}
                        isEyesOpen={isEyesOpen}
                        videoRef={videoRef}
                        currentVideo={currentVideo}
                        survivalTime={survivalTime}
                        cameraRef={cameraCanvasRef}
                        isFullscreenActive={isVideoFullscreen}
                        onToggleFullscreen={() => setIsVideoFullscreen(!isVideoFullscreen)}
                        warningActive={warningActive}
                        failPhase={isFailPhase}
                      />
                      {isSmiling && (
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-md flex items-center justify-center">
                          <div className="text-center">
                            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                              SMILE DETECTED!
                            </h2>
                            <p className="text-lg text-purple-100 mb-6">
                              You're rocking this challenge!
                            </p>
                            <button
                              onClick={handleResume}
                              className="bg-white text-purple-900 font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                            >
                              Try Again
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Face Tracker - Glassmorphism Card */}
                  <div className="lg:col-span-1">
                    <div className="rounded-3xl overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_0_30px_rgba(139,92,246,0.3)] relative">
                      <FaceTrackerMediaPipe
                        onSmirkDetected={handleSmirkDetected}
                        onCameraReady={handleCameraReady}
                        onCalibrationUpdate={handleCalibrationUpdate}
                        onCalibrationComplete={handleCalibrationComplete}
                        onFaceCenteredUpdate={handleFaceCenteredUpdate}
                        onLowLightWarning={handleLowLightWarning}
                        onEyesOpenChange={setIsEyesOpen}
                        onModelStatusChange={handleModelStatusChange}
                        isCalibrating={isCalibrating}
                        calibrationComplete={calibrationComplete}
                        cameraCanvasRef={cameraCanvasRef}
                      />
                      {/* Guardian Logic Warning Boxes */}
                      <WarningBox
                        type="faceNotCentered"
                        visible={!isFaceCentered && isFaceDetected}
                      />
                      <WarningBox type="lowLight" visible={isLowLight} />
                      {/* Two-Stage Smile Detection Warning */}
                      <WarningBox type="smiling" visible={warningActive && !isFailPhase} />
                    </div>
                  </div>
                </div>

                {!isVideoFullscreen && (
                  <div className="text-center">
                    <button
                      onClick={handleResume}
                      className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold py-4 px-12 rounded-full shadow-2xl hover:shadow-xl transition-all duration-200 transform hover:scale-105 hover:rotate-1"
                    >
                      {gameOver ? '🔄 Try Again' : 'Start Game'}
                    </button>
                    <p className="mt-4 text-gray-400 text-sm">
                      Keep a poker face! Smile = Game Over 😮
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Leaderboard View */}
            {currentView === 'leaderboard' && (
              <div className="rounded-3xl shadow-[0_0_20px_rgba(59,130,246,0.5)] overflow-hidden bg-[#111827]/80">
                <Suspense fallback={<LoadingFallback />}>
                  <Leaderboard />
                </Suspense>
              </div>
            )}

            {/* Social Hub View */}
            {currentView === 'social' && (
              <Suspense fallback={<LoadingFallback />}>
                <SocialHub />
              </Suspense>
            )}

            {/* Submit View */}
            {currentView === 'submit' && (
              <div className="max-w-2xl mx-auto">
                <div className="rounded-3xl shadow-[0_0_20px_rgba(59,130,246,0.5)] overflow-hidden bg-[#111827]/80">
                  <Suspense fallback={<LoadingFallback />}>
                    <SubmitVideoForm />
                  </Suspense>
                </div>
              </div>
            )}

            {/* Settings View */}
            {currentView === 'settings' && (
              <Suspense fallback={<LoadingFallback />}>
                <ProfileSettings />
              </Suspense>
            )}

            {/* Teams/Squads View */}
            {currentView === 'teams' && (
              <Suspense fallback={<LoadingFallback />}>
                <Teams />
              </Suspense>
            )}

            {/* Profile View */}
            {currentView === 'profile' && (
              <div className="rounded-3xl shadow-[0_0_20px_rgba(59,130,246,0.5)] overflow-hidden bg-[#111827]/80">
                <Suspense fallback={<LoadingFallback />}>
                  <ProfilePage />
                </Suspense>
              </div>
            )}
          </div>
        </div>
      </div>
      <SpeedInsights />
      </AuthGate>
    </Suspense>
  );
}

export default App;
