import React, { useRef } from 'react';
import Webcam from 'react-webcam';

function CameraView({ onStream }) {
  const webcamRef = useRef(null);

  const handleUserMedia = (stream) => {
    if (onStream) {
      onStream(stream);
    }
  };

  return (
    <Webcam
      ref={webcamRef}
      audio={false}
      videoConstraints={{ facingMode: 'user' }}
      onUserMedia={handleUserMedia}
      className="w-full h-full object-cover"
    />
  );
}

export default CameraView;