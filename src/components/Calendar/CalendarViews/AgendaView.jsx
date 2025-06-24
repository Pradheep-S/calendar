import React from 'react';
import dayjs from 'dayjs';
import { FaCheck, FaTrash } from "react-icons/fa";
import { getEventTime } from '../utils/dateUtils';

const AgendaView = ({ 
  currentDate, 
  events, 
  toggleEventCompletion, 
  deleteEvent, 
  setSelectedEvent, 
  setShowEventPopup,
  showConflictDetails,
  detectEventConflicts
}) => {
  // Get events for the next 14 days
  const startDate = currentDate.startOf('day');
  const endDate = startDate.add(14, 'day');
  
  // Filter and sort events for the date range
  const agendaEvents = events
    .filter(event => {
      const eventDate = dayjs(event.date);
      return eventDate.isAfter(startDate) || eventDate.isSame(startDate, 'day');
    })
    .sort((a, b) => {
      // Sort by date first
      const dateA = dayjs(a.date);
      const dateB = dayjs(b.date);
      if (!dateA.isSame(dateB, 'day')) {
        return dateA.diff(dateB);
      }
      
      // If same date, sort by time
      if (!a.time && b.time) return -1; // All-day events first
      if (a.time && !b.time) return 1;
      if (!a.time && !b.time) return 0;
      
      // Both have times, compare them
      const [hoursA, minutesA] = a.time.split(':').map(Number);
      const [hoursB, minutesB] = b.time.split(':').map(Number);
      return (hoursA * 60 + minutesA) - (hoursB * 60 + minutesB);
    });
  
  // Group events by date
  const eventsByDate = {};
  agendaEvents.forEach(event => {
    if (!eventsByDate[event.date]) {
      eventsByDate[event.date] = [];
    }
    eventsByDate[event.date].push(event);
  });
  
  return (
    <div className="overflow-auto max-h-[800px]">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-xl font-semibold">Upcoming Events</h3>
        <p className="text-sm text-gray-600">Next 14 days</p>
      </div>
      
      {Object.keys(eventsByDate).length > 0 ? (
        Object.keys(eventsByDate).sort().map(date => {
          const dayEvents = eventsByDate[date];
          const dateObj = dayjs(date);
          const isToday = dateObj.isSame(dayjs(), 'day');
          
          return (
            <div key={date} className="border-b">
              <div className={`py-2 px-4 ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <div className="flex items-center">
                  <div className={`flex flex-col items-center justify-center rounded-full 
                    ${isToday ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} 
                    w-10 h-10 mr-3`}>
                    <span className="text-sm font-medium">{dateObj.format("D")}</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium">{dateObj.format("dddd")}</h4>
                    <p className="text-sm text-gray-600">{dateObj.format("MMMM D, YYYY")}</p>
                  </div>
                </div>
              </div>
              
              <div className="divide-y">
                {dayEvents.map((event, idx) => {
                  // Check for conflicts
                  const conflicts = detectEventConflicts(events).find(e => e.id === event.id);
                  const hasConflicts = conflicts && conflicts.conflictCount > 0;
                  
                  return (
                    <div 
                      key={idx} 
                      className="p-3 hover:bg-gray-50 cursor-pointer flex items-start group"
                      onClick={() => {
                        if (hasConflicts) {
                          showConflictDetails(event, conflicts);
                        } else {
                          setSelectedEvent(event);
                          setShowEventPopup(true);
                        }
                      }}
                    >
                      <div 
                        className={`w-4 h-4 rounded-full mt-1 mr-3 flex-shrink-0 ${hasConflicts ? 'ring-2 ring-yellow-300' : ''}`}
                        style={{ backgroundColor: event.color || "#4285F4" }}
                      ></div>
                      <div className="flex-grow">
                        <div className={`font-medium ${event.completed ? 'line-through text-gray-500' : ''}`}>
                          {event.title}
                          {hasConflicts && (
                            <span className="ml-2 text-yellow-500 text-sm">⚠️ Time conflict</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {event.time ? getEventTime(event) : 'All day'} 
                          {event.duration && event.time ? ` • ${event.duration}` : ''}
                        </div>
                        {event.description && (
                          <div className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          className={`p-1.5 rounded-full ${
                            event.completed 
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-200 text-gray-600 hover:bg-green-600 hover:text-white'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEventCompletion(event.id);
                          }}
                          title={event.completed ? "Mark as not completed" : "Mark as completed"}
                        >
                          <FaCheck size={12} />
                        </button>
                        <button 
                          className="p-1.5 rounded-full bg-gray-200 text-gray-600 hover:bg-red-600 hover:text-white"
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
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <div className="p-8 text-center text-gray-500">
          <p className="text-lg">No upcoming events</p>
          <p className="text-sm mt-2">Click the "Create" button to add a new event</p>
        </div>
      )}
    </div>
  );
};

export default AgendaView;