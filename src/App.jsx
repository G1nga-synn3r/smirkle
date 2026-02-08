import React, { useState, useEffect, useRef } from 'react';
import './style.css';
import { useFaceApi } from './hooks/useFaceApi.js';
import CameraView from './components/CameraView.jsx';
import VideoPlayer from './components/VideoPlayer.jsx';
import FaceTracker from './components/FaceTracker.jsx';
import Navbar from './components/Navbar.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import SubmitVideoForm from './components/SubmitVideoForm.jsx';

function App() {
  const [isSmiling, setIsSmiling] = useState(false);
  const [currentView, setCurrentView] = useState('game');
  const videoRef = useRef(null);
  const { loadModels, handleVideoPlay } = useFaceApi(videoRef);

  useEffect(() => {
    loadModels();
  }, []);

  const handleResume = () => {
    setIsSmiling(false);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      {/* Navigation */}
      <Navbar currentView={currentView} onNavigate={handleNavigate} />
      
      {/* Main Content */}
      <div className="pt-20 px-4 pb-8">
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
                {/* Video Player - Card with rounded-3xl and blue glow */}
                <div className="lg:col-span-1">
                  <div className="rounded-3xl shadow-[0_0_20px_rgba(59,130,246,0.5)] overflow-hidden bg-[#111827]/80">
                    <VideoPlayer isSmiling={isSmiling} videoRef={videoRef} />
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
                
                {/* Webcam - Card with rounded-3xl and blue glow */}
                <div className="lg:col-span-1">
                  <div className="rounded-3xl shadow-[0_0_20px_rgba(59,130,246,0.5)] overflow-hidden bg-[#111827]/80">
                    <CameraView onStream={handleVideoPlay} />
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-lg">
                      Webcam
                    </div>
                  </div>
                </div>
                
                {/* Face Tracker - Card with rounded-3xl and blue glow */}
                <div className="lg:col-span-1">
                  <div className="rounded-3xl shadow-[0_0_20px_rgba(59,130,246,0.5)] overflow-hidden bg-[#111827]/80">
                    <FaceTracker />
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

        </div>
      </div>
    </div>
  );
}

export default App;
