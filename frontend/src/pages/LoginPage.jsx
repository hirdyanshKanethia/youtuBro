import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();

  // If a user who is already logged in lands here, redirect them to the dashboard
  useEffect(() => {
    if (localStorage.getItem('jwt_token')) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // Your backend login endpoint
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const loginUrl = `${API_URL}/auth/login`;

  return (
    <div className="flex items-center justify-center h-screen bg-gray-800">
      <div className="text-center p-10 bg-gray-900 rounded-lg shadow-xl">
        <h1 className="text-5xl font-bold mb-4 text-purple-400">YoutuBro</h1>
        <p className="text-gray-300 mb-8 max-w-md mx-auto">
          Your intelligent YouTube assistant. Create, manage, and discover playlists with the power of AI. Just tell us what you want to do.
        </p>
        <a 
          href={loginUrl}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 inline-block"
        >
          Login with Google
        </a>
      </div>
    </div>
  );
};

export default LoginPage;