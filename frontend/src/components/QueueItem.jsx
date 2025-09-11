import React, { forwardRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaPlay } from "react-icons/fa"; 

const QueueItem = forwardRef(({ id, video, index, isActive, onSelect }, ref) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={(node) => {
        setNodeRef(node);
        ref(node)
      }}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-3 p-2 rounded-lg cursor-grab ${ 
        isActive ? "bg-purple-600 bg-opacity-70" : "hover:bg-gray-700" 
      }`}
    >
      <span className="text-sm text-gray-400 font-medium w-6 text-center">
        {index + 1}
      </span>
      
      {/* Thumbnail Container - Make it relative for absolute positioning of play button */}
      <div className="relative w-16 h-12 flex-shrink-0">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full rounded object-cover" 
        />
        {/* Play Button Overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(); 
          }}
          className="absolute inset-0 flex items-center justify-center 
                     bg-black bg-opacity-50 hover:bg-opacity-75 transition-opacity rounded 
                     text-white opacity-0 hover:opacity-100 focus:opacity-100" 
          title={`Play ${video.title}`}
        >
          <FaPlay size={16} className="text-fuchsia-500 cursor-pointer" /> {/* Play icon */}
        </button>
      </div>

      <p
        className={`font-semibold text-sm flex-grow truncate ${
          isActive ? "text-white" : "text-gray-300"
        }`}
      >
        {video.title}
      </p>
    </li>
  );

});


export default QueueItem;