import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

function FaceTracker({ onSmile }) {
  const videoRef = useRef(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  // Load face-api.js models on component mount
  useEffect(() => {
    async function loadModels() {
      try {
        const MODEL_URL = import.meta.env.BASE_URL + '/models' || '/models';
        
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        
        setIsModelsLoaded(true);
      } catch (err) {
        console.error('Error loading models:', err);
        setError('Failed to load AI models. Please refresh the page.');
      }
    }

    loadModels();

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Initialize webcam when models are loaded
  useEffect(() => {
    if (!isModelsLoaded) return;

    async function initWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          videoRef.current.onloadedmetadata = () => {
            setIsVideoReady(true);
            startFaceDetection();
          };
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
        setError('Failed to access webcam. Please allow camera permissions.');
      }
    }

    initWebcam();
  }, [isModelsLoaded]);

  // Start face detection when video is ready
  function startFaceDetection() {
    if (!videoRef.current || !isVideoReady) return;

    const detectFaces = async () => {
      if (!videoRef.current) return;

      try {
        const displaySize = {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight
        };

        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceExpressions();

        // Process detections here if needed
        if (detections && detections.length > 0) {
          const expressions = detections[0].expressions;
          const isHappy = expressions.happy > 0.4;
          if (onSmile) {
            onSmile(isHappy);
          }
        }
      } catch (err) {
        console.error('Face detection error:', err);
      }

      // Continue detection loop
      if (videoRef.current && !videoRef.current.paused) {
        animationRef.current = requestAnimationFrame(detectFaces);
      }
    };

    detectFaces();
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-900/20 rounded-3xl border-2 border-red-500/30">
        <div className="text-center p-6">
          <p className="text-red-400 text-lg mb-2">⚠️ Error</p>
          <p className="text-white">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black rounded-3xl overflow-hidden shadow-2xl border border-purple-500/20 backdrop-blur-sm">
      {/* Loading Overlay - only visible until models are loaded */}
      {!isModelsLoaded && (
        <div className="absolute inset-0 z-50 bg-gradient-to-br from-purple-900/90 via-pink-900/90 to-red-900/90 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mb-4"></div>
          <p className="text-white text-xl font-semibold">Loading AI Models...</p>
          <p className="text-purple-200 text-sm mt-2">Initializing Face Detection</p>
        </div>
      )}

      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${!isModelsLoaded ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Status Badge */}
      {isModelsLoaded && (
        <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-lg">
          🦁 Eye of the Beholder
        </div>
      )}

      {/* Model Status Indicator */}
      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isModelsLoaded ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`}></div>
          <span className="text-white text-xs">
            {isModelsLoaded ? 'AI Active' : 'Loading...'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default FaceTracker;
