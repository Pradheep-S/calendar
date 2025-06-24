import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { FaChevronLeft, FaChevronRight, FaPlus, FaCheck, FaTrash, FaEdit } from "react-icons/fa";
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSSTransition, SwitchTransition } from 'react-transition-group';

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
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [conflictInfo, setConflictInfo] = useState(null);
  const [tooltip, setTooltip] = useState({
    visible: false,
    event: null,
    position: { x: 0, y: 0 }
  });
  const [showEventPopup, setShowEventPopup] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [isEditing, setIsEditing] = useState(false); // Editing state
  const [editedEvent, setEditedEvent] = useState(null); // Edited event state

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
    setIsLoading(true);
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
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error fetching events:", error);
        setIsLoading(false);
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

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Get the event from the dragged element
      const draggedEventId = active.id;
      const targetDate = over.id; // This should be a date string in format "YYYY-MM-DD"
      
      // Update the event's date
      setEvents(prevEvents => 
        prevEvents.map(eventItem => {
          if (eventItem.id.toString() === draggedEventId) {
            return { ...eventItem, date: targetDate };
          }
          return eventItem;
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
        <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
          <div className="grid grid-cols-7 bg-gradient-to-r from-blue-50 to-indigo-50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="font-medium text-center text-gray-600 text-sm py-3 border-b">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 bg-white">
            {days.map(date => {
              const dateStr = date.format("YYYY-MM-DD");
              const dayEvents = events.filter(e => e.date === dateStr);
              const isToday = date.isSame(dayjs(), "day");
              const isCurrentMonth = date.month() === currentDate.month();
              const styles = getMonthEventStyles(dayEvents);

              return (
                <DroppableDay 
                  key={dateStr}
                  dateStr={dateStr}
                  isToday={isToday}
                  isCurrentMonth={isCurrentMonth}
                  onOpenModal={handleOpenModal}
                >
                  <div className={`text-sm font-medium text-right p-1 ${isToday ? "text-blue-600" : ""}`}>
                    {date.date()}
                  </div>
                  <div className="overflow-y-auto max-h-[85px] space-y-1">
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
                        className="text-xs p-1.5 text-gray-600 cursor-pointer hover:bg-gray-100 rounded-md transition-colors duration-200 text-center font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Show all events for this day
                          alert(`${styles.moreCount} more events on ${date.format("MMMM D, YYYY")}`);
                        }}
                      >
                        + {styles.moreCount} more
                      </div>
                    )}
                  </div>
                </DroppableDay>
              );
            })}
          </div>
        </div>
        
        <DragOverlay>
          {draggedEvent ? (
            <div 
              className="text-xs p-2 mb-1 rounded-md truncate flex items-center shadow-xl animate-pulse"
              style={{ 
                backgroundColor: draggedEvent.color || "#4285F4",
                color: "white",
                width: "150px",
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white mr-1 flex-shrink-0"></div>
              <div className="truncate">
                {getEventTime(draggedEvent)} {draggedEvent.title}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  };

  const DraggableEvent = ({ event, getEventTime, toggleEventCompletion, deleteEvent }) => {
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
          ${isDragging ? 'scale-105' : 'hover:scale-[1.02]'}
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
        
        {!isDragging && (
          <div className="absolute right-1 opacity-0 group-hover:opacity-100 flex space-x-1.5 bg-black/20 rounded-md p-0.5 transition-opacity duration-200">
            <button 
              className={`p-0.5 text-white hover:text-green-200 transition-colors duration-200`}
              onClick={(e) => {
                e.stopPropagation();
                toggleEventCompletion(event.id);
              }}
              title={event.completed ? "Mark as not completed" : "Mark as completed"}
            >
              <FaCheck size={10} />
            </button>
            <button 
              className="p-0.5 text-white hover:text-red-200 transition-colors duration-200"
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
    );
  };

  const DroppableDay = ({ dateStr, children, isToday, isCurrentMonth, onOpenModal }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: dateStr
    });

    return (
      <div 
        ref={setNodeRef}
        className={`min-h-[100px] p-1 border relative transition-all hover:bg-gray-50 
          ${isToday ? "bg-blue-50 border-blue-300" : ""} 
          ${!isCurrentMonth ? "text-gray-400 bg-gray-50" : ""}
          ${isOver ? "bg-blue-50 border-blue-300" : ""}`}
        onClick={() => onOpenModal(dayjs(dateStr))}
      >
        {children}
        {isOver && (
          <div className="absolute inset-0 border-2 border-dashed border-blue-400 bg-blue-50 bg-opacity-40 pointer-events-none rounded-sm"></div>
        )}
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

  // Enhanced conflict detection function that can be used across all views
  const detectEventConflicts = (events) => {
    const conflictMap = new Map();
    
    // First pass: identify all events
    events.forEach(event => {
      if (!event.time) return; // Skip all-day events
      
      const eventId = event.id.toString();
      const [hours, minutes] = event.time.split(':').map(Number);
      const durationMatch = event.duration?.match(/(\d+)([hm])/);
      const durationHours = durationMatch ? 
        (durationMatch[2] === 'h' ? Number(durationMatch[1]) : Number(durationMatch[1])/60) : 1;
      
      // Calculate start and end times in decimal hours
      const startTime = hours + (minutes / 60);
      const endTime = startTime + durationHours;
      
      if (!conflictMap.has(eventId)) {
        conflictMap.set(eventId, {
          event,
          startTime,
          endTime,
          conflicts: new Set()
        });
      }
    });
    
    // Second pass: detect conflicts
    const entries = Array.from(conflictMap.entries());
    for (let i = 0; i < entries.length; i++) {
      const [id1, data1] = entries[i];
      
      for (let j = i + 1; j < entries.length; j++) {
        const [id2, data2] = entries[j];
        
        // Check if events are on the same day
        if (data1.event.date !== data2.event.date) continue;
        
        // Check for time overlap
        if (
          (data1.startTime >= data2.startTime && data1.startTime < data2.endTime) ||
          (data1.endTime > data2.startTime && data1.endTime <= data2.endTime) ||
          (data1.startTime <= data2.startTime && data1.endTime >= data2.endTime)
        ) {
          // We have a conflict
          data1.conflicts.add(id2);
          data2.conflicts.add(id1);
        }
      }
    }
    
    // Convert to array with conflict count
    return Array.from(conflictMap.values())
      .filter(data => data.conflicts.size > 0)
      .map(data => ({
        ...data.event,
        conflictCount: data.conflicts.size,
        conflictIds: Array.from(data.conflicts)
      }));
  };

  // Also add this function if it's missing
  const showConflictDetails = (event, conflicts) => {
    // Find the conflicting events
    const conflictingEvents = events.filter(e => 
      conflicts.conflictIds.includes(e.id.toString())
    );
    
    setConflictInfo({
      event,
      conflictingEvents
    });
    
    setShowConflictWarning(true);
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
                      onMouseEnter={(e) => {
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
                      }}
                      onMouseLeave={() => {
                        setTooltip({
                          visible: false,
                          event: null,
                          position: { x: 0, y: 0 }
                        });
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
                      
                    }}
                    onMouseEnter={(e) => {
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
                    }}
                    onMouseLeave={() => {
                      setTooltip({
                        visible: false,
                        event: null,
                        position: { x: 0, y: 0 }
                      });
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
                  {dayEvents.map((event, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 hover:bg-gray-50 cursor-pointer flex items-start"
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowEventPopup(true);
                      }}
                    >
                      <div 
                        className="w-4 h-4 rounded-full mt-1 mr-3 flex-shrink-0" 
                        style={{ backgroundColor: event.color || "#4285F4" }}
                      ></div>
                      <div className="flex-grow">
                        <div className={`font-medium ${event.completed ? 'line-through text-gray-500' : ''}`}>
                          {event.title}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {event.time ? getEventTime(event) : 'All day'} 
                          {event.duration && event.time ? ` • ${event.duration}` : ''}
                        </div>
                        {event.description && (
                          <div className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 opacity-0 hover:opacity-100 transition-opacity">
                        <button 
                          className={`p-1.5 rounded-full ${event.completed ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEventCompletion(event.id);
                          }}
                          title={event.completed ? "Mark as not completed" : "Mark as completed"}
                        >
                          <FaCheck size={12} />
                        </button>
                        <button 
                          className="p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this event?')) {
                              deleteEvent(event.id);
                            }
                          }}
                          title="Delete event"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
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

  // Move the ref outside of renderCalendarView to the top level of your component
  const nodeRef = React.useRef(null);

  // Update your renderCalendarView function to use nodeRef instead of relying on findDOMNode
  const renderCalendarView = () => {
    // Remove this line:
    // const nodeRef = React.useRef(null);
    
    const currentView = (() => {
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
    })();

    return (
      <SwitchTransition mode="out-in">
        <CSSTransition
          key={activeView}
          nodeRef={nodeRef}
          timeout={300}
          classNames="fade"
          unmountOnExit
        >
          <div ref={nodeRef} className="transition-all duration-300 ease-in-out">
            {currentView}
          </div>
        </CSSTransition>
      </SwitchTransition>
    );
  };



  return (
    <div className="bg-white rounded-xl shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 max-w-full">
      {/* Responsive header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        {/* Left side with brand and navigation */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-3 sm:mb-0">
          <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Calendar</h2>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleToday} 
              className="px-3 py-1 text-xs sm:text-sm bg-white text-blue-700 rounded-md shadow-sm hover:shadow transition-all duration-200 border border-blue-100 hover:bg-blue-50"
            >
              Today
            </button>
            
            <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-100">
              <button 
                onClick={handlePrev} 
                className="p-1.5 sm:p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
                aria-label="Previous"
              >
                <FaChevronLeft className="text-gray-600" size={12} />
              </button>
              <button 
                onClick={handleNext} 
                className="p-1.5 sm:p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
                aria-label="Next"
              >
                <FaChevronRight className="text-gray-600" size={12} />
              </button>
            </div>
          </div>
          
          <h3 className="text-base sm:text-lg font-medium text-gray-800">
            {activeView === "Day" 
              ? currentDate.format("MMMM D, YYYY")
              : activeView === "Week" 
                ? `${currentDate.startOf("week").format("MMM D")} - ${currentDate.endOf("week").format("MMM D")}`
                : currentDate.format("MMMM YYYY")
            }
          </h3>
        </div>
        
        {/* Right side with view options */}
        <div className="flex items-center space-x-2">
          <div className="flex rounded-lg shadow-sm overflow-hidden bg-white border border-gray-100">
            {views.map(view => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm transition-all duration-200 ${
                  activeView === view
                    ? "bg-blue-600 text-white font-medium"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {view}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => handleOpenModal(currentDate)}
            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all duration-200"
          >
            <FaPlus size={12} />
            <span className="hidden sm:inline">Create</span>
          </button>
        </div>
      </div>

      {/* Calendar view */}
      <div className="p-2 bg-white overflow-x-auto">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-96 w-full">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            <span className="mt-4 text-gray-600 text-lg">Loading your calendar...</span>
          </div>
        ) : (
          <div className="transition-all duration-300 ease-in-out">
            {renderCalendarView()}
          </div>
        )}
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
          onClick={(e) => {
            // Close modal when clicking outside
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-semibold text-gray-800">Add Event</h3>
              <button 
                onClick={handleCloseModal} 
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-1 transition-colors duration-200"
              >
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

      {/* Conflict Warning Modal */}
      {showConflictWarning && conflictInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <span className="text-yellow-500 mr-2">⚠️</span>
                Time Conflict Detected
              </h3>
              <button onClick={() => setShowConflictWarning(false)} className="text-gray-500 hover:text-gray-700">
                &times;
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">
                  The event "<strong>{conflictInfo.event.title}</strong>" at {getEventTime(conflictInfo.event)} 
                  conflicts with {conflictInfo.conflictingEvents.length} other event(s):
                </p>
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                {conflictInfo.conflictingEvents.map(event => (
                  <div 
                    key={event.id}
                    className="flex items-center p-2 border-b"
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: event.color || "#4285F4" }}
                    ></div>
                    <div>
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-gray-600">
                        {dayjs(event.date).format("MMM D")} • {getEventTime(event)} ({event.duration})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-sm text-gray-600">
                You can:
                <ul className="list-disc ml-5 mt-1 space-y-1">
                  <li>Keep both events (they will display side by side)</li>
                  <li>Reschedule one of the events</li>
                  <li>Delete one of the events</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowConflictWarning(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Tooltip */}
      {tooltip.visible && tooltip.event && (
        <div 
          className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 w-64 animate-fadeIn"
          style={{ 
            left: `${tooltip.position.x}px`, 
            top: `${tooltip.position.y}px`,
            transform: 'translate(-50%, -100%)',
            marginTop: '-10px'
          }}
        >
          <div 
            className="w-full h-1.5 absolute top-0 left-0 rounded-t-lg"
            style={{ backgroundColor: tooltip.event.color || "#4285F4" }}
          ></div>
          <div className="mt-2.5">
            <h4 className="font-medium text-sm">{tooltip.event.title}</h4>
            <div className="text-xs text-gray-600 mt-1.5 flex items-center">
              <span className="mr-2">📅 {dayjs(tooltip.event.date).format("MMM D, YYYY")}</span>
              {tooltip.event.time && (
                <span>⏰ {getEventTime(tooltip.event)}</span>
              )}
            </div>
            {tooltip.event.description && (
              <div className="text-xs mt-2 text-gray-700 border-t pt-1.5">
                {tooltip.event.description}
              </div>
            )}
            {tooltip.event.completed && (
              <div className="text-xs mt-1.5 text-green-600 flex items-center">
                <FaCheck size={10} className="mr-1" /> Completed
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event Popup/Modal */}
      {showEventPopup && selectedEvent && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
          onClick={(e) => {
            // Close popup when clicking outside
            if (e.target === e.currentTarget) {
              setShowEventPopup(false);
              setIsEditing(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-lg w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-2" 
                  style={{ backgroundColor: selectedEvent.color || "#4285F4" }}
                ></div>
                {isEditing ? "Edit Event" : "Event Details"}
              </h3>
              <button onClick={() => {
                setShowEventPopup(false);
                setIsEditing(false);
              }} className="text-gray-500 hover:text-gray-700">
                &times;
              </button>
            </div>
            
            {!isEditing ? (
              // View mode
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <h2 className="text-xl font-semibold">{selectedEvent.title}</h2>
                  <div className="text-sm text-gray-600 mt-1 flex items-center space-x-3">
                    <span>📅 {dayjs(selectedEvent.date).format("MMMM D, YYYY")}</span>
                    {selectedEvent.time && (
                      <span>⏰ {getEventTime(selectedEvent)} ({selectedEvent.duration})</span>
                    )}
                  </div>
                </div>
                
                {selectedEvent.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                    <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                  </div>
                )}
                
                <div className="flex items-center pt-2">
                  <div 
                    className={`px-3 py-1 text-xs rounded-full mr-2 ${
                      selectedEvent.completed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {selectedEvent.completed ? '✓ Completed' : '⏳ Pending'}
                  </div>
                  
                  {/* Check for conflicts */}
                  {(() => {
                    const conflicts = detectEventConflicts(events).find(e => e.id === selectedEvent.id);
                    const hasConflicts = conflicts && conflicts.conflictCount > 0;
                    
                    return hasConflicts ? (
                      <div 
                        className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 cursor-pointer"
                        onClick={() => showConflictDetails(selectedEvent, conflicts)}
                      >
                        ⚠️ Time Conflict ({conflicts.conflictCount})
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            ) : (
              // Edit mode
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={editedEvent.title}
                    onChange={(e) => setEditedEvent({...editedEvent, title: e.target.value})}
                    placeholder="Event title"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      value={editedEvent.date}
                      onChange={(e) => setEditedEvent({...editedEvent, date: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time</label>
                    <input
                      type="time"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      value={editedEvent.time}
                      onChange={(e) => setEditedEvent({...editedEvent, time: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration</label>
                  <select
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={editedEvent.duration}
                    onChange={(e) => setEditedEvent({...editedEvent, duration: e.target.value})}
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
                        className={`w-8 h-8 rounded-full cursor-pointer ${editedEvent.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setEditedEvent({...editedEvent, color})}
                      ></div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
                  <textarea
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    rows="3"
                    value={editedEvent.description}
                    onChange={(e) => setEditedEvent({...editedEvent, description: e.target.value})}
                    placeholder="Add description or notes"
                  ></textarea>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit-completed"
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    checked={editedEvent.completed}
                    onChange={(e) => setEditedEvent({...editedEvent, completed: e.target.checked})}
                  />
                  <label htmlFor="edit-completed" className="ml-2 block text-sm text-gray-700">
                    Mark as completed
                  </label>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-between">
              {!isEditing ? (
                // View mode buttons
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      toggleEventCompletion(selectedEvent.id);
                      setSelectedEvent({
                        ...selectedEvent, 
                        completed: !selectedEvent.completed
                      });
                    }}
                    className={`px-3 py-1 border rounded-md text-sm flex items-center ${
                      selectedEvent.completed 
                        ? 'border-orange-300 text-orange-600 hover:bg-orange-50' 
                        : 'border-green-300 text-green-600 hover:bg-green-50'
                    }`}
                  >
                    <FaCheck className="mr-1" size={12} />
                    {selectedEvent.completed ? 'Mark Incomplete' : 'Mark Complete'}
                  </button>
                  
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this event?')) {
                        deleteEvent(selectedEvent.id);
                        setShowEventPopup(false);
                      }
                    }}
                    className="px-3 py-1 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-all duration-200 flex items-center"
                  >
                    <FaTrash className="mr-1" size={12} />
                    Delete Event
                  </button>
                </div>
              ) : (
                // Edit mode buttons
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
              
              {!isEditing ? (
                // Edit button in view mode
                <button
                  onClick={() => {
                    setEditedEvent({...selectedEvent});
                    setIsEditing(true);
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 flex items-center"
                >
                  <FaEdit className="mr-1" size={12} />
                  Edit Event
                </button>
              ) : (
                // Save button in edit mode
                <button
                  onClick={() => {
                    // Update the event
                    setEvents(events.map(e => 
                      e.id === editedEvent.id ? editedEvent : e
                    ));
                    setSelectedEvent(editedEvent);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={!editedEvent.title.trim()}
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
