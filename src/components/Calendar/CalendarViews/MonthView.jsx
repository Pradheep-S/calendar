import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useDroppable } from "@dnd-kit/core";
import { getMonthEventStyles } from '../utils/dateUtils';
import { getEventTime } from '../utils/dateUtils';
import DraggableEvent from '../EventComponents/DraggableEvent';
import ShowAllEventsModal from '../Modals/ShowAllEventsModal';

// DroppableDay component
const DroppableDay = ({ dateStr, children, isToday, isCurrentMonth, onOpenModal, isMobile, dayEvents, setActiveView, handleOpenModal }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr
  });

  return (
    <div 
      ref={setNodeRef}
      className={`min-h-[80px] p-1 border relative transition-all hover:bg-gray-50 
        ${isToday ? "bg-blue-50 border-blue-300" : ""} 
        ${!isCurrentMonth ? "text-gray-400 bg-gray-50" : ""}
        ${isOver ? "bg-blue-50 border-blue-300" : ""}
        ${isMobile ? "min-h-[60px]" : ""}`}
      onClick={() => {
        if (isMobile) {
          // In mobile view, directly switch to day view without opening any modal
          setActiveView("Day");
          // We should also update the current date to the clicked date
          // This would usually be done in the parent component via props
          const dateObj = dayjs(dateStr);
          handleOpenModal(dateObj, true); // Pass true to skip modal
        } else {
          // Desktop behavior remains the same
          onOpenModal(dayjs(dateStr));
        }
      }}
    >
      {children}
      {isOver && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-400 bg-blue-50 bg-opacity-40 pointer-events-none rounded-sm"></div>
      )}
    </div>
  );
};

