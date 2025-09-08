import React from "react";

const Message = ({ sender, text }) => {
  // Determine the styles based on who the sender is.
  const isUser = sender === "user";

  const bubbleStyles = isUser
    ? "bg-purple-600 text-white self-end"
    : "bg-gray-700 text-gray-200 self-start";

  const containerStyles = isUser ? "justify-end" : "justify-start";

  return (
    <div className={`flex w-full mb-3 ${containerStyles}`}>
      <div className={`p-3 rounded-lg max-w-lg ${bubbleStyles}`}>
        <p>{text}</p>
      </div>
    </div>
  );
};

export default Message;
