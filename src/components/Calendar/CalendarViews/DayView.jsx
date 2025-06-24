import React, { useRef, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { FaCheck, FaTrash } from "react-icons/fa";
import { getEventTime } from '../utils/dateUtils';

const DayView = ({ 
  currentDate, 
  events, 
  handleOpenModal, 
  toggleEventCompletion, 
  deleteEvent, 
  setSelectedEvent, 
  setShowEventPopup, 
  setTooltip,
  showConflictDetails,
  detectEventConflicts,
  handlePrev,
  handleNext
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const todayEvents = events.filter(event => event.date === currentDate.format("YYYY-MM-DD"));
  const [isMobile, setIsMobile] = useState(false);
  
  // For swipe navigation
  const containerRef = useRef(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  // Check if the device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup event listener
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;
  
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrev();
    }
  };

  // Handle hour cell click differently based on mobile/desktop
  const handleHourCellClick = (hour) => {
    if (!isMobile) {
      // Only open modal on desktop
      handleOpenModal(currentDate.hour(hour));
    }
    // On mobile, we don't open the modal
  };
  
  // Add swipe classes to enable horizontal scrolling
  useEffect(() => {
    if (containerRef.current) {
      const animateTransition = () => {
        containerRef.current.classList.add('animate-fadeIn');
        setTimeout(() => {
          containerRef.current.classList.remove('animate-fadeIn');
        }, 300);
      };
      animateTransition();
    }
  }, [currentDate]);
  
  // Modify the event handlers to disable tooltips
  const handleEventMouseEnter = (e, event) => {
    // Do nothing - tooltip disabled for DayView
    return;
  };
  
  const handleEventMouseLeave = () => {
    // Do nothing - tooltip disabled for DayView
    return;
  };

  return (
    <div 
      className="overflow-auto max-h-[800px] touch-pan-y"
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Day header */}
      <div className="py-3 px-4 border-b bg-gray-50">
        <div className="flex items-center">
          <div className={`flex flex-col items-center justify-center rounded-full ${
            currentDate.isSame(dayjs(), "day") 
              ? "bg-blue-600 text-white" 
              : "text-gray-800"
          } w-10 h-10 mr-4`}>
            <span className="text-sm font-medium">{currentDate.format("D")}</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold">{currentDate.format("dddd")}</h3>
            <div className="text-sm text-gray-600">{currentDate.format("MMMM D, YYYY")}</div>
          </div>
        </div>
      </div>

      {/* All-day events */}
      {todayEvents.filter(event => !event.time).length > 0 && (
        <div className="border-b">
          <div className="grid grid-cols-[80px_1fr]">
            <div className="py-2 px-3 text-xs font-medium text-gray-500 border-r">ALL DAY</div>
            <div className="p-1">
              {todayEvents
                .filter(event => !event.time)
                .map((event, idx) => (
                  <div 
                    key={idx} 
                    className="text-xs p-2 mb-1 rounded truncate cursor-pointer hover:shadow-sm transition-shadow" 
                    style={{ 
                      backgroundColor: event.completed ? `${event.color}99` : event.color || "#4285F4",
                      color: "white",
                      textDecoration: event.completed ? 'line-through' : 'none',
                      backgroundImage: event.completed ? 'linear-gradient(rgba(255,255,255,0.2), rgba(255,255,255,0.2))' : 'none',
                    }}
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowEventPopup(true);
                    }}
                  >
                    {event.title}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="grid grid-cols-[80px_1fr]">
        {/* Time column */}
        <div className="border-r">
          {hours.map(hour => (
            <div key={hour} className="h-12 border-b text-xs text-right pr-2 -mt-3 text-gray-500">
              {hour === 0 ? "" : `${hour % 12 || 12} ${hour < 12 ? "am" : "pm"}`}
            </div>
          ))}
        </div>

        {/* Day column with events */}
        <div className="relative">
          {/* Current time indicator */}
          {currentDate.isSame(dayjs(), "day") && (
            <div 
              className="absolute left-0 right-0 border-t border-red-500 z-20" 
              style={{ 
                top: `${dayjs().hour() * 48 + dayjs().minute() * 0.8}px`,
              }}
            >
              <div className="absolute -left-1 -top-[5px] w-2.5 h-2.5 rounded-full bg-red-500"></div>
            </div>
          )}

          {/* Hour blocks */}
          {hours.map(hour => (
            <div 
              key={hour} 
              className="h-12 border-b hover:bg-gray-50 relative cursor-pointer" 
              onClick={() => handleHourCellClick(hour)}
            >
              {/* Half-hour guide */}
              <div className="absolute left-0 right-0 top-1/2 border-t border-gray-100"></div>
            </div>
          ))}

          {/* Events */}
          {todayEvents
            .filter(event => event.time)
            .map((event, idx) => {
              const [eventHour, eventMinute] = event.time.split(":").map(Number);
              const durationMatch = event.duration.match(/(\d+)([hm])/);
              const durationHours = durationMatch
                ? durationMatch[2] === 'h' 
                  ? Number(durationMatch[1]) 
                  : Number(durationMatch[1]) / 60
                : 1;
              
              // Calculate event position
              const topPosition = eventHour * 48 + eventMinute * 0.8;
              const height = durationHours * 48;
              
              // Check for conflicts
              const conflicts = detectEventConflicts(events).find(e => e.id === event.id);
              const hasConflicts = conflicts && conflicts.conflictCount > 0;
              
              // Check for overlapping events to adjust width
              const overlappingEvents = todayEvents.filter(e => {
                if (e === event || !e.time) return false;
                const [eHour, eMinute] = e.time.split(":").map(Number);
                const eDurationMatch = e.duration.match(/(\d+)([hm])/);
                const eDurationHours = eDurationMatch
                  ? eDurationMatch[2] === 'h'
                    ? Number(eDurationMatch[1])
                    : Number(eDurationMatch[1]) / 60
                  : 1;
                
                const eventStart = eventHour + eventMinute / 60;
                const eventEnd = eventStart + durationHours;
                const eStart = eHour + eMinute / 60;
                const eEnd = eStart + eDurationHours;
                
                return (
                  (eStart >= eventStart && eStart < eventEnd) ||
                  (eEnd > eventStart && eEnd <= eventEnd) ||
                  (eStart <= eventStart && eEnd >= eventEnd)
                );
              });
              
              // Set width and offset based on overlaps
              const totalOverlapping = overlappingEvents.length + 1;
              const overlapIndex = overlappingEvents
                .filter(e => e.time <= event.time)
                .length;
              
              const width = totalOverlapping > 1 
                ? `calc(${100 / totalOverlapping}% - 4px)` 
                : 'calc(100% - 8px)';
              const left = totalOverlapping > 1 
                ? `calc(${(overlapIndex * 100) / totalOverlapping}% + 4px)` 
                : '4px';
              
              return (
                <div 
                  key={idx}
                  className={`absolute rounded overflow-hidden shadow-sm hover:shadow-md transition-shadow group
                    ${hasConflicts ? 'border-2 border-yellow-300' : ''}
                    ${event.completed ? 'border border-white/30' : ''}
                  `}
                  style={{
                    top: `${topPosition}px`,
                    height: `${height}px`,
                    left,
                    width,
                    backgroundColor: event.completed ? `${event.color}99` : event.color || "#4285F4",
                    backgroundImage: event.completed ? 'linear-gradient(rgba(255,255,255,0.2), rgba(255,255,255,0.2))' : 'none',
                    color: "white",
                    zIndex: 10,
                    textDecoration: event.completed ? 'line-through' : 'none'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasConflicts) {
                      showConflictDetails(event, conflicts);
                    } else {
                      setSelectedEvent(event);
                      setShowEventPopup(true);
                    }
                  }}
                  onMouseEnter={handleEventMouseEnter}
                  onMouseLeave={handleEventMouseLeave}
                >
                  <div className="p-2 h-full flex flex-col">
                    <div className="font-medium text-xs truncate">{event.title}</div>
                    <div className="text-xs opacity-90">{getEventTime(event)}</div>
                    {height > 60 && event.description && (
                      <div className="text-xs mt-1 line-clamp-2 opacity-90">{event.description}</div>
                    )}
                    
                    {/* Action buttons that appear on hover */}
                    <div className="absolute right-1 top-1 hidden group-hover:flex space-x-1 bg-black bg-opacity-30 backdrop-blur-sm rounded-full p-0.5">
                      <button 
                        className={`p-1 flex items-center justify-center rounded-full
                          ${event.completed 
                            ? 'bg-white text-green-600' 
                            : 'bg-white text-gray-600 hover:text-green-600'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEventCompletion(event.id);
                        }}
                        title={event.completed ? "Mark as not completed" : "Mark as completed"}
                      >
                        <FaCheck size={10} />
                      </button>
                      <button 
                        className="p-1 flex items-center justify-center rounded-full bg-white text-gray-600 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this event?')) {
                            deleteEvent(event.id);
                          }
                        }}
                        title="Delete event"
                      >
                        <FaTrash size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default DayView;