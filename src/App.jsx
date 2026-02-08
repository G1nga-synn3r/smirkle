import React, { useRef, useState } from 'react';
import './style.css';
import CameraView from './components/CameraView.jsx';
import VideoPlayer from './components/VideoPlayer.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import { useFaceApi } from './hooks/useFaceApi.js';

function App() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const { isSmiling } = useFaceApi(videoRef);

  const handleStream = (stream) => {
    setStream(stream);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="max-w-6xl w-full mx-auto px-4">
        <h1 className="text-6xl font-bold mb-8 text-center">Smirkle</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
              <CameraView onStream={handleStream} />
              {stream && (
                <VideoPlayer stream={stream} />
              )}
            </div>
          </div>
          <div className="lg:col-span-1">
            <Leaderboard isSmiling={isSmiling} />
          </div>
        </div>
        <div className="text-center">
          <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg">
            {isSmiling ? '😀 Smiling!' : 'Start Smiling'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;