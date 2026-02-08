import React, { useRef, useState } from 'react';
import './style.css';
import CameraView from './components/CameraView.jsx';
import VideoPlayer from './components/VideoPlayer.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import { useFaceApi } from './hooks/useFaceApi.js';

function App() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isSmiling, setIsSmiling] = useState(false);
  const { happinessScore, loadModels, handleVideoPlay } = useFaceApi(videoRef);

  const handleStream = (stream) => {
    setStream(stream);
  };

  const handleResume = () => {
    setIsSmiling(false);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="max-w-6xl w-full mx-auto px-4">
        <h1 className="text-6xl font-bold mb-8 text-center text-cyan-400">Smirkle</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg relative">
              <CameraView onStream={handleStream} />
              {stream && (
                <VideoPlayer
                  stream={stream}
                  videoRef={videoRef}
                  isSmiling={isSmiling}
                />
              )}
              {isSmiling && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <h2 className="text-6xl font-bold text-white">SMILE DETECTED!</h2>
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-1">
            <Leaderboard isSmiling={isSmiling} />
            <div className="bg-gray-800 rounded-lg p-4 mt-4">
              <h3 className="text-lg font-bold mb-2 text-center text-cyan-400">Smile Meter</h3>
              <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
                <div 
                  className="bg-green-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${(happinessScore / 0.4) * 100}%` }}
                ></div>
              </div>
              <p className="text-center text-sm text-gray-400">{happinessScore.toFixed(2)} / 0.4</p>
            </div>
          </div>
        </div>
        <div className="text-center space-y-4">
          <button
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg"
            onClick={handleVideoPlay}
          >
            Start Smiling
          </button>
          {isSmiling && (
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg"
              onClick={handleResume}
            >
              Resume
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;