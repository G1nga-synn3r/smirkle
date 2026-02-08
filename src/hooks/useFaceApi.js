import { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

export function useFaceApi(videoRef) {
  const [isSmiling, setIsSmiling] = useState(false);
  const [happinessScore, setHappinessScore] = useState(0);
  const intervalRef = useRef(null);

  async function loadModels() {
    const MODEL_URL = process.env.PUBLIC_URL + '/models';
    
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
  }

  function handleVideoPlay() {
    if (!videoRef.current || !videoRef.current.videoWidth || !videoRef.current.videoHeight) {
      return;
    }

    intervalRef.current = setInterval(async () => {
      const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceExpressions();

      if (detections && detections.length > 0) {
        const expressions = detections[0].expressions;
        const happiness = expressions.happy;
        setHappinessScore(happiness);
        const isSmiling = happiness > 0.4;
        setIsSmiling(isSmiling);
      }
    }, 200);
  }

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { isSmiling, happinessScore, loadModels, handleVideoPlay };
}