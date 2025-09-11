import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../api";
import { IoClose } from "react-icons/io5";

const ActionHistory = ({ onClose }) => {
  const [actions, setActions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch actions when the modal mounts
  useEffect(() => {
    const fetchActions = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("/actions");
        if (response.data.success) {
          setActions(response.data.actions);
        }
      } catch (error) {
        console.error("Failed to fetch actions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchActions();
  }, []);

  // Effect for closing with the Escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const portalRoot = document.getElementById("portal-root");
  if (!portalRoot) return null;

  const modalJsx = (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-black rounded-lg p-6 w-full max-w-md border-2 border-purple-500">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl text-white font-bold">Action History</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <IoClose size={24} />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto hide-scrollbar">
          {isLoading ? (
            <p className="text-gray-400">Loading history...</p>
          ) : (
            <ul className="space-y-3">
              {actions.length > 0 ? (
                actions.map((action, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-300 border-b border-gray-700 pb-2"
                  >
                    <p>{action.message}</p>
                    <p className="text-xs text-gray-500 text-right mt-1">
                      {new Date(action.created_at).toLocaleString()}
                    </p>
                  </li>
                ))
              ) : (
                <p className="text-gray-400">No recent actions found.</p>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalJsx, portalRoot);
};

export default ActionHistory;
