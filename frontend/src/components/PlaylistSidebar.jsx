import React, { useState, useEffect } from "react";
import api from "../api";
import PlaylistItem from "./PlaylistItem";
import CollapsedPlaylistItem from "./CollapsedPlaylistItem";

import { HiMenuAlt2 } from "react-icons/hi";

const PlaylistSidebar = ({
  playlists,
  isLoading,
  onPlaylistSelect,
  onPlayPlaylist,
  selectedPlaylist,
  toggleSidebar,
  isSidebarOpen,
  onShufflePlay,
  onDelete,
}) => {
  return (
    <div className="h-full flex flex-col">
      <div
        className={`flex items-center mb-4 flex-shrink-0 ${
          isSidebarOpen ? "justify-between" : "justify-center"
        }`}
      >
        {/* Conditionally render the title */}
        {isSidebarOpen && (
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">Your Playlists</h2>
        )}
        <button
          onClick={toggleSidebar}
          className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-full p-1 cursor-pointer"
          title="Toggle Playlist Sidebar"
        >
          {/* You can use a different icon for open/close if you wish */}
          <HiMenuAlt2 size={24} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto hide-scrollbar">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <ul>
            {playlists.map((playlist) =>
              // Conditionally render the correct item component
              isSidebarOpen ? (
                <PlaylistItem
                  key={playlist.id}
                  playlist={playlist}
                  onSelect={() => onPlaylistSelect(playlist)}
                  onPlay={() => onPlayPlaylist(playlist)}
                  onShufflePlay={() => onShufflePlay(playlist)}
                  onDelete={() => onDelete(playlist)}
                  isSelected={
                    selectedPlaylist && selectedPlaylist.id === playlist.id
                  }
                />
              ) : (
                <CollapsedPlaylistItem
                  key={playlist.id}
                  playlist={playlist}
                  onPlay={() => onPlayPlaylist(playlist)}
                />
              )
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PlaylistSidebar;
