 import React, { useState, useEffect, useRef, useCallback } from 'react';
import './style.css';
import { useFaceApi } from './hooks/useFaceApi.js';
import { useSoundEffects } from './hooks/useSoundEffects.js';
import { useHapticFeedback } from './hooks/useHapticFeedback.js';
import CameraView from './components/CameraView.jsx';
import VideoPlayer from './components/VideoPlayer.jsx';
import FaceTracker from './components/FaceTracker.jsx';
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
import SystemCheckOverlay from './components/SystemCheckOverlay.jsx';
import { getCurrentUser, isGuest, setCurrentUser } from './utils/auth.js';
import { VIDEO_DATABASE, videoQueueManager, DIFFICULTY, getVideosByDifficulty } from './data/videoLibrary.js';
import { saveScore, updateUserLifetimeScore } from './services/scoreService.js';
import { SMILE_THRESHOLD } from './utils/constants.js';

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
  const videoRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const { loadModels, handleVideoPlay } = useFaceApi(videoRef);
  const { isMuted, playBuzzer, playDing, toggleMute, resumeAudio } = useSoundEffects();
  const { triggerVibration } = useHapticFeedback();

  // Callback when camera is ready from FaceTracker
  const handleCameraReady = useCallback(() => {
    setIsCameraReady(true);
    // Start calibration phase
    setIsCalibrating(true);
    setCalibrationStatus('waiting');
    setCalibrationProgress(0);
  }, []);

  // Handle calibration updates from FaceTracker
  const handleCalibrationUpdate = useCallback((data) => {
    if (!isCalibrating || calibrationComplete) return;
    
    if (data.faceDetected) {
      setCalibrationStatus(data.isStable ? 'stable' : 'detecting');
      setCalibrationProgress(data.progress);
    } else {
      setCalibrationStatus('waiting');
      setCalibrationProgress(0);
    }
  }, [isCalibrating, calibrationComplete]);

  // Handle calibration completion
  const handleCalibrationComplete = useCallback((success) => {
    if (success) {
      setCalibrationComplete(true);
      setIsCalibrating(false);
      setCalibrationStatus('complete');
    } else {
      setCalibrationStatus('failed');
    }
  }, []);

  // Handle system check completion
  const handleSystemCheckComplete = useCallback((passed) => {
    setSystemCheckPassed(passed);
    setShowSystemCheck(false);
    // Mark system check as complete so next visit skips it
    localStorage.setItem('smirkle_systemCheckComplete', 'true');
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
    }
  }, [isSmirking, gameOver, playBuzzer, submitScore]);

  // Trigger haptic feedback and visual effects when smile is detected
  useEffect(() => {
    if (isSmiling && currentView === 'game') {
      // Trigger strong haptic feedback pattern
      triggerVibration([100, 200, 100]); // Heavy vibration pattern
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
    resumeAudio(); // Resume audio context on interaction
    
    // Get next video from queue (anti-repeat)
    const nextVideo = videoQueueManager.getNextVideo();
    setCurrentVideo(nextVideo);
    
    // Note: Timer will start automatically via useEffect when isGameReady becomes true
    // This happens when: isCameraReady && calibrationComplete && isFaceDetected && currentVideo !== null
    
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  // Accept smirk and probability from FaceTracker
  const handleSmirkDetected = useCallback((isSmirking, probability) => {
    setIsSmirking(isSmirking);
  }, []);

  // Handle tutorial completion
  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
  }, []);

  return (
    <AuthGate>
      <div className={`min-h-screen animated-radial-gradient ${gameOver ? 'grayscale-game-over' : ''} ${isSmiling && currentView === 'game' ? 'smile-detected' : ''}`}>
        {/* Game Over Overlay */}
        {gameOver && (
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
        {showSystemCheck && currentView === 'game' && (
          <SystemCheckOverlay onCheckComplete={handleSystemCheckComplete} />
        )}
        
        {/* Calibration Overlay - Shows when camera is ready but before tutorial/game */}
        {isCalibrating && !calibrationComplete && !showTutorial && currentView === 'game' && (
          <CalibrationOverlay 
            status={calibrationStatus}
            progress={calibrationProgress}
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
                        videoRef={videoRef} 
                        currentVideo={currentVideo}
                        survivalTime={survivalTime}
                        cameraRef={cameraCanvasRef}
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
                  
                  {/* Webcam - Glassmorphism Card */}
                  <div className="lg:col-span-1">
                    <div className="rounded-3xl overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                      <CameraView onStream={handleVideoPlay} />
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-lg">
                        Webcam
                      </div>
                    </div>
                  </div>
                  
                  {/* Face Tracker - Glassmorphism Card */}
                  <div className="lg:col-span-1">
                    <div className="rounded-3xl overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_0_30px_rgba(139,92,246,0.3)] relative">
                      <FaceTracker 
                        onSmirkDetected={handleSmirkDetected} 
                        onCameraReady={handleCameraReady}
                        onCalibrationUpdate={handleCalibrationUpdate}
                        onCalibrationComplete={handleCalibrationComplete}
                        onFaceCenteredUpdate={handleFaceCenteredUpdate}
                        onLowLightWarning={handleLowLightWarning}
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
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <button
                    onClick={handleVideoPlay}
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold py-4 px-12 rounded-full shadow-2xl hover:shadow-xl transition-all duration-200 transform hover:scale-105 hover:rotate-1"
                  >
                    {isSmiling ? 'Start Over' : 'Start Smiling'}
                  </button>
                  <p className="mt-4 text-gray-400 text-sm">
                    Smile at the camera to pause the video!
                  </p>
                </div>
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
