import React from 'react';
import { createPortal } from 'react-dom';

const DropdownMenu = ({ options, position, onCloseMenu }) => {
  const menuStyle = {
    position: 'fixed', // Use fixed positioning
    top: `${position.top}px`,
    left: `${position.left}px`,
  };

  const menuJsx = (
    <div 
      style={menuStyle}
      className="w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50"
    >
      <ul className="py-1">
        {options.map((option, index) => (
          <li key={index}>
            <button
              onClick={() => {
                option.action();
                onCloseMenu();
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-purple-600 hover:text-white"
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return createPortal(menuJsx, document.getElementById('portal-root'));
};

export default DropdownMenu;