import React, { useEffect } from 'react';

function VideoPlayer({ stream, videoRef, isSmiling }) {
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (isSmiling && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isSmiling, videoRef]);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover"
      autoPlay
      playsInline
      muted
    />
  );
}

export default VideoPlayer;