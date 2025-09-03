import React from 'react';
import { BsFillPlayFill } from 'react-icons/bs';

const VideoItem = ({ video, onPlay }) => {
  return (
    <li className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700">
      <div className="relative group flex-shrink-0">
        <img
          src={video.thumbnail || "https://via.placeholder.com/120x90"}
          alt={video.title}
          className="w-12 h-8 rounded object-cover"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded opacity-0 cursor-pointer group-hover:opacity-100 transition-opacity"
          title={`Play ${video.title}`}
        >
          <BsFillPlayFill size={28} className="text-fuchsia-500" />
        </button>
      </div>
      <div className="relative group flex-grow truncate">
        <p className="font-semibold text-sm text-white truncate">
          {video.title}
        </p>
        <span className="absolute bottom-full left-0 mb-2 w-auto p-2 text-xs text-white bg-gray-800 rounded-md shadow-lg scale-0 group-hover:scale-100 transition-all duration-200 origin-bottom">
          {video.title}
        </span>
      </div>
    </li>
  );
};

export default VideoItem;