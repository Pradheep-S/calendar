import React, { useEffect, useState, useRef } from "react";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { CSSTransition, SwitchTransition } from 'react-transition-group';

// Import components
import CalendarHeader from './CalendarHeader';
import MonthView from './CalendarViews/MonthView';
import WeekView from './CalendarViews/WeekView';
import DayView from './CalendarViews/DayView';
import AgendaView from './CalendarViews/AgendaView';
import CreateEventModal from './Modals/CreateEventModal';
import EventDetailsModal from './Modals/EventDetailsModal';
import ConflictWarningModal from './Modals/ConflictWarningModal';
import EventTooltip from './EventComponents/EventTooltip';

// Import utilities
import { getEventTime } from './utils/dateUtils';
import { detectEventConflicts } from './utils/eventUtils';

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
    duration: "1h", // This can now be "" for Anytime
    description: "",
    color: "#4285F4",
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
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState(null);

  const nodeRef = useRef(null);

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
  const handleOpenModal = (date, skipModal = false) => {
    // Update the selected date regardless
    setCurrentDate(date);
    
    // Only show the modal if not skipping
    if (!skipModal) {
      setNewEvent({
        ...newEvent,
        date: date.format("YYYY-MM-DD")
      });
      setShowEventModal(true);
    }
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
      duration: "1h", // This can now be "" for Anytime
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
    // Close the event popup if it's open
    setShowEventPopup(false);
    // Also reset selected event
    setSelectedEvent(null);
    // Hide tooltip
    setTooltip({
      visible: false,
      event: null,
      position: { x: 0, y: 0 }
    });
  };

  // Show conflict details
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

  // Handle drag start
  const handleDragStart = (event) => {
    const { active } = event;
    setDraggedEvent(events.find(e => e.id.toString() === active.id));
  };

  // Handle drag end - this is where the issue likely is
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Get the event from the dragged element
      const draggedEventId = active.id;
      const targetDate = over.id; // This should be a date string in format "YYYY-MM-DD"
      
      // Update the event's date - ensure this is properly passed to MonthView
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

  // Add this function to ensure events open properly on mobile
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventPopup(true);
  };

  const renderCalendarView = () => {
    const viewProps = {
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
      // Add these for swipe navigation
      handlePrev,
      handleNext,
      // Add for proper event handling
      handleEventClick
    };

    switch (activeView) {
      case "Week":
        return <WeekView {...viewProps} setActiveView={setActiveView} />;
      case "Day":
        return <DayView {...viewProps} />;
      case "Agenda":
        return <AgendaView {...viewProps} />;
      case "Month":
      default:
        return <MonthView 
          {...viewProps} 
          setDraggedEvent={setDraggedEvent}
          draggedEvent={draggedEvent}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
          setActiveView={setActiveView}
        />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 max-w-full">
      <CalendarHeader 
        currentDate={currentDate}
        activeView={activeView}
        views={views}
        handlePrev={handlePrev}
        handleNext={handleNext}
        handleToday={handleToday}
        setActiveView={setActiveView}
        handleOpenModal={handleOpenModal}
      />

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

      {/* Modals */}
      {showEventModal && (
        <CreateEventModal
          newEvent={newEvent}
          setNewEvent={setNewEvent}
          handleCloseModal={handleCloseModal}
          handleCreateEvent={handleCreateEvent}
        />
      )}

      {showEventPopup && selectedEvent && (
        <EventDetailsModal
          selectedEvent={selectedEvent}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          editedEvent={editedEvent}
          setEditedEvent={setEditedEvent}
          toggleEventCompletion={toggleEventCompletion}
          deleteEvent={deleteEvent}
          setShowEventPopup={setShowEventPopup}
          setEvents={setEvents}
          events={events}
          setSelectedEvent={setSelectedEvent}
          detectEventConflicts={detectEventConflicts}
          showConflictDetails={showConflictDetails}
        />
      )}

      {showConflictWarning && conflictInfo && (
        <ConflictWarningModal
          conflictInfo={conflictInfo}
          setShowConflictWarning={setShowConflictWarning}
          getEventTime={getEventTime}
        />
      )}

      {/* Event Tooltip */}
      {tooltip.visible && tooltip.event && (
        <EventTooltip tooltip={tooltip} />
      )}
    </div>
  );
};

export default Calendar;