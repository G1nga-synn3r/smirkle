 import React, { useState, useEffect, useRef, useCallback } from 'react';
import './style.css';
import { useSoundEffects } from './hooks/useSoundEffects.js';
import { useHapticFeedback } from './hooks/useHapticFeedback.js';
import CameraView from './components/CameraView.jsx';
import WarningBox from './components/WarningBox.jsx';
import Navbar from './components/Navbar.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import SubmitVideoForm from './components/SubmitVideoForm.jsx';
import ProfilePage from './components/ProfilePage.jsx';
import ProfileSettings from './components/ProfileSettings.jsx';
import SocialHub from './components/SocialHub.jsx';
import AuthGate from './components/AuthGate.jsx';
import Teams from './components/Teams.jsx';
import TutorialOverlay from './components/TutorialOverlay.jsx';
import CalibrationOverlay from './components/CalibrationOverlay.jsx';
import SystemCheckOverlay from './components/SystemCheckOverlay.tsx';
import CameraPiP from './components/CameraPiP.jsx';
import FaceTrackerMediaPipe from './components/FaceTrackerMediaPipe.jsx';
import { getCurrentUser, isGuest, setCurrentUser } from './utils/auth.js';
import { VIDEO_DATABASE, videoQueueManager, DIFFICULTY, getVideosByDifficulty } from './data/videoLibrary.js';
import { saveScore, updateUserLifetimeScore } from './services/scoreService.js';
import { 
  SMILE_THRESHOLD, 
  SMILE_FAIL_THRESHOLD,
  NEUTRAL_EXPRESSION_THRESHOLD,
  SMILE_WARNING_DURATION,
  CALIBRATION_COMPLETE_TRANSITION,
  PIP_CONFIG,
  CALIBRATION_STATUS 
} from './utils/constants.js';
import { createCalibrationManager } from './utils/calibrationLogic.js';

console.log('[App] App.jsx loaded successfully');

