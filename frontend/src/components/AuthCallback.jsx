import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // 1. Get the token from the URL query parameter
    const token = searchParams.get('token');

    if (token) {
      // 2. Save the token to localStorage
      console.log("Token received, saving to localStorage...");
      localStorage.setItem('jwt_token', token);
      
      // 3. Redirect the user to the main dashboard
      navigate('/', { replace: true });
    } else {
      // If no token is found, something went wrong. Redirect to login.
      console.error("No token found in callback URL.");
      navigate('/login', { replace: true });
    }
  }, [navigate, searchParams]);

  // Render a simple loading message while the redirect happens
  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-xl">Logging you in...</p>
    </div>
  );
};

export default AuthCallback;