import React, { useState, useEffect, useRef, useCallback } from 'react';
import './style.css';
import { useFaceApi } from './hooks/useFaceApi.js';
import { useSoundEffects } from './hooks/useSoundEffects.js';
import CameraView from './components/CameraView.jsx';
import VideoPlayer from './components/VideoPlayer.jsx';
import FaceTracker from './components/FaceTracker.jsx';
import WarningBox from './components/WarningBox.jsx';
import Navbar from './components/Navbar.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import SubmitVideoForm from './components/SubmitVideoForm.jsx';
import ProfilePage from './components/ProfilePage.jsx';
import AuthGate from './components/AuthGate.jsx';
import Teams from './components/Teams.jsx';
import TutorialOverlay from './components/TutorialOverlay.jsx';
import CalibrationOverlay from './components/CalibrationOverlay.jsx';
import { getCurrentUser, isGuest, setCurrentUser } from './utils/auth.js';
import { VIDEO_DATABASE, videoQueueManager, DIFFICULTY, getVideosByDifficulty } from './data/videoLibrary.js';
import { saveScore } from './services/scoreService.js';
import { SMILE_THRESHOLD } from './utils/constants.js';

console.log('[App] App.jsx loaded successfully');

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
  
  // Calibration Phase states
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationComplete, setCalibrationComplete] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [calibrationStatus, setCalibrationStatus] = useState('waiting'); // 'waiting' | 'detecting' | 'stable' | 'complete' | 'failed'
  
  // Guardian Logic: Warning states
  const [isFaceDetected, setIsFaceDetected] = useState(true);
  const [isFaceCentered, setIsFaceCentered] = useState(true);
  const [isLowLight, setIsLowLight] = useState(false);
  
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
  const { loadModels, handleVideoPlay } = useFaceApi(videoRef);
  const { isMuted, playBuzzer, playDing, toggleMute, resumeAudio } = useSoundEffects();

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

  // Start survival timer when entering game view
  useEffect(() => {
    // Cleanup any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (currentView === 'game' && !gameOver) {
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
  }, [currentView, gameOver]);

  // Submit score to leaderboard (only for non-guests) - defined early to avoid initialization issues
  const submitScore = useCallback(() => {
    const user = getCurrentUser();
    
    // Don't submit scores for guests
    if (isGuest()) {
      return;
    }
    
    if (!user || !survivalTime) return;
    
    // Calculate score (survival time in seconds * 100)
    const score = Math.floor(survivalTime * 100);
    
    // Get existing scores
    const savedScores = localStorage.getItem('smirkle-scores');
    const scores = savedScores ? JSON.parse(savedScores) : [];
    
    // Add new score
    const newScore = {
      id: Date.now(),
      name: user.username,
      score: score,
      time: survivalTime,
      date: new Date().toISOString().split('T')[0],
      isGuest: false
    };
    
    scores.push(newScore);
    localStorage.setItem('smirkle-scores', JSON.stringify(scores));
  }, [survivalTime]);

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
    resumeAudio(); // Resume audio context on interaction
    
    // Get next video from queue (anti-repeat)
    const nextVideo = videoQueueManager.getNextVideo();
    setCurrentVideo(nextVideo);
    
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setSurvivalTime((Date.now() - startTimeRef.current) / 1000);
    }, 100);
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
      <div className={`min-h-screen animated-radial-gradient ${gameOver ? 'grayscale-game-over' : ''}`}>
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
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                  {/* Video Player - Glassmorphism Card */}
                  <div className="lg:col-span-1">
                    <div className="rounded-3xl overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                      <VideoPlayer isSmiling={isSmiling} videoRef={videoRef} currentVideo={currentVideo} />
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

            {/* Submit View */}
            {currentView === 'submit' && (
              <div className="max-w-2xl mx-auto">
                <div className="rounded-3xl shadow-[0_0_20px_rgba(59,130,246,0.5)] overflow-hidden bg-[#111827]/80">
                  <SubmitVideoForm />
                </div>
              </div>
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
