import React from 'react';

// This component will eventually use the YouTube Iframe API
const YouTubePlayer = ({ videoQueue, currentVideoIndex, setCurrentVideoIndex }) => {
  const currentVideo = videoQueue[currentVideoIndex];

  return (
    <div className="w-full h-full flex items-center justify-center bg-black rounded-lg">
      {currentVideo ? (
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1`}
          title={currentVideo.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded-lg"
        ></iframe>
      ) : (
        <div className="text-center">
          <h3 className="text-2xl">Welcome to YoutuBro!</h3>
          <p className="text-gray-400">Use the chat below to find a video to play.</p>
        </div>
      )}
    </div>
  );
};

export default YouTubePlayer;