// Checkpoint system configuration
// Time progression: 5min, 15min (5+10), 35min (15+20), 75min (35+40), 155min (75+80)
// Bonus progression: 1000, 2000, 3000, 4000, 5000...
const CHECKPOINTS = [
  { time: 300, bonus: 1000 },    // 5 minutes
  { time: 900, bonus: 2000 },    // 15 minutes
  { time: 2100, bonus: 3000 },   // 35 minutes
  { time: 4500, bonus: 4000 },   // 75 minutes
  { time: 9300, bonus: 5000 }    // 155 minutes
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
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [checkpointsHit, setCheckpointsHit] = useState([]);
  const [checkpointBonus, setCheckpointBonus] = useState(0);
  
  // System Check state
  const hasCompletedSystemCheck = localStorage.getItem('smirkle_systemCheckComplete');
  const [showSystemCheck, setShowSystemCheck] = useState(!hasCompletedSystemCheck);
  const [systemCheckPassed, setSystemCheckPassed] = useState(false);
  
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
  const isGameReady = isCameraReady && 
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

  // Callback when camera is ready from FaceTracker
  // Note: Calibration starts in handleSystemCheckComplete after BOTH camera AND models are ready
  const handleCameraReady = useCallback(() => {
    setIsCameraReady(true);
    console.log('[App] Camera ready');
  }, []);

  // Handle calibration updates from FaceTracker
  const handleCalibrationUpdate = useCallback((data) => {
    if (!isCalibrating || calibrationComplete || !calibrationManagerRef.current) {
      return;
    }
    
    // Process detection data through calibration manager
    const calibrationState = calibrationManagerRef.current.processDetection({
      faceDetected: data.faceDetected,
      eyesOpen: data.eyesOpen,
      happinessScore: data.happinessScore || 0
    });
    
    // Update UI state
    setCalibrationStatus(calibrationState.status);
    setCalibrationProgress(calibrationState.progress);
  }, [isCalibrating, calibrationComplete]);

  // Handle calibration completion
  const handleCalibrationComplete = useCallback((success, reason) => {
    if (success) {
      console.log('[App] Calibration complete! Triggering transition...');
      setCalibrationComplete(true);
      setIsCalibrating(false);
      setCalibrationStatus('complete');
      setCalibrationProgress(100);
      
      // Stop calibration manager
      if (calibrationManagerRef.current) {
        calibrationManagerRef.current.stop();
      }
    } else {
      console.log('[App] Calibration failed:', reason);
      setCalibrationStatus('failed');
      // Reset for retry
      setTimeout(() => {
        setIsCalibrating(false);
        setCalibrationStatus('idle');
      }, 2000);
    }
  }, []);

  // Handle system check completion - waits for BOTH camera and models
  const handleSystemCheckComplete = useCallback((data) => {
    console.log('[App] System check complete:', data);
    setSystemCheckPassed(data.cameraReady && data.modelsLoaded);
    setShowSystemCheck(false);
    // Mark system check as complete so next visit skips it
    localStorage.setItem('smirkle_systemCheckComplete', 'true');
    
    // Start calibration phase if models are loaded
    if (data.cameraReady && data.modelsLoaded) {
      setIsCameraReady(true);
      setIsCalibrating(true);
      setCalibrationStatus('checking');
      setCalibrationProgress(0);
      
      // Initialize calibration manager
      calibrationManagerRef.current = createCalibrationManager({
        onComplete: handleCalibrationComplete,
        onUpdate: (state) => {
          // Use functional updates to avoid stale state
          setCalibrationStatus(prev => state.status || prev);
          setCalibrationProgress(prev => state.progress ?? prev);
        }
      });
      
      // Start calibration
      calibrationManagerRef.current.start();
    }
  }, [handleCalibrationComplete]);
  
  // Handle model status changes from FaceTrackerMediaPipe
  const handleModelStatusChange = useCallback((status) => {
    console.log('[App] Model status update:', status);
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
        console.log(`🎯 Checkpoint reached! ${(checkpoint.time / 60).toFixed(1)} minutes - +${checkpoint.bonus} bonus`);
      }
    });
    
    if (newCheckpointsHit.length > checkpointsHit.length) {
      setCheckpointsHit(newCheckpointsHit);
      setCheckpointBonus(prev => prev + newCheckpointBonus);
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
        isGuest: false
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
      isGuest: false
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
      console.log('[App] Calibration complete! Starting transition sequence...');
      
      // Step 1: Hide calibration UI (with fade delay)
      const uiHideTimer = setTimeout(() => {
        setIsCalibrating(false);
      }, CALIBRATION_COMPLETE_TRANSITION.UI_HIDE_DELAY);
      
      // Step 2: Trigger fullscreen
      const fullscreenTimer = setTimeout(() => {
        console.log('[App] Entering fullscreen mode...');
        setIsVideoFullscreen(true);
      }, CALIBRATION_COMPLETE_TRANSITION.FULLSCREEN_DELAY);
      
      // Step 3: Show PiP camera
      const pipTimer = setTimeout(() => {
        console.log('[App] Showing PiP camera...');
        setShowCameraPiP(true);
      }, CALIBRATION_COMPLETE_TRANSITION.PIP_SHOW_DELAY);
      
      // Step 4: Start score counter immediately
      startTimeRef.current = Date.now();
      console.log('[App] Score timer started at:', startTimeRef.current);
      
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
      console.log('[Game] Auto-triggering fullscreen video...');
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
    console.log('[Game] Resetting game state...');
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
    console.log('[Game] Next video set:', nextVideo.title);
    
    // Note: Timer will start automatically via useEffect when isGameReady becomes true
    // This happens when: isCameraReady && calibrationComplete && isFaceDetected && currentVideo !== null
    
    if (videoRef.current) {
      videoRef.current.currentTime = 0; // Reset video to start
      videoRef.current.play().catch(err => console.warn('Auto-play error on resume:', err));
      console.log('[Game] Video playing...');
    }
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  // Two-Stage Smile Detection: Trigger fail phase
  const triggerFailPhase = useCallback(() => {
    if (isFailPhase) return; // Already in fail phase
    
    console.log('[App] FAIL PHASE triggered - smile detected after warning');
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
      console.log('[App] Fail phase complete - exiting game');
      
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
  const handleSmirkDetected = useCallback((isSmirking, probability, metadata = {}) => {
    // Handle two-stage detection
    const inWarningZone = metadata.inWarningZone || (probability >= NEUTRAL_EXPRESSION_THRESHOLD && probability < SMILE_FAIL_THRESHOLD);
    
    // Stage 1: Warning Phase (0.15 ≤ probability < 0.30)
    if (inWarningZone && !warningActive && !isFailPhase) {
      console.log('[App] Warning phase started - happiness:', probability.toFixed(2));
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
      console.log('[App] Warning cleared - player recovered');
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
  }, [warningActive, isFailPhase, triggerFailPhase, resetWarningState]);

  // Handle tutorial completion
  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
  }, []);

  return (
    <AuthGate>
      <div className={`min-h-screen animated-radial-gradient ${gameOver ? 'grayscale-game-over' : ''} ${isSmiling && currentView === 'game' ? 'smile-detected' : ''}`}>
        {/* FAIL Overlay - Two-Stage Detection Fail Phase */}
        {isFailPhase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-600/90 animate-pulse">
            <div className="text-center">
              <h2 className="text-6xl md:text-8xl font-bold text-white mb-8 tracking-wider animate-bounce">
                FAIL
              </h2>
              <p className="text-xl text-red-100 mb-4">You smiled!</p>
            </div>
          </div>
        )}
        
        {/* Game Over Overlay */}
        {gameOver && !isFailPhase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="wasted-modal">
              <div className="text-center">
                <h2 className="wasted-text text-6xl md:text-8xl font-bold text-red-500 mb-8 tracking-wider">
                  WASTED
                </h2>
                <div className="survival-time mb-8">
                  <p className="text-gray-400 text-lg mb-2">You survived for</p>
                  <p className="text-4xl md:text-5xl font-bold text-white">
                    {survivalTime.toFixed(2)} seconds
                  </p>
                </div>
                <button
                  onClick={handleResume}
                  className="try-again-btn bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-12 rounded-full shadow-2xl transition-all duration-200 transform hover:scale-110"
                >
                  TRY AGAIN
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <Navbar 
          activeTab={currentView}
          setActiveTab={setCurrentView}
          user={currentUser}
        />
        
        {/* System Check Overlay - Shows on first load before anything else */}
        {/* Waits for BOTH camera ready AND models loaded before completing */}
        {showSystemCheck && currentView === 'game' && (
          <SystemCheckOverlay 
            onCheckComplete={handleSystemCheckComplete}
            modelsLoading={modelsLoading}
            modelsLoaded={modelsLoaded}
            loadingStage={loadingStage}
            loadingProgress={loadingProgress}
            cpuFallback={cpuFallback}
            modelError={modelError}
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
          <CalibrationOverlay 
            status={calibrationStatus}
            progress={calibrationProgress}
          />
        )}
        
        {/* Camera PiP - Shows in top-right corner after calibrationComplete */}
        {showCameraPiP && (
          <CameraPiP 
            videoRef={cameraCanvasRef}
            config={PIP_CONFIG}
          />
        )}
        
        {/* Tutorial Overlay - Shows once on top of everything */}
        {showTutorial && (
          <TutorialOverlay onComplete={handleTutorialComplete} />
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
                    <div className={`w-3 h-3 rounded-full ${isGameReady ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`}></div>
                    <span className={`text-sm font-medium ${isGameReady ? 'text-green-400' : 'text-yellow-400'}`}>
                      {isGameReady ? '🎮 GAME READY - Timer Active' : '⏳ Setting up camera and calibration...'}
                    </span>
                  </div>
                  
                  {/* Readiness Details */}
                  {!isGameReady && (
                    <div className="mt-2 flex items-center justify-center gap-4 text-xs text-gray-500">
                      <span className={isCameraReady ? 'text-green-400' : 'text-yellow-400'}>
                        {isCameraReady ? '✅' : '⏳'} Camera
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
                            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">SMILE DETECTED!</h2>
                            <p className="text-lg text-purple-100 mb-6">You're rocking this challenge!</p>
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
                      <WarningBox 
                        type="lowLight"
                        visible={isLowLight}
                      />
                      {/* Two-Stage Smile Detection Warning */}
                      <WarningBox
                        type="smiling"
                        visible={warningActive && !isFailPhase}
                      />
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
                <Leaderboard />
              </div>
            )}

            {/* Social Hub View */}
            {currentView === 'social' && (
              <SocialHub />
            )}

            {/* Submit View */}
            {currentView === 'submit' && (
              <div className="max-w-2xl mx-auto">
                <div className="rounded-3xl shadow-[0_0_20px_rgba(59,130,246,0.5)] overflow-hidden bg-[#111827]/80">
                  <SubmitVideoForm />
                </div>
              </div>
            )}

            {/* Settings View */}
            {currentView === 'settings' && (
              <ProfileSettings />
            )}

            {/* Teams/Squads View */}
            {currentView === 'teams' && <Teams />}

            {/* Profile View */}
            {currentView === 'profile' && (
              <div className="rounded-3xl shadow-[0_0_20px_rgba(59,130,246,0.5)] overflow-hidden bg-[#111827]/80">
                <ProfilePage />
              </div>
            )}

          </div>
        </div>
      </div>
    </AuthGate>
  );
}

export default App;
