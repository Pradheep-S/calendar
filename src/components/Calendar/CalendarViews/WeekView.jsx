import React, { useRef, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { FaCheck, FaTrash } from "react-icons/fa";
import { getEventTime } from '../utils/dateUtils';

const WeekView = ({ 
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
  handleNext,
  setActiveView
}) => {
  const startOfWeek = currentDate.startOf("week");
  const weekDays = [];
  const hours = Array.from({ length: 24 }, (_, i) => i);
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

  // Generate the days for the current week
  for (let i = 0; i < 7; i++) {
    weekDays.push(startOfWeek.add(i, "day"));
  }
  
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

  // Handle day header click to navigate to day view
  const handleDayClick = (day) => {
    // Update the current date to the selected day
    handleOpenModal(day, true); // Pass true to skip opening the modal
    // Switch to day view
    setActiveView("Day");
  };

  // Handle time slot click to navigate to day view at specific time
  const handleTimeSlotClick = (day, hour) => {
    // Update the current date to the selected day and time
    handleOpenModal(day.hour(hour), true); // Pass true to skip opening the modal
    // Switch to day view
    setActiveView("Day");
  };

  // Handle event click - ensure this works on mobile
  const handleEventClick = (e, event, conflicts) => {
    e.stopPropagation();
    if (conflicts && conflicts.conflictCount > 0) {
      showConflictDetails(event, conflicts);
    } else {
      setSelectedEvent(event);
      setShowEventPopup(true);
    }
  };

  // Show tooltip on hover (desktop only)
  const handleEventMouseEnter = (e, event) => {
    if (isMobile) return;
    
    e.stopPropagation();
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
  
  // Hide tooltip when mouse leaves
  const handleEventMouseLeave = () => {
    if (isMobile) return;
    
    setTooltip({
      visible: false,
      event: null,
      position: { x: 0, y: 0 }
    });
  };

  return (
    <div 
      className="overflow-auto max-h-[800px] touch-pan-y"
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Week header with days - Better for mobile */}
      <div className={`grid ${isMobile ? 'grid-cols-[40px_1fr_1fr_1fr_1fr_1fr_1fr_1fr]' : 'grid-cols-[50px_1fr_1fr_1fr_1fr_1fr_1fr_1fr]'} border-b`}>
        <div className={`${isMobile ? 'p-1' : 'p-2'} border-r`}></div>
        {weekDays.map(day => {
          const isToday = day.isSame(dayjs(), "day");
          return (
            <div 
              key={day.format()} 
              className={`${isMobile ? 'p-1' : 'p-2'} text-center border-r ${isToday ? "bg-blue-50" : ""} cursor-pointer hover:bg-gray-50`}
              onClick={() => handleDayClick(day)}
            >
              <div className="font-medium">{isMobile ? day.format("ddd").charAt(0) : day.format("ddd")}</div>
              <div className={`text-sm ${isToday ? "bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto" : ""}`}>
                {day.date()}
              </div>
            </div>
          );
        })}
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-[40px_1fr_1fr_1fr_1fr_1fr_1fr_1fr]' : 'grid-cols-[50px_1fr_1fr_1fr_1fr_1fr_1fr_1fr]'}`}>
        {/* Time column */}
        <div className="border-r">
          {hours.map(hour => (
            <div key={hour} className={`${isMobile ? 'h-10' : 'h-12'} border-b flex items-center justify-end`}>
              <div className={`${isMobile ? 'text-[10px] pr-1' : 'text-xs pr-2'} text-gray-500`}>
                {hour === 0 ? "" : `${hour % 12 || 12}${isMobile ? '' : hour < 12 ? "a" : "p"}`}
              </div>
            </div>
          ))}
        </div>

        {/* Days columns with enhanced mobile support */}
        {weekDays.map(day => (
          <div 
            key={day.format()} 
            className="border-r relative cursor-pointer" 
            onClick={() => handleDayClick(day)}
          >
            {/* Hour blocks for interaction */}
            {hours.map(hour => (
              <div 
                key={hour} 
                className={`${isMobile ? 'h-10' : 'h-12'} border-b hover:bg-gray-50 relative`} 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent day click
                  handleTimeSlotClick(day, hour);
                }}
              >
                {/* Half-hour guide */}
                <div className="absolute left-0 right-0 top-1/2 border-t border-gray-100"></div>
              </div>
            ))}

            {/* Current time indicator */}
            {day.isSame(dayjs(), "day") && (
              <div 
                className="absolute left-0 right-0 border-t border-red-500 z-20" 
                style={{ 
                  top: `${(dayjs().hour() * (isMobile ? 40 : 48)) + (dayjs().minute() * (isMobile ? 0.67 : 0.8))}px`,
                }}
              >
                <div className="absolute -left-1 -top-[5px] w-2.5 h-2.5 rounded-full bg-red-500"></div>
              </div>
            )}

            {/* Events - optimized for mobile */}
            {events
              .filter(event => event.date === day.format("YYYY-MM-DD") && event.time)
              .map((event, idx) => {
                // Time calculation
                const [eventHour, eventMinute] = event.time.split(":").map(Number);
                const durationMatch = event.duration.match(/(\d+)([hm])/g);
                let durationHours = 1; // Default to 1 hour
                
                if (durationMatch) {
                  durationHours = durationMatch.reduce((total, part) => {
                    const [value, unit] = [parseInt(part), part.slice(-1)];
                    return total + (unit === 'h' ? value : value / 60);
                  }, 0);
                }
                
                // Calculate event position
                const topPosition = eventHour * (isMobile ? 40 : 48) + eventMinute * (isMobile ? 0.67 : 0.8);
                const height = Math.max(durationHours * (isMobile ? 40 : 48), isMobile ? 30 : 40); // Min height
                
                // Check for conflicts
                const conflicts = detectEventConflicts(events).find(e => e.id === event.id);
                const hasConflicts = conflicts && conflicts.conflictCount > 0;
                
                // Handle overlapping events
                const overlappingEvents = events.filter(e => {
                  if (e.id === event.id || e.date !== day.format("YYYY-MM-DD") || !e.time) return false;
                  
                  const [eHour, eMinute] = e.time.split(':').map(Number);
                  const eDurationMatch = e.duration.match(/(\d+)([hm])/g);
                  let eDurationHours = 1;
                  
                  if (eDurationMatch) {
                    eDurationHours = eDurationMatch.reduce((total, part) => {
                      const [value, unit] = [parseInt(part), part.slice(-1)];
                      return total + (unit === 'h' ? value : value / 60);
                    }, 0);
                  }
                  
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
                  : 'calc(100% - 4px)';
                const left = totalOverlapping > 1 
                  ? `calc(${(overlapIndex * 100) / totalOverlapping}% + 2px)` 
                  : '2px';
                
                return (
                  <div 
                    key={idx}
                    className={`absolute rounded overflow-hidden shadow-md group z-10
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
                      e.stopPropagation(); // Prevent day click
                      handleEventClick(e, event, conflicts);
                    }}
                    onMouseEnter={(e) => handleEventMouseEnter(e, event)}
                    onMouseLeave={handleEventMouseLeave}
                  >
                    <div className={`${isMobile ? 'p-1' : 'p-2'} h-full flex flex-col`}>
                      <div className={`font-medium ${isMobile ? 'text-[10px]' : 'text-xs'} truncate`}>{event.title}</div>
                      {!isMobile || height > 30 ? (
                        <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} opacity-90`}>
                          {eventHour % 12 || 12}:{eventMinute.toString().padStart(2, '0')} {eventHour >= 12 ? 'p' : 'a'}
                        </div>
                      ) : null}
                      
                      {/* Description - Only on desktop or tall events */}
                      {height > 60 && event.description && !isMobile && (
                        <div className="text-xs mt-1 line-clamp-2 opacity-90">{event.description}</div>
                      )}
                      
                      {/* Action buttons - Only shown on desktop */}
                      {!isMobile && (
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
                      )}
                    </div>
                  </div>
                );
              })}
              
            {/* All-day events at the top */}
            <div className="absolute top-0 left-0 right-0 z-10">
              {events
                .filter(event => event.date === day.format("YYYY-MM-DD") && !event.time)
                .map((event, idx) => (
                  <div 
                    key={idx}
                    className={`${isMobile ? 'text-[10px] p-0.5 m-0.5' : 'text-xs p-1 m-1'} rounded truncate bg-opacity-90 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                    style={{ 
                      backgroundColor: event.completed ? `${event.color}99` : event.color || "#4285F4",
                      color: "white",
                      textDecoration: event.completed ? 'line-through' : 'none',
                      backgroundImage: event.completed ? 'linear-gradient(rgba(255,255,255,0.2), rgba(255,255,255,0.2))' : 'none',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                      setShowEventPopup(true);
                    }}
                    onMouseEnter={(e) => handleEventMouseEnter(e, event)}
                    onMouseLeave={handleEventMouseLeave}
                  >
                    {event.title}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekView;