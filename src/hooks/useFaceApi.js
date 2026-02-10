import { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { SMILE_THRESHOLD, MODEL_URL } from '../utils/constants';

export function useFaceApi(webcamRef) {
  const [isSmiling, setIsSmiling] = useState(false);
  const [modelError, setModelError] = useState(null);
  const intervalRef = useRef(null);

  async function loadModels() {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    } catch (error) {
      console.error('Error loading face-api models:', error);
      if (error.message && error.message.includes('fetch')) {
        setModelError('Failed to load face detection models. Please check that model files exist in /public/models.');
      } else {
        setModelError('Failed to initialize face detection: ' + error.message);
      }
    }
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
        const isSmiling = expressions.happy > SMILE_THRESHOLD;
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