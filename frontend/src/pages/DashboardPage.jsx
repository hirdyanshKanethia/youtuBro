import React, { useState, useEffect } from "react";
import PlaylistSidebar from "../components/PlaylistSidebar";
import YouTubePlayer from "../components/YouTubePlayer";
import ChatInterface from "../components/ChatInterface";
import PlaylistDetail from "../components/PlaylistDetail";
import PlayerQueue from "../components/PlayerQueue";
import PlayerControls from "../components/PlayerControls";
import PlaylistSelectionModal from "../components/PlaylistSelectionModal";
import ActionHistory from "../components/ActionHistory";
import api from "../api";

import { arrayMove } from "@dnd-kit/sortable";
import toast from "react-hot-toast";

const DashboardPage = () => {
  // ####################################################################################
  // State Variables
  // ####################################################################################

  // Queue
  const [videoQueue, setVideoQueue] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isQueueOpen, setIsQueueOpen] = useState(true);

  // Playlists
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [playlistItems, setPlaylistItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [videoToMove, setVideoToMove] = useState(null);

  // Conditionally rendering modals and others
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Mobile-specific state
  const [activeMobilePanel, setActiveMobilePanel] = useState('player'); // 'player', 'chat', 'sidebar', 'queue', 'detail'

  // ####################################################################################
  // Mobile Panel Management
  // ####################################################################################

  const handleMobilePanelChange = (panel) => {
    setActiveMobilePanel(panel);
    
    // Auto-manage related states for mobile
    if (panel === 'sidebar') {
      setIsSidebarOpen(true);
      setIsDetailOpen(false); // Ensure detail is closed when opening main sidebar on mobile
      setSelectedPlaylist(null); // Clear selection too
    } else if (panel === 'queue') {
      setIsQueueOpen(true);
    } else { // If switching away from sidebar/queue, ensure their states reflect it
      if (activeMobilePanel === 'sidebar') setIsSidebarOpen(false);
      if (activeMobilePanel === 'queue') setIsQueueOpen(false);
      if (activeMobilePanel === 'detail') {
        setIsDetailOpen(false);
        setSelectedPlaylist(null);
      }
    }
  };

  // Override certain functions for mobile behavior
  const mobileAwareToggleSidebar = () => {
    if (window.innerWidth < 768) {
      if (activeMobilePanel === 'sidebar') {
        setActiveMobilePanel('player');
      } else {
        handleMobilePanelChange('sidebar');
      }
    } else {
      toggleSidebar();
    }
  };

  const mobileAwareToggleQueue = () => {
    if (window.innerWidth < 768) {
      if (activeMobilePanel === 'queue') {
        setActiveMobilePanel('player');
      } else {
        handleMobilePanelChange('queue');
      }
    } else {
      toggleQueue();
    }
  };

  const mobileAwarePlaylistSelect = async (playlist) => {
    // If selecting the same playlist that's already open, close it (toggle behavior)
    if (selectedPlaylist && selectedPlaylist.id === playlist.id && isDetailOpen) {
      mobileAwareCloseDetail(); // Use mobile-aware close
      return;
    }

    await handlePlaylistSelect(playlist); // This sets selectedPlaylist and opens isDetailOpen
    if (window.innerWidth < 768) {
      setActiveMobilePanel('detail');
    }
  };

  const mobileAwareCloseDetail = () => {
    handleCloseDetail(); // This sets isDetailOpen to false
    if (window.innerWidth < 768) {
      setActiveMobilePanel('sidebar'); // Go back to sidebar on mobile
    }
  };

  // ####################################################################################
  // Component-rendering handling
  // ####################################################################################

  const toggleHistory = () => {
    setIsHistoryOpen(!isHistoryOpen);
    if (window.innerWidth < 768 && !isHistoryOpen) {
      setActiveMobilePanel('chat'); // If opening history on mobile, ensure chat panel is visible
    }
  };

  const handleOpenAddToPlaylistModal = (video) => {
    setVideoToMove(video);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setVideoToMove(null);
  };

  const handleOpenModalForCurrentVideo = () => {
    // Find the currently playing video from the queue.
    const currentVideo = videoQueue[currentVideoIndex];

    if (currentVideo) {
      // If a video is playing, call the existing function to open the modal.
      handleOpenAddToPlaylistModal(currentVideo);
    } else {
      // If the queue is empty, provide feedback to the user.
      toast.error("No video is currently playing.");
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    if (isSidebarOpen && isDetailOpen) { // If closing sidebar but detail was open, close detail too
      setIsDetailOpen(false);
      setSelectedPlaylist(null);
    }
  };

  const toggleQueue = () => {
    setIsQueueOpen(!isQueueOpen);
  };

  // ####################################################################################

  // ####################################################################################
  // Playback Controls
  // ####################################################################################

  const handlePlayNext = (video) => {
    if (videoQueue.length === 0) {
      handlePlayVideoQueue([video]);
      return;
    }

    setVideoQueue((prevQueue) => {
      const newQueue = [...prevQueue];

      newQueue.splice(currentVideoIndex + 1, 0, video);

      return newQueue;
    });

    toast.success(`"${video.title}" will play next.`);
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

  // ####################################################################################

  // ####################################################################################
  // Playlist Handling and Playlist Sidebar
  // ####################################################################################

  const handleAddVideoToPlaylist = async (playlistId) => {
    if (!videoToMove) return;

    const promise = api.post(`/playlists/${playlistId}/items`, {
      videoId: videoToMove.id,
    });

    try {
      await toast.promise(promise, {
        loading: `Adding "${videoToMove.title}"...`,
        success: `Successfully added to playlist.`,
        error: "Failed to add video to playlist.",
      });

      setPlaylists((prevPlaylists) =>
        prevPlaylists.map((p) =>
          p.id === playlistId ? { ...p, videoCount: p.videoCount + 1 } : p
        )
      );

      if (selectedPlaylist && selectedPlaylist.id === playlistId) {
        // If yes, fetch the new video's details and add it to the items list.
        const newVideoDetails = await fetchVideoDetails([videoToMove.id]);
        if (newVideoDetails.length > 0) {
          setPlaylistItems((prevItems) => [...prevItems, newVideoDetails[0]]);
        }
      }
    } catch (error) {
      // console.error("Error caught by handleAddVideoToPlaylist:", error);
    } finally {
      handleCloseModal();
    }
  };

  const handleRemoveVideoFromPlaylist = async (video) => {
    if (!selectedPlaylist) return;

    if (
      window.confirm(
        `Are you sure you want to remove "${video.title}" from this playlist?`
      )
    ) {
      const promise = api.delete(
        `/playlists/${selectedPlaylist.id}/items/${video.id}`
      );

      try {
        await toast.promise(promise, {
          loading: "Removing video...",
          success: `"${video.title}" was removed.`,
          error: "Failed to remove video.",
        });

        // Optimistically update UI
        setPlaylistItems((prev) => prev.filter((item) => item.id !== video.id));

        setPlaylists((prevPlaylists) =>
          prevPlaylists.map((p) =>
            p.id === selectedPlaylist.id
              ? { ...p, videoCount: p.videoCount - 1 }
              : p
          )
        );
      } catch (error) {
        // console.error("Error caught by handleRemoveVideoFromPlaylist:", error);
      }
    }
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
    setSelectedPlaylist(null); // Clear selection when closing detail
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
      // On mobile, switch to player view when playing
      if (window.innerWidth < 768) {
        setActiveMobilePanel('player');
      }
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
    if (
      window.confirm(
        `Are you sure you want to delete the playlist "${playlist.name}"?`
      )
    ) {
      try {
        await api.delete(`/playlists/${playlist.id}`);
        // This will now work because setPlaylists is defined in this component.
        setPlaylists((prev) => prev.filter((p) => p.id !== playlist.id));

        if (selectedPlaylist && selectedPlaylist.id === playlist.id) {
          handleCloseDetail();
        }
        alert(`Playlist "${playlist.name}" was successfully deleted.`);
      } catch (error) {
        console.error("Failed to delete playlist:", error);
        alert("Failed to delete the playlist. Please try again.");
      }
    }
  };

  // ####################################################################################

  // ####################################################################################
  // Queue Handling
  // ####################################################################################

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setVideoQueue((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newQueue = arrayMove(items, oldIndex, newIndex);

        // Update the current video index after reordering
        const currentVideoId = items[currentVideoIndex].id;
        setCurrentVideoIndex(
          newQueue.findIndex((item) => item.id === currentVideoId)
        );

        return newQueue;
      });
    }
  };

  const handlePlayVideoQueue = (videos, startIndex = 0) => {
    if (videos && videos.length > 0) {
      // Create a new queue starting from the selected video's index
      const newQueue = videos.slice(startIndex);
      setVideoQueue(newQueue);
      setCurrentVideoIndex(0); // The new queue always starts at index 0
      // On mobile, switch to player view when playing
      if (window.innerWidth < 768) {
        setActiveMobilePanel('player');
      }
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
    // On mobile, switch to player view when playing from queue
    if (window.innerWidth < 768) {
      setActiveMobilePanel('player');
    }
  };

  const handleClearQueue = () => {
    // No need to clear if there's only one or zero videos.
    if (videoQueue.length <= 1) return;

    // Get the video that is currently playing.
    const currentVideo = videoQueue[currentVideoIndex];

    // Set the queue to a new array containing only that video.
    setVideoQueue([currentVideo]);

    // Reset the index to 0, as it's now the only item.
    setCurrentVideoIndex(0);
    // console.log("Queue cleared except for the current video.");
  };

  // ####################################################################################

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoadingPlaylists(true);
        const response = await api.get("/playlists");
        if (response.data.success) {
          setPlaylists(response.data.playlists);
        }
      } catch (error) {
        console.error("Failed to fetch playlists:", error);
      } finally {
        setLoadingPlaylists(false);
      }
    };
    fetchPlaylists();
  }, []);

  // Handle window resize to reset mobile panel state
  useEffect(() => {
    const handleResize = () => {
      // Only set to 'player' if screen becomes desktop-sized from mobile
      // Otherwise, keep the current desktop view
      if (window.innerWidth >= 768) {
        setActiveMobilePanel('player');
        setIsSidebarOpen(true); // Ensure desktop sidebar is open
        setIsQueueOpen(true); // Ensure desktop queue is open
      } else {
        // When resizing to mobile, ensure desktop-specific states are off
        setIsSidebarOpen(false);
        setIsQueueOpen(false);
        setIsDetailOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile Navigation Component
  const MobileNavigation = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50">
      <div className="flex justify-around py-2">
        <button
          onClick={() => handleMobilePanelChange('player')}
          className={`flex-1 py-2 text-center text-sm ${
            activeMobilePanel === 'player' ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          Player
        </button>
        <button
          onClick={() => handleMobilePanelChange('chat')}
          className={`flex-1 py-2 text-center text-sm ${
            activeMobilePanel === 'chat' || isHistoryOpen ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => handleMobilePanelChange('sidebar')}
          className={`flex-1 py-2 text-center text-sm ${
            activeMobilePanel === 'sidebar' || activeMobilePanel === 'detail' ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          Playlists
        </button>
        <button
          onClick={() => handleMobilePanelChange('queue')}
          className={`flex-1 py-2 text-center text-sm ${
            activeMobilePanel === 'queue' ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          Queue
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex bg-gray-950 h-screen p-4 gap-4 relative pb-16 md:pb-4">
        {/* DESKTOP LAYOUT (md and above) */}
        <div className="hidden md:flex w-full h-full gap-4"> {/* Added h-full and gap-4 */}
          {/* LEFT SIDE CONTAINER (Sidebar + Details) */}
          <div
            className={`flex-shrink-0 flex gap-1 transition-all duration-300 ease-in-out
              ${isSidebarOpen && isDetailOpen ? "md:w-[42rem] lg:w-[45rem]" : ""} /* Fixed width when both open */
              ${isSidebarOpen && !isDetailOpen ? "md:w-80 lg:w-80" : ""} /* Sidebar only */
              ${!isSidebarOpen ? "md:w-16 lg:w-20" : ""} /* Sidebar closed, just toggle icon */
            `}
          >
            {/* Sidebar Container */}
            <div
              className={`flex-shrink-0 bg-black rounded-lg p-2 overflow-hidden transition-all duration-300 ease-in-out h-full
              ${isSidebarOpen && isDetailOpen ? "md:w-1/2" : ""} /* Half width when detail open */
              ${isSidebarOpen && !isDetailOpen ? "md:w-full" : ""} /* Full width when detail closed */
              ${!isSidebarOpen ? "md:w-full" : ""} /* Full width if sidebar toggle icon only */
            `}
            >
              <PlaylistSidebar
                playlists={playlists}
                isLoading={loadingPlaylists}
                onPlaylistSelect={handlePlaylistSelect}
                onPlayPlaylist={handlePlayPlaylist}
                selectedPlaylist={selectedPlaylist}
                toggleSidebar={toggleSidebar}
                isSidebarOpen={isSidebarOpen}
                onShufflePlay={handleShufflePlayPlaylist}
                onDelete={handleDeletePlaylist}
                // isMobile is not needed for desktop sidebar
              />
            </div>

            {/* Details Panel */}
            {isDetailOpen && isSidebarOpen && selectedPlaylist && (
              <div className="bg-black rounded-lg p-4 overflow-hidden h-full flex-grow transition-all duration-300 ease-in-out">
                <PlaylistDetail
                  playlist={selectedPlaylist}
                  items={playlistItems}
                  isLoading={isLoadingItems}
                  onPlayFromPlaylist={handlePlayFromPlaylist}
                  onAddToQueue={handleAddToQueue}
                  onAddToPlaylist={handleOpenAddToPlaylistModal}
                  onRemoveFromPlaylist={handleRemoveVideoFromPlaylist}
                  onPlayNext={handlePlayNext}
                  onClose={handleCloseDetail}
                  // isMobile is not needed for desktop detail
                />
              </div>
            )}
          </div>

          {/* RIGHT SIDE CONTAINER */}
          <div className="flex-1 flex flex-col gap-4 h-full min-w-0">
            {/* Top Section: Player + Controls */}
            <div className="h-3/5 flex gap-2 min-h-0">
              {/* Main Player */}
              <div className="flex-1 bg-black rounded-lg min-w-0">
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
                  onAddToPlaylist={handleOpenModalForCurrentVideo}
                />
              </div>
            </div>

            {/* Bottom Section: Chat + Queue */}
            <div className="h-2/5 flex gap-2 min-h-0">
              {/* Chat Interface */}
              <div className="bg-black rounded-lg p-4 flex-1 min-w-0 transition-all duration-300 ease-in-out">
                <ChatInterface
                  onPlayVideo={handlePlayVideoQueue}
                  onToggleHistory={toggleHistory}
                />
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
                  onDragEnd={handleDragEnd}
                  onClearQueue={handleClearQueue}
                />
              </div>
              {isHistoryOpen && <ActionHistory onClose={toggleHistory} />}
            </div>
          </div>
        </div>

        {/* MOBILE LAYOUT (below md) */}
        <div className="md:hidden flex flex-col w-full h-full">
          {/* Player Panel */}
          {activeMobilePanel === 'player' && (
            <div className="flex-1 flex flex-col gap-4">
              {/* Main Player */}
              <div className="flex-1 bg-black rounded-lg min-w-0">
                <YouTubePlayer
                  videoQueue={videoQueue}
                  currentVideoIndex={currentVideoIndex}
                  setCurrentVideoIndex={setCurrentVideoIndex}
                  isPlaying={isPlaying}
                  isMuted={isMuted}
                />
              </div>
              {/* Mobile Player Controls */}
              <div className="bg-black rounded-lg p-4">
                <PlayerControls
                  isPlaying={isPlaying}
                  onPlayPause={handlePlayPause}
                  onNext={handleNextVideo}
                  isMuted={isMuted}
                  onMuteToggle={handleMuteToggle}
                  isQueueOpen={isQueueOpen}
                  onToggleQueue={mobileAwareToggleQueue}
                  onAddToPlaylist={handleOpenModalForCurrentVideo}
                  onToggleSidebar={mobileAwareToggleSidebar} // Pass mobile sidebar toggle
                  isMobile={true}
                />
              </div>
            </div>
          )}

          {/* Chat Panel */}
          {activeMobilePanel === 'chat' && (
            <div className="flex-1 bg-black rounded-lg p-4">
              <ChatInterface
                onPlayVideo={handlePlayVideoQueue}
                onToggleHistory={toggleHistory}
              />
              {isHistoryOpen && <ActionHistory onClose={toggleHistory} />}
            </div>
          )}

          {/* Sidebar Panel */}
          {activeMobilePanel === 'sidebar' && (
            <div className="flex-1 bg-black rounded-lg p-2 overflow-hidden">
              <PlaylistSidebar
                playlists={playlists}
                isLoading={loadingPlaylists}
                onPlaylistSelect={mobileAwarePlaylistSelect}
                onPlayPlaylist={handlePlayPlaylist}
                selectedPlaylist={selectedPlaylist}
                toggleSidebar={mobileAwareToggleSidebar}
                isSidebarOpen={true} // Always "open" when active mobile panel is sidebar
                onShufflePlay={handleShufflePlayPlaylist}
                onDelete={handleDeletePlaylist}
                isMobile={true}
              />
            </div>
          )}

          {/* Detail Panel */}
          {activeMobilePanel === 'detail' && selectedPlaylist && (
            <div className="flex-1 bg-black rounded-lg p-4 overflow-hidden">
              <PlaylistDetail
                playlist={selectedPlaylist}
                items={playlistItems}
                isLoading={isLoadingItems}
                onPlayFromPlaylist={handlePlayFromPlaylist}
                onAddToQueue={handleAddToQueue}
                onAddToPlaylist={handleOpenAddToPlaylistModal}
                onRemoveFromPlaylist={handleRemoveVideoFromPlaylist}
                onPlayNext={handlePlayNext}
                onClose={mobileAwareCloseDetail}
                isMobile={true}
              />
            </div>
          )}

          {/* Queue Panel */}
          {activeMobilePanel === 'queue' && (
            <div className="flex-1 overflow-hidden">
              <PlayerQueue
                queue={videoQueue}
                currentVideoIndex={currentVideoIndex}
                onShuffle={handleShuffleQueue}
                onPlayFromQueue={handlePlayFromQueue}
                onDragEnd={handleDragEnd}
                onClearQueue={handleClearQueue}
                isMobile={true}
                onClose={() => mobileAwareToggleQueue()} // Explicit close for mobile queue
              />
            </div>
          )}
        </div>

        {/* Render the modal conditionally */}
        {isModalOpen && (
          <PlaylistSelectionModal
            playlists={playlists}
            onSelect={handleAddVideoToPlaylist}
            onClose={handleCloseModal}
            videoTitle={videoToMove?.title}
          />
        )}
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />
    </>
  );
};

export default DashboardPage;