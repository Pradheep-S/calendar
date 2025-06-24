import React, { useState } from 'react';
import dayjs from 'dayjs';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useDroppable } from "@dnd-kit/core";
import { getMonthEventStyles } from '../utils/dateUtils';
import { getEventTime } from '../utils/dateUtils';
import DraggableEvent from '../EventComponents/DraggableEvent';
import ShowAllEventsModal from '../Modals/ShowAllEventsModal';

// DroppableDay component
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
  setActiveView // Add this prop to allow changing the view
}) => {
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  );

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
  const handleSwitchToDay = () => {
    if (selectedDate) {
      // Update the currentDate in the parent component if needed
      // This would be implemented in the Calendar/index.jsx
      
      // Switch to day view
      setActiveView("Day");
      setShowAllEvents(false);
    }
  };

  return (
    <>
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
                    {styles.hasMore && (
                      <div 
                        className="text-xs p-1.5 text-gray-600 cursor-pointer hover:bg-gray-100 rounded-md transition-colors duration-200 text-center font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Show modal with all events instead of alert
                          setSelectedDate(date.format("YYYY-MM-DD"));
                          setShowAllEvents(true);
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