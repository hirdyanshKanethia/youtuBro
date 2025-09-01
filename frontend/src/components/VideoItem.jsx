import React from 'react';
import { BsFillPlayFill } from 'react-icons/bs';

const VideoItem = ({ video, onPlay }) => {
  return (
    <li className="flex items-center gap-1 p-1 rounded-lg hover:bg-gray-700">
      <img 
        src={video.thumbnail || 'https://via.placeholder.com/120x90'} 
        alt={video.title} 
        className="w-12 h-8 rounded object-cover flex-shrink-0"
      />
      <p className="font-semibold text-sm text-white flex-grow truncate">{video.title}</p>
      <button 
        onClick={onPlay}
        className="text-gray-200 hover:text-white p-2 rounded-full hover:bg-purple-600"
        title="Play this video"
      >
        <BsFillPlayFill size={20} />
      </button>
    </li>
  );
};

export default VideoItem;