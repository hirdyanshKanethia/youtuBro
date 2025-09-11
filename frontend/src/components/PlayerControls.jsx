import React from "react";
import {
  IoPlay,
  IoPause,
  IoPlaySkipForward,
  IoVolumeHigh,
  IoVolumeMute,
  IoClose,
  IoAddCircleOutline,
} from "react-icons/io5";

import { BsCardList } from "react-icons/bs";

const PlayerControls = ({
  isPlaying,
  onPlayPause,
  onNext,
  isMuted,
  onMuteToggle,
  isQueueOpen,
  onToggleQueue,
  onAddToPlaylist
}) => {
  return (
    // Use justify-between to push items to the top and bottom
    <div className="h-full flex flex-col justify-between items-center bg-black rounded-lg p-2">
      {/* Top group of controls */}
      <div className="flex flex-col items-center gap-6">
        <button
          onClick={onPlayPause}
          className="text-white bg-gradient-to-r from-purple-600 to-pink-500 p-3 rounded-full cursor-pointer"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <IoPause size={24} /> : <IoPlay size={24} />}
        </button>
        <button
          onClick={onNext}
          className="text-gray-300 hover:text-white bg-gradient-to-r from-purple-600 to-pink-500 rounded-full p-1 cursor-pointer"
          title="Next Video"
        >
          <IoPlaySkipForward size={24} />
        </button>
        <button
          onClick={onMuteToggle}
          className="text-gray-300 hover:text-white bg-gradient-to-r from-purple-600 to-pink-500 rounded-full p-1 cursor-pointer"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <IoVolumeMute size={24} /> : <IoVolumeHigh size={24} />}
        </button>
        <button
          onClick={onAddToPlaylist}
          className="text-gray-300 hover:text-white cursor-pointer"
          title="Add to a playlist"
        >
          <IoAddCircleOutline size={24} />
        </button>
      </div>

      {/* Bottom group with the new toggle button */}
      <button
        onClick={onToggleQueue}
        className="text-gray-300 hover:text-white cursor-pointer"
        title={isQueueOpen ? "Hide Queue" : "Show Queue"}
      >
        {isQueueOpen ? <IoClose size={24} /> : <BsCardList size={30} />}
      </button>
    </div>
  );
};

export default PlayerControls;
