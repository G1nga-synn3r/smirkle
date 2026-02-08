import { useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';

export function useFaceApi(videoRef) {
  const [isSmiling, setIsSmiling] = useState(false);

  useEffect(() => {
    async function loadModels() {
      const MODEL_URL = process.env.PUBLIC_URL + '/models';
      
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    }

    loadModels();
  }, []);

  useEffect(() => {
    async function detectFaces() {
      if (!videoRef.current || !videoRef.current.videoWidth || !videoRef.current.videoHeight) {
        return;
      }

      const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceExpressions();

      if (detections && detections.length > 0) {
        const expressions = detections[0].expressions;
        const isSmiling = expressions.happy > 0.3;
        setIsSmiling(isSmiling);
      }
    }

    const interval = setInterval(detectFaces, 200);

    return () => clearInterval(interval);
  }, [videoRef]);

  return { isSmiling };
}

export async function loadModels() {
  const MODEL_URL = process.env.PUBLIC_URL + '/models';
  
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
}