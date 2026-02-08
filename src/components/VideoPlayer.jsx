import React, { useEffect, useRef } from 'react';

function VideoPlayer({ isSmiling, videoRef: propVideoRef }) {
  const localVideoRef = useRef(null);
  // Use passed ref or local ref
  const videoElement = propVideoRef || localVideoRef;

  useEffect(() => {
    const video = videoElement.current;
    if (video) {
      video.load();
      video.play();
    }
  }, []);

  useEffect(() => {
    const video = videoElement.current;
    if (isSmiling && video) {
      video.pause();
    }
  }, [isSmiling]);

  return (
    <video
      ref={videoElement}
      className="w-full h-full object-cover"
      autoPlay
      playsInline
      muted
      loop
      src="https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
    />
  );
}

export default VideoPlayer;