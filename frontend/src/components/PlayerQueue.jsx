import React, { useRef, useEffect } from "react";
import { IoShuffle, IoTrashOutline } from "react-icons/io5";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import QueueItem from "./QueueItem";

const PlayerQueue = ({
  queue,
  currentVideoIndex,
  onShuffle,
  onPlayFromQueue,
  onDragEnd,
  onClearQueue,
}) => {
  const itemRefs = useRef([]);
  // Ensure the array of refs is the same size as the queue.
  itemRefs.current = itemRefs.current.slice(0, queue.length);

  // This effect runs whenever the currently playing video changes.
  useEffect(() => {
    // Find the ref for the active item and scroll it into view.
    const activeItemRef = itemRefs.current[currentVideoIndex];
    if (activeItemRef) {
      activeItemRef.scrollIntoView({
        behavior: "smooth",
        block: "start", 
      });
    }
  }, [currentVideoIndex]);

  return (
    <div className="h-full flex flex-col bg-black rounded-lg p-2">
      {/* Header with Title and Action Buttons */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">
          Up Next
        </h3>
        <div>
          <button
            onClick={onShuffle}
            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700"
            title="Shuffle Queue"
          >
            <IoShuffle size={20} />
          </button>
          <button
            onClick={onClearQueue}
            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700"
            title="Clear Queue"
          >
            <IoTrashOutline size={20} />
          </button>
        </div>
      </div>

      {/* List of Videos in the Queue */}
      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="flex-grow overflow-y-auto hide-scrollbar">
          <SortableContext items={queue} strategy={verticalListSortingStrategy}>
            <ul>
              {queue.map((video, index) => (
                <QueueItem
                  ref={(el) => (itemRefs.current[index] = el)}
                  key={video.id}
                  id={video.id}
                  video={video}
                  index={index}
                  isActive={index === currentVideoIndex}
                  onSelect={() => onPlayFromQueue(index)}
                />
              ))}
            </ul>
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
};

export default PlayerQueue;
