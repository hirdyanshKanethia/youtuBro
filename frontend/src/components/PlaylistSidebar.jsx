import React, { useState, useEffect } from "react";
import api from "../api";
import PlaylistItem from "./PlaylistItem";

const PlaylistSidebar = ({ onPlaylistSelect, selectedPlaylist }) => {
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
      <h2 className="text-2xl font-bold mb-4 flex-shrink-0">Your Playlists</h2>
      <div className="flex-grow overflow-y-auto hide-scrollbar">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul>
            {playlists.map((playlist) => (
              <PlaylistItem
                key={playlist.id}
                playlist={playlist}
                onSelect={() => onPlaylistSelect(playlist)}
                isSelected={
                  selectedPlaylist && selectedPlaylist.id === playlist.id
                }
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PlaylistSidebar;
