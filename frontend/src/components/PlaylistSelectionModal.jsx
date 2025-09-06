import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { IoClose } from "react-icons/io5";

const PlaylistSelectionModal = ({
  playlists,
  onSelect,
  onClose,
  videoTitle,
}) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if the key pressed was 'Escape'.
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Find the portal target element.
  const portalRoot = document.getElementById("portal-root");

  if (!portalRoot) {
    return null;
  }

  const modalJsx = (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border-2 border-purple-500">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Add "{videoTitle}" to...</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <IoClose size={24} />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto hide-scrollbar">
          <ul>
            {playlists.map((playlist) => (
              <li
                key={playlist.id}
                // When a playlist is clicked, perform the selection and then close the modal.
                onClick={() => {
                  onSelect(playlist.id);
                  onClose();
                }}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-purple-600"
              >
                <img
                  src={playlist.thumbnail}
                  alt={playlist.name}
                  className="w-12 h-12 rounded object-cover"
                />
                <div>
                  <p className="font-semibold text-white">{playlist.name}</p>
                  <p className="text-sm text-gray-400">
                    {playlist.videoCount} videos
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  return createPortal(modalJsx, portalRoot);
};

export default PlaylistSelectionModal;
