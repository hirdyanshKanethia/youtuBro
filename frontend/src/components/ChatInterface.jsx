import React, { useState } from 'react';
import api from '../api';

const ChatInterface = ({ onPlayVideo }) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const newMessages = [...messages, { sender: 'user', text: prompt }];
    setMessages(newMessages);
    setLoading(true);
    setPrompt('');

    try {
      const response = await api.post('/chat', { prompt });
      const botResponse = response.data;
      setMessages(prev => [...prev, { sender: 'bot', text: botResponse.message }]);

      // This part now calls the simplified handlePlayVideo function in the Dashboard.
      if (botResponse.action === 'play' && botResponse.videos) {
        onPlayVideo(botResponse.videos);
      }
    } catch (error) {
      console.error("Chat API error:", error);
      const errorMessage = error.response?.data?.message || "Sorry, something went wrong.";
      setMessages(prev => [...prev, { sender: 'bot', text: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    // The JSX for this component remains the same.
    <div className="flex flex-col h-full">
      {/* ... */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Play a song by metallica..."
          className="w-full p-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={loading}
        />
      </form>
    </div>
  );
};

export default ChatInterface;