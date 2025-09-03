import React from "react";
import { BsFillPlayFill, BsThreeDotsVertical } from "react-icons/bs";

const PlaylistItem = ({ playlist, onSelect, onPlay, isSelected }) => {
  return (
    <li
      onClick={onSelect}
      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors duration-200 group ${
        isSelected ? "bg-purple-600" : "hover:bg-gray-700"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Add 'group relative' to the thumbnail container */}
        <div className="relative flex-shrink-0">
          <img
            src={playlist.thumbnail}
            alt={playlist.name}
            className="w-12 h-12 rounded object-cover"
          />
          {/* The play button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className="absolute inset-0 flex items-center truncate justify-center bg-black bg-opacity-50 rounded opacity-0 cursor-pointer group-hover:opacity-100 transition-opacity"
            title={`Play ${playlist.name}`}
          >
            <BsFillPlayFill size={28} className="text-fuchsia-500" />
          </button>
        </div>
        <div>
          <p className="font-semibold text-white">{playlist.name}</p>
          <p className="text-sm text-gray-400">{playlist.videoCount} videos</p>
        </div>
      </div>
      <button
        onClick={(e) => e.stopPropagation()}
        className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-600"
      >
        <BsThreeDotsVertical size={20} />
      </button>
    </li>
  );
};

export default PlaylistItem;
