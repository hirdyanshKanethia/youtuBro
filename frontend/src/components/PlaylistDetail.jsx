import React from "react";
import { IoClose } from "react-icons/io5";
import VideoItem from "./VideoItem";

const PlaylistDetail = ({
  playlist,
  items,
  isLoading,
  onClose,
  onPlayFromPlaylist,
  onAddToQueue,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onPlayNext
}) => {
  return (
    // Add 'relative' class here
    <div className="p-1 h-full flex flex-col bg-black relative"> {/* <--- ADDED 'relative' */}
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-700 transition-colors text-gray-400 hover:text-white focus:outline-none z-10"
        aria-label="Close playlist details"
      >
        <IoClose size={18} />
      </button>
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div>
          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">{playlist.name}</h3>
          <p className="text-sm text-gray-400">{playlist.videoCount} videos</p>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto hide-scrollbar">
        {isLoading ? (
          <p>Loading videos...</p>
        ) : (
          <ul>
            {items.map((video, index) => (
              <VideoItem
                key={video.id}
                video={video}
                onPlay={() => onPlayFromPlaylist(items, index)}
                onAddToQueue={() => onAddToQueue(video)}
                onAddToPlaylist={() => onAddToPlaylist(video)}
                onRemoveFromPlaylist={() => onRemoveFromPlaylist(video)}
                onPlayNext={() => onPlayNext(video)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PlaylistDetail;