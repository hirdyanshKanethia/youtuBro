import React, { useState } from "react";
import PlaylistSidebar from "../components/PlaylistSidebar";
import YouTubePlayer from "../components/YouTubePlayer";
import ChatInterface from "../components/ChatInterface";
import PlaylistDetail from "../components/PlaylistDetail";
import api from "../api";

import { HiMenuAlt1 } from "react-icons/hi";

const DashboardPage = () => {
  const [videoQueue, setVideoQueue] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [playlistItems, setPlaylistItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

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
    if (!videoIds || videoIds.length === 0) return [];

    console.log(`Fetching details for ${videoIds.length} videos in batches...`);

    const BATCH_SIZE = 50; // YouTube API's max is 50 per request
    const detailRequests = [];

    // Create an array of API request promises for each batch.
    for (let i = 0; i < videoIds.length; i += BATCH_SIZE) {
      const batch = videoIds.slice(i, i + BATCH_SIZE);
      const request = api.get(`/videos/details?ids=${batch.join(",")}`);
      detailRequests.push(request);
    }

    try {
      // Run all batch requests concurrently for better performance.
      const responses = await Promise.all(detailRequests);

      // Combine the 'videos' array from each response into a single flat list.
      const allVideoDetails = responses.flatMap((response) =>
        response.data.success ? response.data.videos : []
      );

      return allVideoDetails;
    } catch (error) {
      console.error("Failed to fetch video details in batches:", error);
      return [];
    }
  };

  const handlePlayPlaylist = async (playlist) => {
    console.log("DashboardPage: Playing entire playlist:", playlist.name);
    try {
      // 1. Fetch all the video IDs for the playlist.
      const response = await api.get(`/playlists/${playlist.id}/items`);
      if (response.data.success && response.data.videoIds) {
        // 2. Fetch the full details for those video IDs.
        const videos = await fetchVideoDetails(response.data.videoIds);
        // 3. Set the player's queue with all the fetched videos.
        handlePlayVideoQueue(videos);
      }
    } catch (error) {
      console.error("Failed to fetch and play playlist items:", error);
    }
  };

  return (
    <div className="flex h-screen p-4 gap-4 relative">
      {/* LEFT SIDE CONTAINER (Sidebar + Details) */}
      <div
        className={`flex-shrink-0 flex gap-4 transition-all duration-300 ease-in-out
          ${!isSidebarOpen ? "w-20" : ""}
          ${isSidebarOpen && !isDetailOpen ? "w-full md:w-1/4" : ""}
          ${isSidebarOpen && isDetailOpen ? "w-full md:w-2/5" : ""}
        `}
      >
        <div className={`bg-gray-800 rounded-lg p-2 overflow-hidden w-full`}>
          <PlaylistSidebar
            onPlaylistSelect={handlePlaylistSelect}
            onPlayPlaylist={handlePlayPlaylist}
            selectedPlaylist={selectedPlaylist}
            toggleSidebar={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
          />
        </div>

        {/* The details panel's visibility is controlled by isDetailOpen */}
        <div
          className={`bg-gray-800 rounded-lg p-4 overflow-hidden w-full transition-all duration-300 ease-in-out ${
            isDetailOpen && isSidebarOpen ? "block" : "hidden"
          }`}
        >
          {selectedPlaylist && (
            <PlaylistDetail
              playlist={selectedPlaylist}
              items={playlistItems}
              isLoading={isLoadingItems}
              onClose={handleCloseDetail}
              onPlayVideo={(video) => handlePlayVideoQueue([video])}
            />
          )}
        </div>
      </div>

      {/* RIGHT SIDE CONTAINER (Player + Chat) */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="h-3/5 bg-gray-800 rounded-lg">
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
