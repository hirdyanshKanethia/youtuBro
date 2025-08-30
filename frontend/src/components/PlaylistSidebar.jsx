import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // You will use this later

const PlaylistSidebar = () => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TODO: Fetch playlists from your /api/playlists endpoint
    // const fetchPlaylists = async () => {
    //   setLoading(true);
    //   // const token = localStorage.getItem('jwt_token');
    //   // const response = await axios.get('/api/playlists', { headers: { Authorization: `Bearer ${token}` } });
    //   // setPlaylists(response.data.playlists);
    //   setLoading(false);
    // };
    // fetchPlaylists();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Your Playlists</h2>
      {loading ? <p>Loading...</p> : (
        <ul>
          {/* This is placeholder data */}
          <li className="p-2 hover:bg-gray-700 rounded cursor-pointer">Workout Mix</li>
          <li className="p-2 hover:bg-gray-700 rounded cursor-pointer">Study Beats</li>
          <li className="p-2 hover:bg-gray-700 rounded cursor-pointer">Rock Anthems</li>
        </ul>
      )}
    </div>
  );
};

export default PlaylistSidebar;