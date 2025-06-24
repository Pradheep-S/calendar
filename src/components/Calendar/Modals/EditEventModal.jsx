import React, { useEffect } from 'react';
import dayjs from 'dayjs';
import { FaCheck, FaTrash } from "react-icons/fa";

const EditEventModal = ({ 
  selectedEvent,
  isEditing,
  setIsEditing,
  editedEvent,
  setEditedEvent,
  toggleEventCompletion,
  deleteEvent,
  setShowEventPopup,
  setEvents,
  events,
  setSelectedEvent,
  detectEventConflicts,
  showConflictDetails,
  getEventTime
}) => {
  const handleUpdateEvent = () => {
    // Update the event
    setEvents(events.map(e => 
      e.id === editedEvent.id ? editedEvent : e
    ));
    setSelectedEvent(editedEvent);
    setIsEditing(false);
  };

  // Check for conflicts when updating
  const checkForConflicts = () => {
    // Create a temporary array with the edited event to check for conflicts
    const tempEvents = events.map(e => 
      e.id === editedEvent.id ? editedEvent : e
    );
    
    const conflicts = detectEventConflicts(tempEvents).find(e => e.id === editedEvent.id);
    if (conflicts && conflicts.conflictCount > 0) {
      return {
        hasConflicts: true,
        conflicts
      };
    }
    
    return { hasConflicts: false };
  };

  // Handle escape key press to close modal
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        setShowEventPopup(false);
        setIsEditing(false);
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'auto';
    };
  }, [setShowEventPopup, setIsEditing]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn p-3 touch-none"
      onClick={(e) => {
        // Close popup when clicking outside
        if (e.target === e.currentTarget) {
          setShowEventPopup(false);
          setIsEditing(false);
        }
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-lg w-full max-w-[90%] sm:max-w-md p-2 sm:p-4 animate-scaleIn max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-2 sticky top-0 bg-white pb-1">
          <h3 className="text-sm sm:text-base font-semibold flex items-center">
            <div 
              className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full mr-1.5" 
              style={{ backgroundColor: editedEvent.color || "#4285F4" }}
            ></div>
            Edit Event
          </h3>
          <button 
            onClick={() => {
              setShowEventPopup(false);
              setIsEditing(false);
            }} 
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-1 transition-colors duration-200"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        
        <div className="space-y-2 sm:space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700">Title</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 sm:py-1.5 text-xs sm:text-sm"
              value={editedEvent.title}
              onChange={(e) => setEditedEvent({...editedEvent, title: e.target.value})}
              placeholder="Event title"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">Date</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 sm:py-1.5 text-xs"
                value={editedEvent.date}
                onChange={(e) => setEditedEvent({...editedEvent, date: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700">Time</label>
              <input
                type="time"
                className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 sm:py-1.5 text-xs"
                value={editedEvent.time}
                onChange={(e) => setEditedEvent({...editedEvent, time: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700">Duration</label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 sm:py-1.5 text-xs"
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
            <label className="block text-xs font-medium text-gray-700">Color</label>
            <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-1">
              {["#4285F4", "#EA4335", "#FBBC05", "#34A853", "#8430CE", "#F06292"].map(color => (
                <div 
                  key={color}
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full cursor-pointer ${editedEvent.color === color ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setEditedEvent({...editedEvent, color})}
                ></div>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700">Description (optional)</label>
            <textarea
              className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 sm:py-1.5 text-xs"
              rows="2"
              value={editedEvent.description}
              onChange={(e) => setEditedEvent({...editedEvent, description: e.target.value})}
              placeholder="Add description or notes"
            ></textarea>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="edit-completed"
              className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              checked={editedEvent.completed}
              onChange={(e) => setEditedEvent({...editedEvent, completed: e.target.checked})}
            />
            <label htmlFor="edit-completed" className="ml-1.5 block text-xs text-gray-700">
              Mark as completed
            </label>
          </div>
        </div>
        
        {/* Always column-wise buttons for better mobile experience */}
        <div className="mt-3 sm:mt-4 flex flex-col gap-2">
          <button
            onClick={() => {
              // Check for conflicts before saving
              const { hasConflicts, conflicts } = checkForConflicts();
              
              if (hasConflicts) {
                // Show conflict warning or confirmation
                if (window.confirm(`This update will create ${conflicts.conflictCount} time conflict(s). Save anyway?`)) {
                  handleUpdateEvent();
                }
              } else {
                // No conflicts, save directly
                handleUpdateEvent();
              }
            }}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-xs font-medium"
            disabled={!editedEvent.title.trim()}
          >
            Save Changes
          </button>
          
          <button
            onClick={() => {
              setIsEditing(false);
              setEditedEvent(selectedEvent); // Reset to original
            }}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-xs"
          >
            Cancel
          </button>
          
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this event?')) {
                deleteEvent(selectedEvent.id);
                setShowEventPopup(false);
                setIsEditing(false);
              }
            }}
            className="px-3 py-1.5 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-all duration-200 flex items-center justify-center text-xs"
          >
            <FaTrash className="mr-1" size={10} />
            Delete
          </button>
        </div>
        
        {/* Preview section - completely hidden on mobile */}
        <div className="hidden sm:block mt-4 pt-3 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-500 mb-2">Event Preview</h4>
          <div className="p-2 rounded-md" style={{ backgroundColor: `${editedEvent.color}15` }}>
            <div className="flex items-start">
              <div 
                className="w-2 h-2 rounded-full mt-1 mr-1.5 flex-shrink-0" 
                style={{ backgroundColor: editedEvent.color || "#4285F4" }}
              ></div>
              <div>
                <div className={`font-medium text-xs ${editedEvent.completed ? 'line-through text-gray-500' : ''}`}>
                  {editedEvent.title || "Untitled Event"}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {dayjs(editedEvent.date).format("MMM D, YYYY")} • 
                  {editedEvent.time ? ` ${getEventTime(editedEvent)} (${editedEvent.duration})` : ' All day'}
                </div>
                {editedEvent.description && (
                  <div className="text-xs text-gray-600 mt-0.5 line-clamp-1">{editedEvent.description}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEventModal;