import { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

export function useFaceApi(webcamRef) {
  const [isSmiling, setIsSmiling] = useState(false);
  const intervalRef = useRef(null);

  async function loadModels() {
    const MODEL_URL = import.meta.env.BASE_URL + '/models' || '/models';
    
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
  }

  function handleVideoPlay() {
    if (!webcamRef.current || !webcamRef.current.videoWidth || !webcamRef.current.videoHeight) {
      return;
    }

    intervalRef.current = setInterval(async () => {
      const displaySize = { width: webcamRef.current.videoWidth, height: webcamRef.current.videoHeight };
      const detections = await faceapi.detectAllFaces(
        webcamRef.current,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceExpressions();

      if (detections && detections.length > 0) {
        const expressions = detections[0].expressions;
        const isSmiling = expressions.happy > 0.4;
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

  return { isSmiling, loadModels, handleVideoPlay };
}