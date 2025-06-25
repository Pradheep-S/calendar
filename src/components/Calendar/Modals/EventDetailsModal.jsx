import React from 'react';
import dayjs from 'dayjs';
import { FaCheck, FaTrash, FaEdit } from "react-icons/fa";
import { getEventTime } from '../utils/dateUtils';

const EventDetailsModal = ({
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
  showConflictDetails
}) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
      onClick={(e) => {
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
              <div className="flex space-x-2 mt-1">
                <select
                  className="flex-grow rounded-md border border-gray-300 px-3 py-2"
                  value={
                    editedEvent.duration === "" || 
                    ["30m", "1h", "1h30m", "2h", "3h", "4h"].includes(editedEvent.duration) 
                      ? editedEvent.duration 
                      : "custom"
                  }
                  onChange={(e) => {
                    if (e.target.value === "custom") {
                      // When "Custom..." is selected, show the input field but keep previous value
                      const prevValue = editedEvent.duration;
                      // Set a temporary value that won't match predefined options to show input
                      setEditedEvent({...editedEvent, duration: prevValue === "" || 
                        ["30m", "1h", "1h30m", "2h", "3h", "4h"].includes(prevValue) 
                          ? "custom_" 
                          : prevValue});
                    } else {
                      setEditedEvent({...editedEvent, duration: e.target.value});
                    }
                  }}
                >
                  <option value="">Anytime</option>
                  <option value="30m">30 minutes</option>
                  <option value="1h">1 hour</option>
                  <option value="1h30m">1 hour 30 minutes</option>
                  <option value="2h">2 hours</option>
                  <option value="3h">3 hours</option>
                  <option value="4h">4 hours</option>
                  <option value="custom">Custom...</option>
                </select>
                
                {/* Show custom input field when not a standard option and not empty */}
                {(editedEvent.duration !== "" && 
                  !["30m", "1h", "1h30m", "2h", "3h", "4h"].includes(editedEvent.duration)) && (
                  <input
                    type="text"
                    className="w-24 rounded-md border border-gray-300 px-3 py-2"
                    placeholder="1h30m"
                    value={editedEvent.duration.startsWith("custom_") ? "" : editedEvent.duration}
                    onChange={(e) => setEditedEvent({...editedEvent, duration: e.target.value})}
                    onFocus={(e) => {
                      // Clear "custom_" prefix when focusing
                      if (editedEvent.duration.startsWith("custom_")) {
                        setEditedEvent({...editedEvent, duration: ""});
                      }
                    }}
                    onBlur={(e) => {
                      // Validate format on blur
                      const val = e.target.value.trim();
                      if (val === "") {
                        // If empty, set to 1h default
                        setEditedEvent({...editedEvent, duration: "1h"});
                      } else if (!val.match(/^(\d+h)?(\d+m)?$/)) {
                        // If invalid format, show error and set default
                        alert("Please use format like: 1h, 30m, 1h30m");
                        setEditedEvent({...editedEvent, duration: "1h"});
                      }
                    }}
                    autoFocus
                  />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Format: 1h, 30m, 1h30m, etc.</p>
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
                {selectedEvent.completed ? 'Mark Undone' : 'Mark Complete'}
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
  );
};

export default EventDetailsModal;