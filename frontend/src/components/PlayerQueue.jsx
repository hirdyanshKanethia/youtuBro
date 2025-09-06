import React from "react";
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
  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-lg p-4">
      {/* Header with Title and Action Buttons */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h3 className="text-xl font-bold">Up Next</h3>
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
