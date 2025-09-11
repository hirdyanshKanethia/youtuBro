import React, { useState, useEffect, useRef } from "react";
import { VscHistory } from "react-icons/vsc";
import api from "../api";
import Message from "./Message";

const ChatInterface = ({ onPlayVideo, onToggleHistory }) => {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! How can I help you today? You can ask me to create a playlist, play a video, manage your playlists.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const newMessages = [...messages, { sender: "user", text: prompt }];
    setMessages(newMessages);
    setLoading(true);
    setPrompt("");

    try {
      const response = await api.post("/chat", { prompt });
      const botResponse = response.data;
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: botResponse.message },
      ]);

      if (botResponse.action === "play" && botResponse.videos) {
        onPlayVideo(botResponse.videos);
      }
    } catch (error) {
      console.error("Chat API error:", error);

      let errorMessage = "Sorry, an unexpected error occurred.";
      if (error.code === "ECONNABORTED") {
        errorMessage =
          "The server is taking too long to respond. Please try again later.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setMessages((prev) => [...prev, { sender: "bot", text: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto mb-4 p-2 bg-gray-950 rounded hide-scrollbar">
        {messages.map((msg, index) => (
          <Message key={index} sender={msg.sender} text={msg.text} />
        ))}
        {/* Add an empty div at the end of the list with the ref attached. */}
        <div ref={messagesEndRef} />
      </div>
      <div className="relative flex items-center">
        <form onSubmit={handleSubmit} className="w-full">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Your command goes here..."
            className="w-full p-3 bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={loading}
          />
        </form>
        <button
          onClick={onToggleHistory}
          className="absolute right-3 text-gray-400 hover:text-white cursor-pointer"
          title="View Action History"
        >
          <VscHistory size={22} />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
