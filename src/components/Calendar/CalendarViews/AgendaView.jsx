import React, { useState, useEffect, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import { FaCheck, FaTrash, FaChevronDown } from "react-icons/fa";
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
  const [visibleDates, setVisibleDates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [startDate, setStartDate] = useState(currentDate.startOf('week'));
  const [endDate, setEndDate] = useState(currentDate.add(30, 'days'));
  const observerRef = useRef(null);
  const loadingRef = useRef(null);
  
  // Function to group events by date
  const getEventsByDate = useCallback((start, end) => {
    // Filter events in the range
    const filteredEvents = events.filter(event => {
      const eventDate = dayjs(event.date);
      return (eventDate.isAfter(start) || eventDate.isSame(start, 'day')) && 
             (eventDate.isBefore(end) || eventDate.isSame(end, 'day'));
    });
    
    // Group events by date
    const grouped = {};
    filteredEvents.forEach(event => {
      if (!grouped[event.date]) {
        grouped[event.date] = [];
      }
      grouped[event.date].push(event);
    });
    
    // Sort events within each date
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        // All-day events first
        if (!a.time && b.time) return -1;
        if (a.time && !b.time) return 1;
        if (!a.time && !b.time) return 0;
        
        // Then sort by time
        const [hoursA, minutesA] = a.time.split(':').map(Number);
        const [hoursB, minutesB] = b.time.split(':').map(Number);
        return (hoursA * 60 + minutesA) - (hoursB * 60 + minutesB);
      });
    });
    
    return grouped;
  }, [events]);
  
  // Initial load of events
  useEffect(() => {
    const initialEventsByDate = getEventsByDate(startDate, endDate);
    const dates = Object.keys(initialEventsByDate).sort();
    setVisibleDates(dates);
  }, [startDate, endDate, getEventsByDate]);
  
  // Setup infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreEvents();
        }
      },
      { threshold: 0.1 }
    );
    
    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }
    
    observerRef.current = observer;
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading]);
  
  // Load more events
  const loadMoreEvents = () => {
    setIsLoading(true);
    
    // Simulate loading delay for smooth experience
    setTimeout(() => {
      const newEndDate = endDate.add(30, 'days');
      const newEventsByDate = getEventsByDate(endDate, newEndDate);
      const newDates = Object.keys(newEventsByDate).sort();
      
      setEndDate(newEndDate);
      setVisibleDates(prevDates => {
        // Remove duplicates
        const combined = [...prevDates, ...newDates];
        return [...new Set(combined)].sort();
      });
      
      // Check if we have more dates to load (set a reasonable limit)
      if (newEndDate.diff(currentDate, 'year') > 2) {
        setHasMore(false);
      }
      
      setIsLoading(false);
    }, 300);
  };
  
  // Group events by month for better organization
  const groupedByMonth = visibleDates.reduce((acc, date) => {
    const monthKey = dayjs(date).format('MMMM YYYY');
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(date);
    return acc;
  }, {});
  
  // Get events for a particular date
  const getEventsForDate = (date) => {
    return events.filter(event => event.date === date);
  };
  
  // Calculate completion status for a day
  const getDayCompletionStatus = (date) => {
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length === 0) return { percent: 0, completed: 0, total: 0 };
    
    const completed = dayEvents.filter(event => event.completed).length;
    const total = dayEvents.length;
    const percent = Math.round((completed / total) * 100);
    
    return { percent, completed, total };
  };
  
  // Get appropriate style based on completion percentage
  const getProgressStyle = (percent) => {
    if (percent >= 100) return 'bg-green-500';
    if (percent >= 75) return 'bg-green-400';
    if (percent >= 50) return 'bg-yellow-400';
    if (percent >= 25) return 'bg-orange-400';
    return 'bg-red-400';
  };
  
  return (
    <div className="overflow-auto max-h-[800px] pb-4">
      <div className="sticky top-0 z-10 py-3 px-4 border-b bg-white shadow-sm">
        <h3 className="text-xl font-semibold">Events on your way</h3>
        <p className="text-sm text-gray-600">Showing all your tasks and events</p>
      </div>
      
      <div className="divide-y">
        {Object.keys(groupedByMonth).sort().map(month => (
          <div key={month} className="bg-white">
            <div className="sticky top-14 z-10 bg-gray-100 py-2 px-4 font-semibold text-gray-800 flex items-center">
              <span>{month}</span>
              <div className="ml-auto flex items-center text-sm text-gray-600">
                <span>Progress view</span>
                <FaChevronDown className="ml-1" size={12} />
              </div>
            </div>
            
            {groupedByMonth[month].map(date => {
              const dayEvents = getEventsForDate(date);
              if (dayEvents.length === 0) return null;
              
              const dateObj = dayjs(date);
              const isToday = dateObj.isSame(dayjs(), 'day');
              const { percent, completed, total } = getDayCompletionStatus(date);
              const progressStyle = getProgressStyle(percent);
              
              return (
                <div key={date} className="border-b">
                  <div className={`py-3 px-4 ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
                    <div className="flex items-center mb-2">
                      <div className={`flex flex-col items-center justify-center rounded-full 
                        ${isToday ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} 
                        w-10 h-10 mr-3`}>
                        <span className="text-sm font-medium">{dateObj.format("D")}</span>
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-lg font-medium">{dateObj.format("dddd")}</h4>
                        <p className="text-sm text-gray-600">{dateObj.format("MMMM D, YYYY")}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium">{completed}/{total} completed</span>
                        <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                          <div 
                            className={`h-full rounded-full ${progressStyle}`} 
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* All-day events first */}
                    {dayEvents.filter(event => !event.time).length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-xs font-medium uppercase text-gray-500 mb-2">All-day</h5>
                        <div className="space-y-1">
                          {dayEvents
                            .filter(event => !event.time)
                            .map((event, idx) => renderEvent(event, idx))}
                        </div>
                      </div>
                    )}
                    
                    {/* Timed events */}
                    {dayEvents.filter(event => event.time).length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium uppercase text-gray-500 mb-2">Scheduled</h5>
                        <div className="space-y-1">
                          {dayEvents
                            .filter(event => event.time)
                            .map((event, idx) => renderEvent(event, idx))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        
        {/* Loading indicator */}
        {hasMore && (
          <div ref={loadingRef} className="py-4 text-center">
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                <span className="text-gray-600">Loading more events...</span>
              </div>
            ) : (
              <span className="text-gray-500">Scroll for more events</span>
            )}
          </div>
        )}
        
        {!hasMore && visibleDates.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg">No events found</p>
            <p className="text-sm mt-2">Add events to your calendar to see them here</p>
          </div>
        )}
      </div>
    </div>
  );
  
  // Helper function to render an event
  function renderEvent(event, idx) {
    // Check for conflicts
    const conflicts = detectEventConflicts(events).find(e => e.id === event.id);
    const hasConflicts = conflicts && conflicts.conflictCount > 0;
    
    return (
      <div 
        key={idx} 
        className="p-3 bg-white rounded-lg border hover:shadow-md transition-all cursor-pointer flex items-start group"
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
            <div className="text-sm text-gray-600 mt-1">{event.description}</div>
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
  }
};

export default AgendaView;