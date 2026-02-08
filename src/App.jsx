import React, { useRef, useState } from 'react';
import './style.css';
import { useFaceApi } from './hooks/useFaceApi.js';

function App() {
  const videoRef = useRef(null);
  const webcamRef = useRef(null);
  const [isSmiling, setIsSmiling] = useState(false);
  const { loadModels, handleVideoPlay } = useFaceApi(webcamRef);

  const handleResume = () => {
    setIsSmiling(false);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="max-w-7xl w-full mx-auto px-4">
        <h1 className="text-5xl font-bold mb-8 text-center text-cyan-400">Smirkle</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl relative">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                src="https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
              />
              {isSmiling && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <h2 className="text-6xl font-bold text-white bg-cyan-500 px-8 py-4 rounded-full">SMILE DETECTED!</h2>
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl relative">
              <video
                ref={webcamRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <div className="absolute top-4 right-4 bg-cyan-500 text-white px-4 py-2 rounded-full">
                Webcam
              </div>
            </div>
          </div>
        </div>
        <div className="text-center space-y-4">
          <button
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={handleVideoPlay}
          >
            Start Smiling
          </button>
          {isSmiling && (
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
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