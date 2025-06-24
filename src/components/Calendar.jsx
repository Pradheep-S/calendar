import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { FaChevronLeft, FaChevronRight, FaPlus, FaCheck, FaTrash } from "react-icons/fa";
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";

// Add required dayjs plugins
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const views = ["Month", "Week", "Day", "Agenda"];

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [events, setEvents] = useState([]);
  const [activeView, setActiveView] = useState("Month");
  const [showEventModal, setShowEventModal] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: currentDate.format("YYYY-MM-DD"),
    time: "09:00",
    duration: "1h",
    description: "",
    color: "#4285F4", // Google blue
    completed: false,
  });

  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require the mouse to move by 10 pixels before activating
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      // Press delay of 250ms, with tolerance of 5px of movement
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  useEffect(() => {
    fetch("/events.json")
      .then(res => res.json())
      .then(data => {
        // Add completed property if it doesn't exist
        const eventsWithCompleted = data.map(event => ({
          ...event,
          id: event.id || Date.now() + Math.random(),
          completed: event.completed || false
        }));
        setEvents(eventsWithCompleted);
      });
  }, []);

  // Get the time portion for rendering events
  const getEventTime = (event) => {
    if (!event.time) return "";
    const [hours, minutes] = event.time.split(":");
    const ampm = hours >= 12 ? "pm" : "am";
    const hour = hours % 12 || 12;
    return `${hour}:${minutes} ${ampm}`;
  };

  // Handlers for navigation
  const handlePrev = () => {
    if (activeView === "Month") {
      setCurrentDate(prev => prev.subtract(1, "month"));
    } else if (activeView === "Week") {
      setCurrentDate(prev => prev.subtract(1, "week"));
    } else if (activeView === "Day") {
      setCurrentDate(prev => prev.subtract(1, "day"));
    }
  };

  const handleNext = () => {
    if (activeView === "Month") {
      setCurrentDate(prev => prev.add(1, "month"));
    } else if (activeView === "Week") {
      setCurrentDate(prev => prev.add(1, "week"));
    } else if (activeView === "Day") {
      setCurrentDate(prev => prev.add(1, "day"));
    }
  };

  const handleToday = () => setCurrentDate(dayjs());

  // Modal handlers
  const handleOpenModal = (date) => {
    setNewEvent({
      ...newEvent,
      date: date.format("YYYY-MM-DD")
    });
    setShowEventModal(true);
  };

  const handleCloseModal = () => {
    setShowEventModal(false);
  };

  const handleCreateEvent = () => {
    const createdEvent = {
      ...newEvent,
      id: Date.now() // Simple ID generation
    };
    setEvents([...events, createdEvent]);
    setShowEventModal(false);
    setNewEvent({
      title: "",
      date: currentDate.format("YYYY-MM-DD"),
      time: "09:00",
      duration: "1h",
      description: "",
      color: "#4285F4",
      completed: false
    });
  };

  // Toggle completion status of an event
  const toggleEventCompletion = (eventId) => {
    setEvents(events.map(event => 
      event.id === eventId 
        ? { ...event, completed: !event.completed } 
        : event
    ));
  };

  // Delete an event
  const deleteEvent = (eventId) => {
    setEvents(events.filter(event => event.id !== eventId));
  };

  // Handle drag start
  const handleDragStart = (event) => {
    const { active } = event;
    setDraggedEvent(events.find(e => e.id.toString() === active.id));
  };

  // Handle drag end - UPDATED CODE
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Update the event's date
      setEvents(prevEvents => 
        prevEvents.map(e => {
          if (e.id.toString() === active.id) {
            return { ...e, date: over.id };
          }
          return e;
        })
      );
    }
    
    setDraggedEvent(null);
  };

  // Calendar generation based on view
  const generateMonthView = () => {
    const startDay = currentDate.startOf("month").startOf("week");
    const endDay = currentDate.endOf("month").endOf("week");

    const days = [];
    let day = startDay;

    while (day.isSameOrBefore(endDay, "day")) {
      days.push(day);
      day = day.add(1, "day");
    }

    return (
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="font-medium text-center text-gray-500 text-sm py-2 border-b">
              {day}
            </div>
          ))}

          {days.map(date => {
            const dateStr = date.format("YYYY-MM-DD");
            const dayEvents = events.filter(e => e.date === dateStr);
            const isToday = date.isSame(dayjs(), "day");
            const isCurrentMonth = date.month() === currentDate.month();

            return (
              <div 
                key={dateStr} 
                id={dateStr}
                className={`min-h-[100px] p-1 border relative transition-all hover:bg-gray-50 
                  ${isToday ? "bg-blue-50 border-blue-300" : ""} 
                  ${!isCurrentMonth ? "text-gray-400 bg-gray-50" : ""}`}
                onClick={() => handleOpenModal(date)}
              >
                <div className={`text-sm font-semibold text-right p-1 ${isToday ? "text-blue-600" : ""}`}>
                  {date.date()}
                </div>
                <div className="overflow-y-auto max-h-[80px]">
                  {(() => {
                    const styles = getMonthEventStyles(dayEvents);
                    return (
                      <>
                        {dayEvents.slice(0, styles.maxToShow).map((event) => (
                          <DraggableEvent 
                            key={event.id}
                            event={event}
                            getEventTime={getEventTime}
                            toggleEventCompletion={toggleEventCompletion}
                            deleteEvent={deleteEvent}
                          />
                        ))}
                        {styles.hasMore && (
                          <div 
                            className="text-xs p-1 text-gray-600 cursor-pointer hover:bg-gray-100 rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Show all events for this day
                              alert(`${styles.moreCount} more events on ${date.format("MMMM D, YYYY")}`);
                            }}
                          >
                            + {styles.moreCount} more
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                {/* Visual indicator when dragging over */}
                {draggedEvent && (
                  <div className="absolute inset-0 border-2 border-dashed border-blue-400 bg-blue-50 bg-opacity-40 pointer-events-none rounded-sm"></div>
                )}
              </div>
            );
          })}
        </div>
      </DndContext>
    );
  };

  const DraggableEvent = ({ event, getEventTime, toggleEventCompletion, deleteEvent }) => {
    return (
      <div 
        id={event.id.toString()}
        draggable
        className={`text-xs p-1 mb-1 rounded truncate flex items-center group relative cursor-move
          ${event.completed ? 'opacity-70 border border-white' : ''}
        `}
        style={{ 
          backgroundColor: event.completed ? `${event.color}99` : event.color || "#4285F4",
          color: "white",
          textDecoration: event.completed ? 'line-through' : 'none',
          backgroundImage: event.completed ? 'linear-gradient(rgba(255,255,255,0.2), rgba(255,255,255,0.2))' : 'none'
        }}
        onClick={(e) => {
          e.stopPropagation();
          // Show event details
        }}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${event.completed ? 'bg-gray-300' : 'bg-white'} mr-1 flex-shrink-0`}></div>
        <div className="truncate">
          {getEventTime(event)} {event.title}
        </div>
        
        {/* Action buttons that appear on hover */}
        <div className="absolute right-1 hidden group-hover:flex space-x-1 bg-opacity-80 rounded">
          <button 
            className={`p-0.5 text-white ${event.completed ? 'hover:text-green-200' : 'hover:text-green-300'}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleEventCompletion(event.id);
            }}
            title={event.completed ? "Mark as not completed" : "Mark as completed"}
          >
            <FaCheck size={10} />
          </button>
          <button 
            className="p-0.5 text-white hover:text-red-300"
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
    );
  };

  const getMonthEventStyles = (dayEvents) => {
    // Return styles for events based on count
    if (dayEvents.length > 3) {
      return {
        maxToShow: 2,
        hasMore: true,
        moreCount: dayEvents.length - 2
      };
    }
    return {
      maxToShow: dayEvents.length,
      hasMore: false,
      moreCount: 0
    };
  };

  const generateWeekView = () => {
    const startOfWeek = currentDate.startOf("week");
    const weekDays = [];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    for (let i = 0; i < 7; i++) {
      weekDays.push(startOfWeek.add(i, "day"));
    }

    return (
      <div className="overflow-auto max-h-[800px]">
        <div className="grid grid-cols-8 border-b">
          <div className="p-2 border-r"></div>
          {weekDays.map(day => {
            const isToday = day.isSame(dayjs(), "day");
            return (
              <div 
                key={day.format()} 
                className={`p-2 text-center border-r ${isToday ? "bg-blue-50" : ""}`}
              >
                <div className="font-medium">{day.format("ddd")}</div>
                <div className={`text-xl ${isToday ? "bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto" : ""}`}>
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
              <div key={hour} className="h-12 border-b text-xs text-right pr-2 -mt-3">
                {hour === 0 ? "" : `${hour % 12 || 12} ${hour < 12 ? "am" : "pm"}`}
              </div>
            ))}
          </div>

          {/* Days columns */}
          {weekDays.map(day => (
            <div key={day.format()} className="border-r relative">
              {hours.map(hour => (
                <div key={hour} className="h-12 border-b" onClick={() => handleOpenModal(day.hour(hour))}>
                </div>
              ))}

              {/* Events */}
              {events
                .filter(event => event.date === day.format("YYYY-MM-DD"))
                .map((event, idx) => {
                  const [eventHour, eventMinute] = event.time ? event.time.split(":").map(Number) : [0, 0];
                  const durationMatch = event.duration ? event.duration.match(/(\d+)([hm])/) : null;
                  const durationHours = durationMatch ? 
                    (durationMatch[2] === 'h' ? Number(durationMatch[1]) : Number(durationMatch[1]) / 60) : 1;
                  
                  // Check for conflicts
                  const conflicts = handleEventConflicts(events, day).find(e => e.id === event.id);
                  const hasConflicts = conflicts && conflicts.conflictCount > 0;
                  
                  return (
                    <div 
                      key={idx}
                      className={`absolute rounded px-2 overflow-hidden text-white text-xs ${hasConflicts ? 'border-2 border-yellow-300' : ''} 
                        ${event.completed ? 'border border-white/30' : ''}
                      `}
                      style={{
                        top: `${eventHour * 48 + eventMinute * 0.8}px`,
                        height: `${durationHours * 48}px`,
                        left: "2px",
                        right: "2px",
                        backgroundColor: event.completed ? `${event.color}99` : event.color || "#4285F4",
                        backgroundImage: event.completed ? 'linear-gradient(rgba(255,255,255,0.2), rgba(255,255,255,0.2))' : 'none',
                        zIndex: 10,
                        textDecoration: event.completed ? 'line-through' : 'none'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasConflicts) {
                          alert(`Warning: This event overlaps with ${conflicts.conflictCount} other event(s)`);
                        }
                      }}
                    >
                      <div className="font-medium flex justify-between">
                        <span>{event.title}</span>
                        {hasConflicts && <span className="text-yellow-300">⚠️</span>}
                      </div>
                      <div>{getEventTime(event)}</div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleEventConflicts = (events, date) => {
    // Group events by time slots to identify conflicts
    const timeSlotMap = {};
    
    events.forEach(event => {
      if (event.date !== date.format("YYYY-MM-DD") || !event.time) return;
      
      const [hours, minutes] = event.time.split(':').map(Number);
      const durationMatch = event.duration.match(/(\d+)([hm])/);
      const durationHours = durationMatch ? 
        (durationMatch[2] === 'h' ? Number(durationMatch[1]) : Number(durationMatch[1])/60) : 1;
      
      // Calculate start and end times in decimal hours
      const startTime = hours + (minutes / 60);
      const endTime = startTime + durationHours;
      
      // Create 15-minute time slots for this event
      for (let t = startTime; t < endTime; t += 0.25) {
        const timeSlot = t.toFixed(2);
        if (!timeSlotMap[timeSlot]) {
          timeSlotMap[timeSlot] = [];
        }
        timeSlotMap[timeSlot].push(event);
      }
    });
    
    // Analyze conflicts
    const conflictGroups = {};
    Object.values(timeSlotMap).forEach(eventsInSlot => {
      if (eventsInSlot.length > 1) {
        // We have a conflict
        eventsInSlot.forEach(event => {
          if (!conflictGroups[event.id]) {
            conflictGroups[event.id] = {
              event,
              conflicts: new Set()
            };
          }
          
          // Add all other events in this slot as conflicts
          eventsInSlot.forEach(otherEvent => {
            if (otherEvent.id !== event.id) {
              conflictGroups[event.id].conflicts.add(otherEvent.id);
            }
          });
        });
      }
    });
    
    // Convert to array and add conflict count
    return Object.values(conflictGroups).map(group => ({
      ...group.event,
      conflictCount: group.conflicts.size,
      conflictIds: Array.from(group.conflicts)
    }));
  };

  const generateDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const todayEvents = events.filter(event => event.date === currentDate.format("YYYY-MM-DD"));
    
    return (
      <div className="overflow-auto max-h-[800px]">
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
                      className="text-xs p-2 mb-1 rounded truncate" 
                      style={{ 
                        backgroundColor: event.color || "#4285F4",
                        color: "white"
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
                className="h-12 border-b hover:bg-gray-50 relative" 
                onClick={() => handleOpenModal(currentDate.hour(hour))}
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
                      // Here you could add code to open event editing modal
                    }}
                  >
                    <div className="p-2 h-full flex flex-col">
                      <div className="font-medium text-xs truncate">{event.title}</div>
                      <div className="text-xs opacity-90">{getEventTime(event)}</div>
                      {height > 60 && event.description && (
                        <div className="text-xs mt-1 line-clamp-2 opacity-90">{event.description}</div>
                      )}
                      
                      {/* Action buttons that appear on hover */}
                      <div className="absolute right-1 top-1 hidden group-hover:flex space-x-1 bg-opacity-80 rounded">
                        <button 
                          className={`p-0.5 text-white ${event.completed ? 'hover:text-green-200' : 'hover:text-green-300'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEventCompletion(event.id);
                          }}
                          title={event.completed ? "Mark as not completed" : "Mark as completed"}
                        >
                          <FaCheck size={10} />
                        </button>
                        <button 
                          className="p-0.5 text-white hover:text-red-300"
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

  const generateAgendaView = () => {
    // Group events by date
    const eventsByDate = events.reduce((acc, event) => {
      if (!acc[event.date]) {
        acc[event.date] = [];
      }
      acc[event.date].push(event);
      return acc;
    }, {});

    // Sort dates
    const sortedDates = Object.keys(eventsByDate).sort();

    return (
      <div className="overflow-auto max-h-[800px]">
        {sortedDates.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No events scheduled
          </div>
        ) : (
          sortedDates.map(date => {
            const formattedDate = dayjs(date).format("dddd, MMMM D, YYYY");
            const isToday = dayjs(date).isSame(dayjs(), "day");
            
            return (
              <div key={date} className="mb-4">
                <div className={`font-medium py-2 px-4 ${isToday ? "bg-blue-50" : "bg-gray-50"}`}>
                  {formattedDate} {isToday && <span className="text-blue-600 font-bold">(Today)</span>}
                </div>
                <div>
                  {eventsByDate[date].map((event, idx) => (
                    <div key={idx} className={`flex items-center p-3 border-b hover:bg-gray-50 group
                      ${event.completed ? 'bg-gray-50' : ''}
                    `}>
                      <div 
                        className="w-3 h-12 mr-3 rounded-full" 
                        style={{ 
                          backgroundColor: event.completed ? `${event.color}99` : event.color || "#4285F4"
                        }}
                      ></div>
                      <div className="flex-1">
                        <div className={`font-medium ${event.completed ? 'line-through text-gray-500' : ''}`}>{event.title}</div>
                        <div className={`text-sm text-gray-600 ${event.completed ? 'line-through' : ''}`}>
                          {getEventTime(event)} {event.duration && `• ${event.duration}`}
                        </div>
                        {event.description && (
                          <div className={`text-sm mt-1 ${event.completed ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                            {event.description}
                          </div>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="hidden group-hover:flex items-center space-x-2">
                        <button 
                          className={`p-1 rounded-full hover:bg-gray-100
                            ${event.completed ? 'text-green-600' : 'text-gray-500 hover:text-green-600'}
                          `}
                          onClick={() => toggleEventCompletion(event.id)}
                          title={event.completed ? "Mark as not completed" : "Mark as completed"}
                        >
                          <FaCheck size={14} />
                        </button>
                        <button 
                          className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this event?')) {
                              deleteEvent(event.id);
                            }
                          }}
                          title="Delete event"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  // Render appropriate view
  const renderCalendarView = () => {
    switch (activeView) {
      case "Week":
        return generateWeekView();
      case "Day":
        return generateDayView();
      case "Agenda":
        return generateAgendaView();
      case "Month":
      default:
        return generateMonthView();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {/* Left side with brand and navigation */}
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-red-500">Calendar</h2>
          
          <button onClick={handleToday} className="px-4 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100">
            Today
          </button>
          
          <div className="flex items-center">
            <button onClick={handlePrev} className="p-2 rounded-full hover:bg-gray-100">
              <FaChevronLeft className="text-gray-600" />
            </button>
            <button onClick={handleNext} className="p-2 rounded-full hover:bg-gray-100">
              <FaChevronRight className="text-gray-600" />
            </button>
          </div>
          
          <h3 className="text-xl font-semibold">
            {activeView === "Day" 
              ? currentDate.format("MMMM D, YYYY")
              : activeView === "Week" 
                ? `${currentDate.startOf("week").format("MMM D")} - ${currentDate.endOf("week").format("MMM D, YYYY")}`
                : currentDate.format("MMMM YYYY")
            }
          </h3>
        </div>
        
        {/* Right side with view options */}
        <div className="flex items-center space-x-2">
          <div className="flex rounded-md border overflow-hidden">
            {views.map(view => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-4 py-1 text-sm transition ${
                  activeView === view
                    ? "bg-blue-100 text-blue-800 font-medium"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                {view}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => handleOpenModal(currentDate)}
            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md"
          >
            <FaPlus size={12} />
            <span>Create</span>
          </button>
        </div>
      </div>

      {/* Calendar view */}
      <div className="p-1">
        {renderCalendarView()}
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add Event</h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                &times;
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="Event title"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <input
                    type="time"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration</label>
                <select
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={newEvent.duration}
                  onChange={(e) => setNewEvent({...newEvent, duration: e.target.value})}
                >
                  <option value="30m">30 minutes</option>
                  <option value="1h">1 hour</option>
                  <option value="1h30m">1 hour 30 minutes</option>
                  <option value="2h">2 hours</option>
                  <option value="3h">3 hours</option>
                  <option value="4h">4 hours</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Color</label>
                <div className="flex space-x-2 mt-1">
                  {["#4285F4", "#EA4335", "#FBBC05", "#34A853", "#8430CE", "#F06292"].map(color => (
                    <div 
                      key={color}
                      className={`w-8 h-8 rounded-full cursor-pointer ${newEvent.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewEvent({...newEvent, color})}
                    ></div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
                <textarea
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  rows="3"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  placeholder="Add description or notes"
                ></textarea>
              </div>

              {/* New completed checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="completed"
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  checked={newEvent.completed}
                  onChange={(e) => setNewEvent({...newEvent, completed: e.target.checked})}
                />
                <label htmlFor="completed" className="ml-2 block text-sm text-gray-700">
                  Mark as completed
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={!newEvent.title.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
