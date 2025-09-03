import React, { useEffect, useRef } from 'react';

const YouTubePlayer = ({ videoQueue, currentVideoIndex, setCurrentVideoIndex }) => {
  const playerRef = useRef(null);
  const currentVideo = videoQueue[currentVideoIndex];

  // This ref holds the latest state and props for our event handlers
  const stateRef = useRef({ videoQueue, currentVideoIndex, setCurrentVideoIndex });
  useEffect(() => {
    stateRef.current = { videoQueue, currentVideoIndex, setCurrentVideoIndex };
  });

  // This effect runs once to create the player
  useEffect(() => {
    const createPlayer = () => {
      // This function is called when the player's state changes
      const onPlayerStateChange = (event) => {
        // Use the ref to get the latest state, avoiding stale closures
        const { videoQueue, currentVideoIndex, setCurrentVideoIndex } = stateRef.current;
        
        // Check if the video has ended (state 0)
        if (event.data === window.YT.PlayerState.ENDED) {
          if (currentVideoIndex < videoQueue.length - 1) {
            console.log("Video ended, playing next in queue.");
            setCurrentVideoIndex(currentVideoIndex + 1);
          } else {
            console.log("End of queue.");
          }
        }
      };

      playerRef.current = new window.YT.Player('player-div', {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 1,
          mute: 0,
          playsinline: 1,
        },
        events: {
          'onStateChange': onPlayerStateChange,
        },
      });
    };

    if (!window.YT) {
      window.onYouTubeIframeAPIReady = createPlayer;
    } else {
      createPlayer();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []); // Empty array ensures this runs only once on mount

  // This effect runs whenever the video to be played changes
  useEffect(() => {
    if (playerRef.current && playerRef.current.loadVideoById && currentVideo) {
      playerRef.current.loadVideoById(currentVideo.id);
    }
  }, [currentVideo]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black rounded-lg">
      <div id="player-div" className="w-full h-full"></div>
      
      {videoQueue.length === 0 && (
        <div className="absolute text-center">
          {/* <h3 className="text-2xl">Welcome to YoutuBro!</h3>
          <p className="text-gray-400">Use the chat below to find a video to play.</p> */}
        </div>
      )}
    </div>
  );
};

export default YouTubePlayer;