import React from 'react';
import { useDraggable } from "@dnd-kit/core";
import { FaCheck, FaTrash } from "react-icons/fa";
import { getEventTime } from '../utils/dateUtils';

const DraggableEvent = ({ 
  event, 
  toggleEventCompletion, 
  deleteEvent, 
  setSelectedEvent,
  setShowEventPopup,
  setTooltip,
  events,
  detectEventConflicts,
  showConflictDetails
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id.toString(),
    data: { event }
  });

  // Check if this event has conflicts
  const conflicts = detectEventConflicts(events).find(e => e.id === event.id);
  const hasConflicts = conflicts && conflicts.conflictCount > 0;

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.7 : 1,
    backgroundColor: event.completed ? `${event.color}88` : event.color || "#4285F4",
    color: "white",
    textDecoration: event.completed ? 'line-through' : 'none',
    backgroundImage: event.completed ? 'linear-gradient(rgba(255,255,255,0.2), rgba(255,255,255,0.2))' : 'none',
    border: hasConflicts ? '2px dashed #FBBC05' : 'none',
    boxShadow: isDragging ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : 'none',
    zIndex: isDragging ? 50 : 'auto',
  } : {
    backgroundColor: event.completed ? `${event.color}88` : event.color || "#4285F4",
    color: "white",
    textDecoration: event.completed ? 'line-through' : 'none',
    backgroundImage: event.completed ? 'linear-gradient(rgba(255,255,255,0.2), rgba(255,255,255,0.2))' : 'none',
    border: hasConflicts ? '2px dashed #FBBC05' : 'none',
  };

  // Define the mouse enter handler
  const handleMouseEnter = (e) => {
    if (isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    setTooltip({
      visible: true,
      event,
      position: {
        x: rect.left + (rect.width / 2),
        y: rect.top + scrollTop
      }
    });
  };

  // Define the mouse leave handler
  const handleMouseLeave = () => {
    setTooltip({
      visible: false,
      event: null,
      position: { x: 0, y: 0 }
    });
  };

  return (
    <div 
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`text-xs p-1.5 mb-1.5 rounded-md truncate flex items-center group relative cursor-move
        ${event.completed ? 'opacity-75' : ''}
        ${isDragging ? 'opacity-50 scale-95' : 'hover:scale-[1.02]'}
        transition-all duration-200 ease-in-out shadow-sm hover:shadow
      `}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        if (hasConflicts) {
          showConflictDetails(event, conflicts);
        } else {
          // Show the event popup on click
          setSelectedEvent(event);
          setShowEventPopup(true);
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${event.completed ? 'bg-gray-300' : 'bg-white'} mr-1.5 flex-shrink-0`}></div>
      <div className="truncate flex items-center">
        {getEventTime(event)} {event.title}
        {hasConflicts && (
          <span className="ml-1.5 text-yellow-300 flex-shrink-0 animate-pulse">⚠️</span>
        )}
      </div>
      
      {/* Action buttons that appear on hover */}
      <div className="absolute right-1 top-1 hidden group-hover:flex space-x-1 bg-black bg-opacity-25 rounded p-0.5">
        <button 
          className={`p-1 flex items-center justify-center rounded-full
            ${event.completed 
              ? 'text-white bg-green-600 hover:bg-green-700' 
              : 'text-white bg-gray-600 hover:bg-green-600'}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleEventCompletion(event.id);
          }}
          title={event.completed ? "Mark as not completed" : "Mark as completed"}
        >
          <FaCheck size={10} />
        </button>
        <button 
          className="p-1 flex items-center justify-center rounded-full text-white bg-gray-600 hover:bg-red-600"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Are you sure you want to delete this event?')) {
              deleteEvent(event.id);
              // Close any popups or modals
              setShowEventPopup(false);
            }
          }}
          title="Delete event"
        >
          <FaTrash size={10} />
        </button>
      </div>
    </div>
  );
};

export default DraggableEvent;