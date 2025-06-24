import React, { useRef, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { FaCheck, FaTrash } from "react-icons/fa";

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
  handleNext
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
      handleNext(); // Scroll to next week
    }
    if (isRightSwipe) {
      handlePrev(); // Scroll to previous week
    }
  };

  // Generate the days for the current week
  for (let i = 0; i < 7; i++) {
    weekDays.push(startOfWeek.add(i, "day"));
  }
  
  // Add fade animation when transitioning between weeks
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

  // Single letter day names with tooltip for full name
  const getDayLetter = (day) => {
    return day.format("ddd").charAt(0);
  };

  // Handle day click differently based on mobile/desktop
  const handleDayHeaderClick = (day) => {
    if (!isMobile) {
      // Only open modal on desktop
      handleOpenModal(day);
    }
    // On mobile, we don't open the modal
  };

  // Handle hour cell click differently based on mobile/desktop
  const handleHourCellClick = (day, hour) => {
    if (!isMobile) {
      // Only open modal on desktop
      handleOpenModal(day.hour(hour));
    }
    // On mobile, we don't open the modal
  };

  return (
    <div 
      className="overflow-auto max-h-[800px] touch-pan-y"
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Week header with days - optimize for mobile */}
      <div className="grid grid-cols-8 border-b">
        <div className="p-2 border-r"></div>
        {weekDays.map(day => {
          const isToday = day.isSame(dayjs(), "day");
          return (
            <div 
              key={day.format()} 
              className={`p-2 text-center border-r ${isToday ? "bg-blue-50" : ""}`}
              onClick={() => handleDayHeaderClick(day)}
            >
              {/* Single letter day name on mobile, short name on desktop */}
              <div className="font-medium" title={day.format("dddd")}>
                {isMobile ? getDayLetter(day) : day.format("ddd")}
              </div>
              <div 
                className={`${isMobile ? "text-lg" : "text-xl"} ${
                  isToday 
                    ? "bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto" 
                    : ""
                }`}
              >
                {day.date()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-8">
        {/* Time column */}
        <div className="border-r">
          {hours.map(hour => (
            <div key={hour} className="h-12 border-b text-xs text-right pr-2 -mt-3 text-gray-500">
              {hour === 0 ? "" : `${hour % 12 || 12} ${hour < 12 ? "am" : "pm"}`}
            </div>
          ))}
        </div>

        {/* Days columns */}
        {weekDays.map(day => (
          <div key={day.format()} className="border-r relative">
            {/* Hour blocks for interaction */}
            {hours.map(hour => (
              <div 
                key={hour} 
                className="h-12 border-b hover:bg-gray-50 relative cursor-pointer" 
                onClick={() => handleHourCellClick(day, hour)}
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
                  top: `${dayjs().hour() * 48 + dayjs().minute() * 0.8}px`,
                }}
              >
                <div className="absolute -left-1 -top-[5px] w-2.5 h-2.5 rounded-full bg-red-500"></div>
              </div>
            )}

            {/* Events */}
            {events
              .filter(event => event.date === day.format("YYYY-MM-DD") && event.time)
              .map((event, idx) => {
                // Parse time and calculate position
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
                const overlappingEvents = events.filter(e => {
                  if (e.id === event.id || e.date !== day.format("YYYY-MM-DD") || !e.time) return false;
                  
                  const [eHour, eMinute] = e.time.split(':').map(Number);
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
                
                // Adjust width for mobile to ensure events are visible
                const mobileWidthAdjustment = isMobile ? "- 2px" : "- 4px";
                
                const width = totalOverlapping > 1 
                  ? `calc(${100 / totalOverlapping}% ${mobileWidthAdjustment})` 
                  : `calc(100% ${mobileWidthAdjustment})`;
                const left = totalOverlapping > 1 
                  ? `calc(${(overlapIndex * 100) / totalOverlapping}% + 2px)` 
                  : '2px';
                
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
                    onMouseEnter={(e) => {
                      if (!isMobile) {
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
                      }
                    }}
                    onMouseLeave={() => {
                      if (!isMobile) {
                        setTooltip({
                          visible: false,
                          event: null,
                          position: { x: 0, y: 0 }
                        });
                      }
                    }}
                  >
                    <div className="p-2 h-full flex flex-col">
                      <div className="font-medium text-xs truncate">{event.title}</div>
                      <div className="text-xs opacity-90">
                        {eventHour % 12 || 12}:{eventMinute.toString().padStart(2, '0')} {eventHour >= 12 ? 'pm' : 'am'}
                      </div>
                      {height > 60 && event.description && !isMobile && (
                        <div className="text-xs mt-1 line-clamp-2 opacity-90">{event.description}</div>
                      )}
                      
                      {/* Action buttons that appear on hover - simplified for mobile */}
                      <div className={`absolute right-1 top-1 ${isMobile ? 'flex' : 'hidden group-hover:flex'} space-x-1 bg-black bg-opacity-30 backdrop-blur-sm rounded-full p-0.5`}>
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
              
            {/* All-day events at the top */}
            <div className="absolute top-0 left-0 right-0 z-10">
              {events
                .filter(event => event.date === day.format("YYYY-MM-DD") && !event.time)
                .map((event, idx) => (
                  <div 
                    key={idx}
                    className="text-xs p-1 m-1 rounded truncate bg-opacity-90 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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