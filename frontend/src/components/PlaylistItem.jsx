import React, { useState, useEffect, useRef } from "react";
import { BsFillPlayFill, BsThreeDotsVertical } from "react-icons/bs";
import DropdownMenu from "./DropdownMenu";

const PlaylistItem = ({
  playlist,
  onSelect,
  onPlay,
  onShufflePlay,
  onDelete,
  isSelected,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

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
    { label: "Shuffle Play", action: onShufflePlay },
    {
      label: "Delete Playlist",
      action: onDelete,
      className: "text-red-500 hover:bg-red-500 hover:text-white", 
    },
  ];

  return (
    <li
      onClick={onSelect}
      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors duration-200 group ${
        isSelected ? "bg-purple-600" : "hover:bg-gray-600"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Add 'group relative' to the thumbnail container */}
        <div className="relative flex-shrink-0">
          <img
            src={playlist.thumbnail}
            alt={playlist.name}
            className="w-12 h-12 rounded object-cover"
          />
          {/* The play button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className="absolute inset-0 flex items-center truncate justify-center bg-black bg-opacity-50 rounded opacity-0 cursor-pointer group-hover:opacity-100 transition-opacity"
            title={`Play ${playlist.name}`}
          >
            <BsFillPlayFill size={28} className="text-fuchsia-500" />
          </button>
        </div>
        <div>
          <p className="font-semibold text-white">{playlist.name}</p>
          <p className="text-sm text-gray-400">{playlist.videoCount} videos</p>
        </div>
      </div>
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          className="text-gray-400 hover:text-black p-2 rounded-full hover:bg-blue-500 cursor-pointer"
        >
          <BsThreeDotsVertical size={20} />
        </button>
        {isMenuOpen && (
          <DropdownMenu options={menuOptions} onCloseMenu={closeMenu} />
        )}
      </div>
    </li>
  );
};

export default PlaylistItem;
