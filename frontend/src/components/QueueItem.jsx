import React from 'react';

const QueueItem = ({ video, index, isActive, onSelect }) => {
  return (
    <li 
      onClick={onSelect}
      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${isActive ? 'bg-purple-600' : 'hover:bg-gray-700'}`}
    >
      <span className="text-sm text-gray-400 font-medium w-6 text-center">{index + 1}</span>
      <img 
        src={video.thumbnail} 
        alt={video.title} 
        className="w-16 h-12 rounded object-cover flex-shrink-0" 
      />
      <p className={`font-semibold text-sm flex-grow truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
        {video.title}
      </p>
    </li>
  );
};

export default QueueItem;