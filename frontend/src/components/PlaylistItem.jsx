import React from "react";
import { BsThreeDotsVertical } from "react-icons/bs"; // Icon for the menu

const PlaylistItem = ({ playlist, onSelect, isSelected }) => {
  return (
    <li
      onClick={onSelect}
      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors duration-200 ${
        isSelected ? "bg-purple-600" : "hover:bg-gray-700"
      }`}
    >
      <div className="flex items-center gap-3">
        <img
          src={playlist.thumbnail}
          alt={playlist.name}
          className="w-12 h-12 rounded object-cover"
        />
        <div>
          <p className="font-semibold text-white">{playlist.name}</p>
          <p className="text-sm text-gray-400">{playlist.videoCount} videos</p>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log("Menu clicked for:", playlist.name);
        }}
        className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-600"
      >
        <BsThreeDotsVertical size={20} />
      </button>
    </li>
  );
};

export default PlaylistItem;
