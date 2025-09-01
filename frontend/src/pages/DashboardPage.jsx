import React, { useState } from "react";
import PlaylistSidebar from "../components/PlaylistSidebar";
import YouTubePlayer from "../components/YouTubePlayer";
import ChatInterface from "../components/ChatInterface";
import PlaylistDetail from "../components/PlaylistDetail";
import api from "../api";

const DashboardPage = () => {
  const [videoQueue, setVideoQueue] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [playlistItems, setPlaylistItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const handlePlayVideoQueue = (videos) => {
    setVideoQueue(videos);
    setCurrentVideoIndex(0);
  };

  const handlePlaylistSelect = async (playlist) => {
    console.log(
      "DashboardPage: handlePlaylistSelect triggered for playlist:",
      playlist.name
    );
    // Check if the clicked playlist is the one that's already open.
    if (
      selectedPlaylist &&
      selectedPlaylist.id === playlist.id &&
      isDetailOpen
    ) {
      // If yes, close the panel and clear the selection.
      setIsDetailOpen(false);
      setSelectedPlaylist(null); // This is the key step to remove the highlight
      return; // Stop the function here
    }

    // Otherwise, this is a new selection.
    // Set the new playlist, open the panel, and fetch its items.
    setSelectedPlaylist(playlist);
    setIsDetailOpen(true);
    setPlaylistItems([]);

    try {
      console.log(
        "DashboardPage: Fetching items for playlist ID:",
        playlist.id
      );
      setIsLoadingItems(true);
      const response = await api.get(`/playlists/${playlist.id}/items`);
      if (response.data.success && response.data.videoIds) {
        const videoDetails = await fetchVideoDetails(response.data.videoIds);
        setPlaylistItems(videoDetails);
      }
    } catch (error) {
      console.error("Failed to fetch playlist items:", error);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
  };

  // Helper function to get details for multiple video IDs.
  // This avoids putting too much logic in your youtubeService.
  const fetchVideoDetails = async (videoIds) => {
    console.log("Fetching video details...");
    if (!videoIds || videoIds.length === 0) return [];
    try {
      console.log(
        "DashboardPage: Calling backend to fetch details for IDs:",
        videoIds.join(",")
      );
      const response = await api.get(
        `/videos/details?ids=${videoIds.join(",")}`
      );
      if (response.data.success) {
        return response.data.videos;
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch video details:", error);
      return [];
    }
  };
  return (
    <div className="flex h-screen p-2 gap-2">
      {/* Container for the left sidebars - its width is now DYNAMIC */}
      <div
        className={`flex gap-2 w-full md:transition-all md:duration-300 md:ease-in-out ${isDetailOpen ? 'lg:w-2/6 md:w-3/6' : 'lg:w-2/6 md:w-2/6'}`}
      >
        {/* Column 1: Playlist Sidebar - it now takes up the full width of its container */}
        <div className="w-full bg-gray-800 rounded-lg p-2 overflow-hidden">
          <PlaylistSidebar
            onPlaylistSelect={handlePlaylistSelect}
            selectedPlaylist={selectedPlaylist}
          />
        </div>

        {/* Collapsible Playlist Details */}
        <div
          className={`hidden md:block transition-all duration-300 ease-in-out bg-gray-800 rounded-lg p-4 overflow-hidden ${isDetailOpen ? 'w-full' : 'w-0'}`}
          style={{ padding: isDetailOpen ? '' : 0 }}
        >
          {selectedPlaylist && (
            <PlaylistDetail
              playlist={selectedPlaylist}
              items={playlistItems}
              isLoading={isLoadingItems}
              onClose={handleCloseDetail}
              // Pass a function to play a video from the list
              onPlayVideo={(video) => handlePlayVideoQueue([video])}
            />
          )}
        </div>
      </div>

      {/* Container for the right side (Player and Chat) */}
      <div
        className={`flex flex-col gap-4 w-full md:transition-all md:duration-300 md:ease-in-out ${isDetailOpen ? 'md:w-4/6' : 'md:w-4/6'}`}
      >
        <div className="h-4/6 bg-gray-800 rounded-lg">
          <YouTubePlayer
            videoQueue={videoQueue}
            currentVideoIndex={currentVideoIndex}
            setCurrentVideoIndex={setCurrentVideoIndex}
          />
        </div>
        <div className="h-2/6 bg-gray-800 rounded-lg p-4">
          <ChatInterface onPlayVideo={handlePlayVideoQueue} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
