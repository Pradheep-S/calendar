import React from 'react';
import dayjs from 'dayjs';
import { FaCheck, FaTrash, FaEdit } from "react-icons/fa";
import BaseModal from './BaseModal';
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
  const title = isEditing ? "Edit Event" : "Event Details";
  
  return (
    <BaseModal
      isOpen={true}
      onClose={() => {
        setShowEventPopup(false);
        setIsEditing(false);
      }}
      title={
        <div className="flex items-center">
          <div 
            className="w-4 h-4 rounded-full mr-2" 
            style={{ backgroundColor: selectedEvent.color || "#4285F4" }}
          ></div>
          {title}
        </div>
      }
      fullScreenOnMobile={true}
    >
      {!isEditing ? (
        // View mode
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-xl font-semibold">{selectedEvent.title}</h2>
            <div className="text-sm text-gray-600 mt-1 flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
              <span className="flex items-center">
                <span className="inline-block w-5 text-center">📅</span> 
                {dayjs(selectedEvent.date).format("MMMM D, YYYY")}
              </span>
              {selectedEvent.time && (
                <span className="flex items-center">
                  <span className="inline-block w-5 text-center">⏰</span> 
                  {getEventTime(selectedEvent)} ({selectedEvent.duration})
                </span>
              )}
            </div>
          </div>
          
          {selectedEvent.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
              <p className="text-sm text-gray-600">{selectedEvent.description}</p>
            </div>
          )}
          
          <div className="flex items-center flex-wrap gap-2 pt-2">
            <div 
              className={`px-3 py-1.5 text-sm rounded-full ${
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
                  className="px-3 py-1.5 text-sm rounded-full bg-yellow-100 text-yellow-800 cursor-pointer"
                  onClick={() => showConflictDetails(selectedEvent, conflicts)}
                >
                  ⚠️ Time Conflict ({conflicts.conflictCount})
                </div>
              ) : null;
            })()}
          </div>
          
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => {
                toggleEventCompletion(selectedEvent.id);
                setSelectedEvent({
                  ...selectedEvent, 
                  completed: !selectedEvent.completed
                });
              }}
              className={`px-4 py-3 border rounded-md text-sm font-medium flex items-center justify-center ${
                selectedEvent.completed 
                  ? 'border-orange-300 text-orange-600 hover:bg-orange-50' 
                  : 'border-green-300 text-green-600 hover:bg-green-50'
              }`}
            >
              <FaCheck className="mr-2" />
              {selectedEvent.completed ? 'Mark Undone' : 'Mark Complete'}
            </button>
            
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this event?')) {
                  deleteEvent(selectedEvent.id);
                  setShowEventPopup(false);
                }
              }}
              className="px-4 py-3 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-all duration-200 flex items-center justify-center font-medium"
            >
              <FaTrash className="mr-2" />
              Delete Event
            </button>
          </div>
        </div>
      ) : (
        // Edit mode
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 text-base"
              value={editedEvent.title}
              onChange={(e) => setEditedEvent({...editedEvent, title: e.target.value})}
              placeholder="Event title"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 text-base"
                value={editedEvent.date}
                onChange={(e) => setEditedEvent({...editedEvent, date: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Time</label>
              <input
                type="time"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 text-base"
                value={editedEvent.time}
                onChange={(e) => setEditedEvent({...editedEvent, time: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration</label>
            <div className="flex flex-col sm:flex-row sm:space-x-2 mt-1 space-y-2 sm:space-y-0">
              <select
                className="flex-grow rounded-md border border-gray-300 px-3 py-2.5 text-base"
                value={
                  editedEvent.duration === "" || 
                  ["30m", "1h", "1h30m", "2h", "3h", "4h"].includes(editedEvent.duration) 
                    ? editedEvent.duration 
                    : "custom"
                }
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    const prevValue = editedEvent.duration;
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
              
              {(editedEvent.duration !== "" && 
                !["30m", "1h", "1h30m", "2h", "3h", "4h"].includes(editedEvent.duration)) && (
                <input
                  type="text"
                  className="w-full sm:w-32 rounded-md border border-gray-300 px-3 py-2.5 text-base"
                  placeholder="1h30m"
                  value={editedEvent.duration.startsWith("custom_") ? "" : editedEvent.duration}
                  onChange={(e) => setEditedEvent({...editedEvent, duration: e.target.value})}
                  onFocus={(e) => {
                    if (editedEvent.duration.startsWith("custom_")) {
                      setEditedEvent({...editedEvent, duration: ""});
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val === "") {
                      setEditedEvent({...editedEvent, duration: "1h"});
                    } else if (!val.match(/^(\d+h)?(\d+m)?$/)) {
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
            <div className="flex flex-wrap gap-3 mt-2">
              {["#4285F4", "#EA4335", "#FBBC05", "#34A853", "#8430CE", "#F06292"].map(color => (
                <div 
                  key={color}
                  className={`w-9 h-9 rounded-full cursor-pointer ${editedEvent.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setEditedEvent({...editedEvent, color})}
                ></div>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
            <textarea
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 text-base"
              rows="3"
              value={editedEvent.description}
              onChange={(e) => setEditedEvent({...editedEvent, description: e.target.value})}
              placeholder="Add description or notes"
            ></textarea>
          </div>

          <div className="flex items-center mt-3">
            <input
              type="checkbox"
              id="edit-completed"
              className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              checked={editedEvent.completed}
              onChange={(e) => setEditedEvent({...editedEvent, completed: e.target.checked})}
            />
            <label htmlFor="edit-completed" className="ml-2 block text-sm text-gray-700">
              Mark as completed
            </label>
          </div>
        </div>
      )}
      
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {isEditing ? (
          // Edit mode buttons
          <>
            <button
              onClick={() => {
                // Update the event
                setEvents(events.map(e => 
                  e.id === editedEvent.id ? editedEvent : e
                ));
                setSelectedEvent(editedEvent);
                setIsEditing(false);
              }}
              className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center"
              disabled={!editedEvent.title.trim()}
            >
              Save Changes
            </button>
            
            <button
              onClick={() => {
                setIsEditing(false);
                setEditedEvent(selectedEvent); // Reset to original
              }}
              className="px-4 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
          </>
        ) : (
          // View mode edit button
          <button
            onClick={() => {
              setEditedEvent({...selectedEvent});
              setIsEditing(true);
            }}
            className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 flex items-center justify-center font-medium sm:col-span-2"
          >
            <FaEdit className="mr-2" />
            Edit Event
          </button>
        )}
      </div>
    </BaseModal>
  );
};

export default EventDetailsModal;