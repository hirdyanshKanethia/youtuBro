import React from 'react';
import { BsFillPlayFill } from 'react-icons/bs';

const CollapsedPlaylistItem = ({ playlist, onPlay }) => {
  return (
    <li className="flex items-center justify-center py-2">
      <div className="relative group flex-shrink-0" title={playlist.name}>
        <img
          src={playlist.thumbnail}
          alt={playlist.name}
          className="w-12 h-12 rounded object-cover" // Use rounded-full for a clean, icon-like look
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title={`Play ${playlist.name}`}
        >
          <BsFillPlayFill size={28} className="text-fuchsia-300 drop-shadow-[0_0_8px_rgba(250,150,250,0.8)]" />
        </button>
      </div>
    </li>
  );
};

export default CollapsedPlaylistItem;