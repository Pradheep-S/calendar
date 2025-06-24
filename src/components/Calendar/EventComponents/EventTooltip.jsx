import React from 'react';
import dayjs from 'dayjs';
import { FaCheck } from 'react-icons/fa';
import { getEventTime } from '../utils/dateUtils';

const EventTooltip = ({ tooltip }) => {
  const { event, position } = tooltip;

  return (
    <div 
      className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 w-64 animate-fadeIn"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-10px'
      }}
    >
      <div 
        className="w-full h-1.5 absolute top-0 left-0 rounded-t-lg"
        style={{ backgroundColor: event.color || "#4285F4" }}
      ></div>
      <div className="mt-2.5">
        <h4 className="font-medium text-sm">{event.title}</h4>
        <div className="text-xs text-gray-600 mt-1.5 flex items-center">
          <span className="mr-2">📅 {dayjs(event.date).format("MMM D, YYYY")}</span>
          {event.time && (
            <span>⏰ {getEventTime(event)}</span>
          )}
        </div>
        {event.description && (
          <div className="text-xs mt-2 text-gray-700 border-t pt-1.5">
            {event.description}
          </div>
        )}
        {event.completed && (
          <div className="text-xs mt-1.5 text-green-600 flex items-center">
            <FaCheck size={10} className="mr-1" /> Completed
          </div>
        )}
      </div>
    </div>
  );
};

export default EventTooltip;