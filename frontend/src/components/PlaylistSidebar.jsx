import React, { useState, useEffect } from "react";
import api from "../api";
import PlaylistItem from "./PlaylistItem";
import CollapsedPlaylistItem from "./CollapsedPlaylistItem";

import { HiMenuAlt2 } from "react-icons/hi";

const PlaylistSidebar = ({
  onPlaylistSelect,
  onPlayPlaylist,
  selectedPlaylist,
  toggleSidebar,
  isSidebarOpen,
  onShufflePlay,
  onDelete,
}) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoading(true);
        const response = await api.get("/playlists");
        if (response.data.success) {
          setPlaylists(response.data.playlists);
        }
      } catch (error) {
        console.error("Failed to fetch playlists:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylists();
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div
        className={`flex items-center mb-4 flex-shrink-0 ${
          isSidebarOpen ? "justify-between" : "justify-center"
        }`}
      >
        {/* Conditionally render the title */}
        {isSidebarOpen && (
          <h2 className="text-2xl font-bold">Your Playlists</h2>
        )}
        <button
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-white border border-gray-600 rounded-full p-1 transition-colors hover:border-purple-500 cursor-pointer"
          title="Toggle Playlist Sidebar"
        >
          {/* You can use a different icon for open/close if you wish */}
          <HiMenuAlt2 size={24} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto hide-scrollbar">
        {/* ... (loading logic) */}
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
      </div>
    </div>
  );
};

export default PlaylistSidebar;
