import React, { useEffect, useRef } from "react";
import youtubroLogo from "../assets/youtuBro_logo.png"

const YouTubePlayer = ({
  videoQueue,
  currentVideoIndex,
  setCurrentVideoIndex,
  isPlaying,
  isMuted,
}) => {
  const playerRef = useRef(null);
  const currentVideo = videoQueue[currentVideoIndex];

  useEffect(() => {
    // This function will be called by the event handlers.
    // It's defined inside the effect so it always has the latest props.
    const advanceToNextVideo = () => {
      if (currentVideoIndex < videoQueue.length - 1) {
        setCurrentVideoIndex(currentVideoIndex + 1);
      }
    };

    // This function initializes the YouTube player.
    const createPlayer = () => {
      playerRef.current = new window.YT.Player("player-div", {
        height: "100%",
        width: "100%",
        videoId: currentVideo.id, // Use the current video ID on creation
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          controls: 1, 
        },
        events: {
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              advanceToNextVideo();
            }
          },
        },
      });
    };

    // Main logic to handle player creation.
    if (currentVideo) {
      if (window.YT && window.YT.Player) {
        createPlayer();
      } else {
        // If the API isn't ready, the script will call this global function.
        window.onYouTubeIframeAPIReady = createPlayer;
      }
    }

    // This is the cleanup function. It runs when the component re-renders or unmounts.
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [currentVideo]); // This effect re-runs ONLY when the video changes.

  // Effects to control play/pause and mute/unmute
  useEffect(() => {
    if (playerRef.current?.playVideo) {
      isPlaying
        ? playerRef.current.playVideo()
        : playerRef.current.pauseVideo();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (playerRef.current?.mute) {
      isMuted ? playerRef.current.mute() : playerRef.current.unMute();
    }
  }, [isMuted]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black rounded-lg">
      <div id="player-div" className="w-full h-full"></div>

      {/* This block is shown only when the video queue is empty */}
      {videoQueue.length === 0 && (
        <div className="absolute text-center">
          <img
            src={youtubroLogo}
            alt="YoutuBro Logo"
            className="w-48 mx-auto mb-4 animate-bounce"
          />
          <h3 className="text-2xl font-bold">Welcome to YoutuBro!</h3>
          <p className="text-gray-400">
            Use the chat below to find a video to play.
          </p>
        </div>
      )}
    </div>
  );
};

export default YouTubePlayer;
