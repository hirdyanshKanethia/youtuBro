import React, { useState } from 'react';
import PlaylistSidebar from '../components/PlaylistSidebar';
import YouTubePlayer from '../components/YouTubePlayer';
import ChatInterface from '../components/ChatInterface';

const DashboardPage = () => {
  const [videoQueue, setVideoQueue] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // This function will be passed to the ChatInterface to update the queue
  const handlePlayVideoQueue = (videos) => {
    setVideoQueue(videos);
    setCurrentVideoIndex(0);
  };

  return (
    <div className="flex h-screen p-4 gap-4">
      {/* Column 1: Playlist Sidebar */}
      <div className="w-1/4 bg-gray-800 rounded-lg p-4">
        <PlaylistSidebar />
      </div>

      {/* Column 2: Main Content (Player and Chat) */}
      <div className="w-3/4 flex flex-col gap-4">
        <div className="h-3/5 bg-gray-800 rounded-lg">
          <YouTubePlayer 
            videoQueue={videoQueue}
            currentVideoIndex={currentVideoIndex}
            setCurrentVideoIndex={setCurrentVideoIndex}
          />
        </div>
        <div className="h-2/5 bg-gray-800 rounded-lg p-4">
          <ChatInterface onPlayVideo={handlePlayVideoQueue} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;