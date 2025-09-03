import React, { useState } from "react";
import PlaylistSidebar from "../components/PlaylistSidebar";
import YouTubePlayer from "../components/YouTubePlayer";
import ChatInterface from "../components/ChatInterface";
import PlaylistDetail from "../components/PlaylistDetail";
import PlayerQueue from "../components/PlayerQueue";
import PlayerControls from "../components/PlayerControls";
import api from "../api";

const DashboardPage = () => {
  const [videoQueue, setVideoQueue] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [playlistItems, setPlaylistItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleQueue = () => {
    setIsQueueOpen(!isQueueOpen);
  };

  const handlePlayPause = () => {
    if (videoQueue.length > 0) {
      setIsPlaying(!isPlaying);
    }
  };

  const handleNextVideo = () => {
    if (videoQueue.length > 1) {
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videoQueue.length);
      setIsPlaying(true);
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handlePlayVideoQueue = (videos, startIndex = 0) => {
    if (videos && videos.length > 0) {
      // Create a new queue starting from the selected video's index
      const newQueue = videos.slice(startIndex);
      setVideoQueue(newQueue);
      setCurrentVideoIndex(0); // The new queue always starts at index 0
    }
  };

  const handleAddToQueue = (video) => {
    if (videoQueue.length === 0) {
      // If the queue is empty, just start playing the video.
      handlePlayVideoQueue([video]);
    } else {
      // Otherwise, add the video to the end of the existing queue.
      setVideoQueue((prevQueue) => [...prevQueue, video]);
      console.log(`Added "${video.title}" to the queue.`);
    }
  };

  const handleShuffleQueue = () => {
    if (videoQueue.length < 2) return; // No need to shuffle if 0 or 1 video

    // Create a new shuffled array, keeping the current video at the top.
    const currentVideo = videoQueue[currentVideoIndex];
    const remainingVideos = videoQueue.filter(
      (_, index) => index !== currentVideoIndex
    );

    // Fisher-Yates shuffle algorithm for the remaining videos
    for (let i = remainingVideos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainingVideos[i], remainingVideos[j]] = [
        remainingVideos[j],
        remainingVideos[i],
      ];
    }

    const newQueue = [currentVideo, ...remainingVideos];
    setVideoQueue(newQueue);
    setCurrentVideoIndex(0); // Reset index to the top
    console.log("Queue shuffled.");
  };

  const handlePlayFromQueue = (index) => {
    setCurrentVideoIndex(index);
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

  const handlePlayFromPlaylist = (items, startIndex = 0) => {
    if (items && items.length > 0) {
      // Create a new queue starting from the selected video's index.
      const newQueue = items.slice(startIndex);
      setVideoQueue(newQueue);
      setCurrentVideoIndex(0); // The new queue always starts at index 0
    }
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const handleShufflePlayPlaylist = async (playlist) => {
    console.log("Shuffling and playing playlist:", playlist.name);
    try {
      const response = await api.get(`/playlists/${playlist.id}/items`);
      if (response.data.success && response.data.videoIds) {
        const videos = await fetchVideoDetails(response.data.videoIds);
        const shuffledVideos = shuffleArray([...videos]); // Use a copy to avoid mutating state
        handlePlayVideoQueue(shuffledVideos);
      }
    } catch (error) {
      console.error("Failed to fetch and shuffle playlist:", error);
    }
  };

  const handleDeletePlaylist = async (playlist) => {
    if (window.confirm(`Are you sure you want to delete the playlist "${playlist.name}"?`)) {
      try {
        console.log("Deleting playlist:", playlist.id);
        
        await api.delete(`/playlists/${playlist.id}`);
        
        setPlaylists(prev => prev.filter(p => p.id !== playlist.id));

        if (selectedPlaylist && selectedPlaylist.id === playlist.id) {
          handleCloseDetail();
        }

      } catch (error) {
        console.error("Failed to delete playlist:", error);
        // You could add a user-facing error message here, e.g., using a toast notification
        alert("Failed to delete the playlist. Please try again.");
      }
    }
  };

  return (
    <div className="flex h-screen p-4 gap-4 relative">
      {/* LEFT SIDE CONTAINER (Sidebar + Details) */}
      <div
        className={`flex-shrink-0 flex gap-4 transition-all duration-300 ease-in-out
          ${!isSidebarOpen ? "w-0 md:w-16 lg:w-20" : ""}
          ${isSidebarOpen && !isDetailOpen ? "w-full md:w-80 lg:w-80" : ""}
          ${isSidebarOpen && isDetailOpen ? "w-full md:w-96 lg:w-[41rem]" : ""}
        `}
      >
        {/* Sidebar Container */}
        <div
          className={`bg-gray-800 rounded-lg p-2 overflow-hidden transition-all duration-300 ease-in-out
          ${!isSidebarOpen ? "w-0 md:w-16 lg:w-20" : "w-full md:w-80 lg:w-80"}
        `}
        >
          {(isSidebarOpen || window.innerWidth >= 768) && (
            <PlaylistSidebar
              onPlaylistSelect={handlePlaylistSelect}
              onPlayPlaylist={handlePlayPlaylist}
              selectedPlaylist={selectedPlaylist}
              toggleSidebar={toggleSidebar}
              isSidebarOpen={isSidebarOpen}
              onShufflePlay={handleShufflePlayPlaylist} 
              onDelete={handleDeletePlaylist} 
            />
          )}
        </div>

        {/* Details Panel */}
        {isDetailOpen && isSidebarOpen && selectedPlaylist && (
          <div className="bg-gray-800 rounded-lg p-4 overflow-hidden w-full md:w-80 lg:w-80 transition-all duration-300 ease-in-out">
            <PlaylistDetail
              playlist={selectedPlaylist}
              items={playlistItems}
              isLoading={isLoadingItems}
              onPlayFromPlaylist={handlePlayFromPlaylist}
            />
          </div>
        )}
      </div>

      {/* RIGHT SIDE CONTAINER */}
      <div className="flex-1 flex flex-col gap-4 h-full min-w-0">
        {/* Top Section: Player + Controls */}
        <div className="h-3/5 flex gap-4 min-h-0">
          {/* Main Player */}
          <div className="flex-1 bg-gray-800 rounded-lg min-w-0">
            <YouTubePlayer
              videoQueue={videoQueue}
              currentVideoIndex={currentVideoIndex}
              setCurrentVideoIndex={setCurrentVideoIndex}
              isPlaying={isPlaying}
              isMuted={isMuted}
            />
          </div>
          {/* Player Controls */}
          <div className="w-16 md:w-20 flex-shrink-0">
            <PlayerControls
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onNext={handleNextVideo}
              isMuted={isMuted}
              onMuteToggle={handleMuteToggle}
              isQueueOpen={isQueueOpen}
              onToggleQueue={toggleQueue}
            />
          </div>
        </div>

        {/* Bottom Section: Chat + Queue */}
        <div className="h-2/5 flex gap-4 min-h-0">
          {/* Chat Interface */}
          <div className="bg-gray-800 rounded-lg p-4 flex-1 min-w-0 transition-all duration-300 ease-in-out">
            <ChatInterface onPlayVideo={handlePlayVideoQueue} />
          </div>

          {/* Player Queue */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isQueueOpen ? "w-full md:w-1/3 lg:w-80 flex-shrink-0" : "w-0"
            }`}
          >
            <PlayerQueue
              queue={videoQueue}
              currentVideoIndex={currentVideoIndex}
              onShuffle={handleShuffleQueue}
              onPlayFromQueue={handlePlayFromQueue}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