const MonthView = ({
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
  setDraggedEvent,
  draggedEvent,
  handleDragStart,
  handleDragEnd,
  setActiveView,
  handlePrev,
  handleNext
}) => {
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState(null);
  const containerRef = useRef(null);
  const wheelTimeoutRef = useRef(null);
  const isScrollingRef = useRef(false);
  const dayScrollingRef = useRef(false);
  
  // For swipe navigation
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Define sensors for DnD functionality
  const mouseSensor = useSensor(MouseSensor, {
    // Require the mouse to move by 10 pixels before activating
    activationConstraint: {
      distance: 10,
    },
  });
  
  const touchSensor = useSensor(TouchSensor, {
    // Press delay of 250ms, with tolerance of 5px of movement
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });
  
  // Initialize sensors array
  const sensors = useSensors(mouseSensor, touchSensor);

  // Check if the device is mobile based on window width
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
    setTouchStart(e.targetTouches[0].clientY); // Track Y position for vertical swipe
  };
  
  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY); // Track Y position for vertical swipe
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    // Skip if we're scrolling within a day cell with events
    if (dayScrollingRef.current) {
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;
    
    if (isUpSwipe) {
      // Swiping up - go to next month
      setTransitionDirection('up');
      handleNext();
    }
    if (isDownSwipe) {
      // Swiping down - go to previous month
      setTransitionDirection('down');
      handlePrev();
    }
  };

  // If handleDragStart wasn't passed, define a local one
  const onDragStart = handleDragStart || ((event) => {
    const { active } = event;
    setDraggedEvent(events.find(e => e.id.toString() === active.id));
  });

  const startDay = currentDate.startOf("month").startOf("week");
  const endDay = currentDate.endOf("month").endOf("week");

  const days = [];
  let day = startDay;

  while (day.isSameOrBefore(endDay, "day")) {
    days.push(day);
    day = day.add(1, "day");
  }
  
  // Function to switch to day view
  const handleSwitchToDay = (dateObj) => {
    if (dateObj) {
      // Switch to day view with the selected date
      handleOpenModal(dateObj, true); // Pass true to skip modal
      setActiveView("Day");
      setShowAllEvents(false);
    }
  };

  // Extended handleOpenModal that can switch to day view
  const handleDateClick = (date, switchToDay = false, skipModal = false) => {
    if (switchToDay) {
      // Update current date and switch to day view
      handleOpenModal(date, skipModal);
      setActiveView("Day");
    } else {
      // Regular behavior
      handleOpenModal(date, skipModal);
    }
  };

  // Handle wheel events for month navigation, but only if not scrolling within a day cell
  const handleWheel = (e) => {
    // Skip wheel handling if we're scrolling within a day cell with events
    if (dayScrollingRef.current) {
      return;
    }
    
    // Prevent if we're already processing a month navigation scroll
    if (isScrollingRef.current) return;
    
    // Set a threshold to prevent accidental scrolls
    const scrollThreshold = 50;
    
    if (Math.abs(e.deltaY) < scrollThreshold) return;
    
    // Set the flag to prevent multiple scroll events
    isScrollingRef.current = true;
    
    if (e.deltaY > 0) {
      // Scrolling down - go to next month
      setTransitionDirection('up');
      handleNext();
    } else {
      // Scrolling up - go to previous month
      setTransitionDirection('down');
      handlePrev();
    }
    
    // Reset the scrolling flag after a short delay
    clearTimeout(wheelTimeoutRef.current);
    wheelTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 500); // Adjust this timeout as needed
  };
  
  // Handle scrolling within a day cell
  const handleDayCellScroll = (e) => {
    // Prevent event bubbling to stop triggering month navigation
    e.stopPropagation();
    
    // Set the flag to indicate we're scrolling within a day cell
    dayScrollingRef.current = true;
    
    // Clear any existing timeout
    clearTimeout(wheelTimeoutRef.current);
    
    // Reset the flag after a delay to allow normal scrolling to resume
    wheelTimeoutRef.current = setTimeout(() => {
      dayScrollingRef.current = false;
    }, 300);
  };
  
  // Reset animation class after view changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setTransitionDirection(null);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [currentDate]);

  return (
    <>
      <div 
        className={`max-h-[calc(100vh-180px)] overflow-hidden month-view-container
          ${transitionDirection === 'up' ? 'animate-slideUpIn' : ''}
          ${transitionDirection === 'down' ? 'animate-slideDownIn' : ''}`}
        ref={containerRef}
        onWheel={handleWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ overscrollBehavior: 'none',overflow: 'hidden' }}
      >
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
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
                    onOpenModal={handleDateClick}
                    isMobile={isMobile}
                    dayEvents={dayEvents}
                    setActiveView={setActiveView}
                    handleOpenModal={handleOpenModal}
                  >
                    <div className={`text-sm font-medium text-right p-1 ${isToday ? "text-blue-600" : ""}`}>
                      {date.date()}
                    </div>
                    
                    {/* On mobile, just show event count */}
                    {isMobile ? (
                      dayEvents.length > 0 && (
                        <div className="text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {dayEvents.length}
                          </span>
                        </div>
                      )
                    ) : (
                      // Desktop view - shows event details with scrollable container
                      <div 
                        className="overflow-y-auto max-h-[65px] space-y-1 day-events-container"
                        onWheel={handleDayCellScroll}
                      >
                        {dayEvents.map((event) => (
                          <DraggableEvent 
                            key={event.id}
                            event={event}
                            events={events}
                            toggleEventCompletion={toggleEventCompletion}
                            deleteEvent={deleteEvent}
                            setSelectedEvent={setSelectedEvent}
                            setShowEventPopup={setShowEventPopup}
                            setTooltip={setTooltip}
                            detectEventConflicts={detectEventConflicts}
                            showConflictDetails={showConflictDetails}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <div 
                            className="text-xs p-1 text-gray-600 cursor-pointer hover:bg-gray-100 rounded-md transition-colors duration-200 text-center font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(date.format("YYYY-MM-DD"));
                              setShowAllEvents(true);
                            }}
                          >
                            Show all ({dayEvents.length})
                          </div>
                        )}
                      </div>
                    )}
                  </DroppableDay>
                );
              })}
            </div>
          </div>

          <DragOverlay modifiers={[restrictToWindowEdges]}>
            {draggedEvent ? (
              <div 
                className="text-xs p-2 rounded-md truncate flex items-center shadow-xl z-50"
                style={{ 
                  backgroundColor: draggedEvent.color || "#4285F4",
                  color: "white",
                  width: "150px",
                  opacity: 0.9,
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                  animation: 'pulse 1.5s infinite'
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
      </div>

      {showAllEvents && selectedDate && (
        <ShowAllEventsModal
          date={selectedDate}
          events={events.filter(e => e.date === selectedDate)}
          onClose={() => setShowAllEvents(false)}
          switchToDay={handleSwitchToDay}
          toggleEventCompletion={toggleEventCompletion}
          deleteEvent={deleteEvent}
          setSelectedEvent={setSelectedEvent}
          setShowEventPopup={setShowEventPopup}
          setTooltip={setTooltip}
          detectEventConflicts={detectEventConflicts}
          showConflictDetails={showConflictDetails}
        />
      )}
    </>
  );
};

export default MonthView;