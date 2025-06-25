import React from 'react';
import dayjs from 'dayjs';
import { FaCalendarDay } from 'react-icons/fa';
import BaseModal from './BaseModal';
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
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={
        <div className="flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          Events on {formattedDate}
        </div>
      }
      fullScreenOnMobile={true}
    >
      <div className="mb-3">
        <button 
          onClick={() => switchToDay(dayjs(date))}
          className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded flex items-center"
          title="Switch to Day view"
        >
          <FaCalendarDay className="mr-1" />
          <span>View in Day View</span>
        </button>
      </div>
      
      <div>
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No events for this day</div>
        ) : (
          <div className="space-y-4">
            {/* All-day events first */}
            {events.filter(event => !event.time).length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium uppercase text-gray-500 mb-2 tracking-wider">All-day</h4>
                <div className="space-y-2">
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
              </div>
            )}
            
            {/* Timed events sorted by time */}
            {events.filter(event => event.time).length > 0 && (
              <div>
                <h4 className="text-xs font-medium uppercase text-gray-500 mb-2 tracking-wider">Timed Events</h4>
                <div className="space-y-2">
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
              </div>
            )}
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default ShowAllEventsModal;