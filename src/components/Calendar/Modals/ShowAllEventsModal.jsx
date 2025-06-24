import React from 'react';
import dayjs from 'dayjs';
import { FaCalendarDay } from 'react-icons/fa';
import { getEventTime } from '../utils/dateUtils';
import DraggableEvent from '../EventComponents/DraggableEvent';

const ShowAllEventsModal = ({ 
  date, 
  events, 
  onClose, 
  switchToDay,
  toggleEventCompletion,
  deleteEvent,
  setSelectedEvent,
  setShowEventPopup,
  setTooltip,
  detectEventConflicts,
  showConflictDetails
}) => {
  const formattedDate = dayjs(date).format("MMMM D, YYYY");
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-4 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Events on {formattedDate}
          </h3>
          <div className="flex items-center">
            <button 
              onClick={switchToDay}
              className="text-xs mr-3 bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded flex items-center"
              title="Switch to Day view"
            >
              <FaCalendarDay className="mr-1" />
              <span>Day View</span>
            </button>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-1 transition-colors duration-200"
            >
              &times;
            </button>
          </div>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-1">
          {events.length === 0 ? (
            <div className="text-center py-6 text-gray-500">No events for this day</div>
          ) : (
            <div className="space-y-2">
              {/* All-day events first */}
              {events.filter(event => !event.time).length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium uppercase text-gray-500 mb-2">All-day</h4>
                  {events
                    .filter(event => !event.time)
                    .map((event) => (
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
                </div>
              )}
              
              {/* Timed events sorted by time */}
              {events.filter(event => event.time).length > 0 && (
                <div>
                  <h4 className="text-xs font-medium uppercase text-gray-500 mb-2">Timed Events</h4>
                  {events
                    .filter(event => event.time)
                    .sort((a, b) => {
                      const [hoursA, minutesA] = a.time.split(':').map(Number);
                      const [hoursB, minutesB] = b.time.split(':').map(Number);
                      return (hoursA * 60 + minutesA) - (hoursB * 60 + minutesB);
                    })
                    .map((event) => (
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowAllEventsModal;