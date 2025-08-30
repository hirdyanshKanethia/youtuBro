import React, { useState } from 'react';
import api from '../api'; // Import the configured Axios instance

const ChatInterface = ({ onPlayVideo }) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    // Add user's message to the chat display
    const newMessages = [...messages, { sender: 'user', text: prompt }];
    setMessages(newMessages);
    setLoading(true);
    setPrompt('');

    try {
      // Send the user's prompt to the backend /chat endpoint.
      // The interceptor in api.js automatically adds the auth token.
      const response = await api.post('/chat', { prompt });
      console.log(response.data)
      const botResponse = response.data;

      // Add the bot's response message to the chat display.
      setMessages(prev => [...prev, { sender: 'bot', text: botResponse.message }]);

      // If the backend responds with a 'play' action and a list of videos,
      // call the onPlayVideo function passed down from the parent component.
      if (botResponse.action === 'play' && botResponse.videos) {
        onPlayVideo(botResponse.videos);
      }
    } catch (error) {
      // Handle potential API errors.
      console.error("Chat API error:", error);
      const errorMessage = error.response?.data?.message || "Sorry, something went wrong.";
      setMessages(prev => [...prev, { sender: 'bot', text: errorMessage }]);
    } finally {
      // Ensure the loading state is reset after the request is complete.
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto mb-4 p-2 bg-gray-900 rounded">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block p-2 rounded-lg ${msg.sender === 'user' ? 'bg-purple-600' : 'bg-gray-700'}`}>
              {msg.text}
            </span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Create a playlist of 20 rock songs..."
          className="w-full p-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={loading}
        />
      </form>
    </div>
  );
};

export default ChatInterface;