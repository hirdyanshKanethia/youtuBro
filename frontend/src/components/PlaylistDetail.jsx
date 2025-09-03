import React from 'react';
import { IoClose } from 'react-icons/io5';
import VideoItem from './VideoItem'; // We will create this next

const PlaylistDetail = ({ playlist, items, isLoading, onClose, onPlayVideo }) => {
  return (
    <div className="p-1 h-full flex flex-col bg-gray-800">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div>
          <h3 className="text-xl font-bold">{playlist.name}</h3>
          <p className="text-sm text-gray-400">{playlist.videoCount} videos</p>
        </div>
        {/* <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700"
        >
          <IoClose size={24} />
        </button> */}
      </div>

      <div className="flex-grow overflow-y-auto hide-scrollbar">
        {isLoading ? (
          <p>Loading videos...</p>
        ) : (
          <ul>
            {items.map(video => (
              <VideoItem 
                key={video.id} 
                video={video} 
                onPlay={() => onPlayVideo(video)}
                // onAddToQueue={() => onAddToQueue(video)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PlaylistDetail;