import React, { useState, useEffect, useRef } from "react";
import { BsFillPlayFill, BsThreeDotsVertical } from "react-icons/bs";
import DropdownMenu from "./DropdownMenu";

const VideoItem = ({ video, onPlay, onAddToQueue, onAddToPlaylist, onRemoveFromPlaylist }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // This effect handles closing the menu if you click outside of it.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const closeMenu = () => setIsMenuOpen(false);

  const menuOptions = [
    { label: "Add to queue", action: () => onAddToQueue(video) },
    { label: "Add to another playlist", action: onAddToPlaylist },
    {
      label: "Remove from this playlist",
      action: onRemoveFromPlaylist,
      className: "text-red-500 hover:bg-red-500 hover:text-white",
    },
  ];

  return (
    <li
      onClick={onPlay}
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700"
    >
      {/* Image and Thumbnail div */}
      <div className="relative group flex-shrink-0">
        <img
          src={video.thumbnail || "https://via.placeholder.com/120x90"}
          alt={video.title}
          className="w-12 h-8 rounded object-cover"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded opacity-0 cursor-pointer group-hover:opacity-100 transition-opacity"
          title={`Play ${video.title}`}
        >
          <BsFillPlayFill size={28} className="text-fuchsia-500" />
        </button>
      </div>
      {/* Title and Hover title div */}
      <div className="relative group flex-grow truncate">
        <p className="font-semibold text-sm text-white truncate">
          {video.title}
        </p>
        <span className="absolute bottom-full left-0 mb-2 w-auto p-2 text-xs text-white bg-gray-800 rounded-md shadow-lg scale-0 group-hover:scale-100 transition-all duration-200 origin-bottom">
          {video.title}
        </span>
      </div>
      {/* 3 dot option div */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-600"
        >
          <BsThreeDotsVertical size={18} />
        </button>
        {isMenuOpen && (
          <DropdownMenu options={menuOptions} onCloseMenu={closeMenu} />
        )}
      </div>
    </li>
  );
};

export default VideoItem;
