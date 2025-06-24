import React from 'react';
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

  return (
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
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold flex items-center">
            <div 
              className="w-4 h-4 rounded-full mr-2" 
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
        
        <div className="mt-6 flex justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditedEvent(selectedEvent); // Reset to original
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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
              className="px-3 py-1 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-all duration-200 flex items-center"
            >
              <FaTrash className="mr-1" size={12} />
              Delete
            </button>
          </div>
          
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={!editedEvent.title.trim()}
          >
            Save Changes
          </button>
        </div>
        
        {/* Preview section */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Event Preview</h4>
          <div className="p-3 rounded-md" style={{ backgroundColor: `${editedEvent.color}15` }}>
            <div className="flex items-start">
              <div 
                className="w-3 h-3 rounded-full mt-1 mr-2 flex-shrink-0" 
                style={{ backgroundColor: editedEvent.color || "#4285F4" }}
              ></div>
              <div>
                <div className={`font-medium ${editedEvent.completed ? 'line-through text-gray-500' : ''}`}>
                  {editedEvent.title || "Untitled Event"}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {dayjs(editedEvent.date).format("MMM D, YYYY")} • 
                  {editedEvent.time ? ` ${getEventTime(editedEvent)} (${editedEvent.duration})` : ' All day'}
                </div>
                {editedEvent.description && (
                  <div className="text-xs text-gray-600 mt-1 line-clamp-1">{editedEvent.description}</div>
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