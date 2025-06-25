import React from 'react';
import BaseModal from './BaseModal';

const CreateEventModal = ({ 
  newEvent,
  setNewEvent,
  handleCloseModal,
  handleCreateEvent
}) => {
  return (
    <BaseModal
      isOpen={true}
      onClose={handleCloseModal}
      title="Add Event"
      fullScreenOnMobile={true}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 text-base"
            value={newEvent.title}
            onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
            placeholder="Event title"
            autoFocus
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 text-base"
              value={newEvent.date}
              onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Time</label>
            <input
              type="time"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 text-base"
              value={newEvent.time}
              onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Duration</label>
          <div className="flex flex-col sm:flex-row sm:space-x-2 mt-1 space-y-2 sm:space-y-0">
            <select
              className="flex-grow rounded-md border border-gray-300 px-3 py-2.5 text-base"
              value={
                newEvent.duration === "" || 
                ["30m", "1h", "1h30m", "2h", "3h", "4h"].includes(newEvent.duration) 
                  ? newEvent.duration 
                  : "custom"
              }
              onChange={(e) => {
                if (e.target.value === "custom") {
                  const prevValue = newEvent.duration;
                  setNewEvent({...newEvent, duration: prevValue === "" || 
                    ["30m", "1h", "1h30m", "2h", "3h", "4h"].includes(prevValue) 
                      ? "custom_" 
                      : prevValue});
                } else {
                  setNewEvent({...newEvent, duration: e.target.value});
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
            
            {(newEvent.duration !== "" && 
              !["30m", "1h", "1h30m", "2h", "3h", "4h"].includes(newEvent.duration)) && (
              <input
                type="text"
                className="w-full sm:w-32 rounded-md border border-gray-300 px-3 py-2.5 text-base"
                placeholder="1h30m"
                value={newEvent.duration.startsWith("custom_") ? "" : newEvent.duration}
                onChange={(e) => setNewEvent({...newEvent, duration: e.target.value})}
                onFocus={(e) => {
                  if (newEvent.duration.startsWith("custom_")) {
                    setNewEvent({...newEvent, duration: ""});
                  }
                }}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val === "") {
                    setNewEvent({...newEvent, duration: "1h"});
                  } else if (!val.match(/^(\d+h)?(\d+m)?$/)) {
                    alert("Please use format like: 1h, 30m, 1h30m");
                    setNewEvent({...newEvent, duration: "1h"});
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
                className={`w-9 h-9 rounded-full cursor-pointer ${newEvent.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setNewEvent({...newEvent, color})}
              ></div>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
          <textarea
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 text-base"
            rows="3"
            value={newEvent.description}
            onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
            placeholder="Add description or notes"
          ></textarea>
        </div>

        <div className="flex items-center mt-3">
          <input
            type="checkbox"
            id="completed"
            className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            checked={newEvent.completed}
            onChange={(e) => setNewEvent({...newEvent, completed: e.target.checked})}
          />
          <label htmlFor="completed" className="ml-2 block text-sm text-gray-700">
            Mark as completed
          </label>
        </div>
      </div>
      
      <div className="mt-6 flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
        <button
          onClick={handleCloseModal}
          className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-base"
        >
          Cancel
        </button>
        <button
          onClick={handleCreateEvent}
          className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-base"
          disabled={!newEvent.title.trim()}
        >
          Save
        </button>
      </div>
    </BaseModal>
  );
};

export default CreateEventModal;