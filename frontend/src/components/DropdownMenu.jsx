import React from 'react';

const DropdownMenu = ({ options, onCloseMenu }) => {
  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50"
    >
      <ul className="py-1">
        {options.map((option, index) => {
          const className = option.className || 'text-gray-300 hover:bg-purple-600 hover:text-white';
          return (
            <li key={index}>
              <button
                title={option.label}
                onClick={() => {
                  option.action();
                  onCloseMenu();
                }}
                className={`w-full text-left px-4 py-2 text-sm ${className}`}
              >
                {option.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default DropdownMenu;
