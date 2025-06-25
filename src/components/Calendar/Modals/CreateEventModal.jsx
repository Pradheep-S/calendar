import React from 'react';

const CreateEventModal = ({ 
  newEvent,
  setNewEvent,
  handleCloseModal,
  handleCreateEvent
}) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
      onClick={(e) => {
        // Close modal when clicking outside
        if (e.target === e.currentTarget) handleCloseModal();
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-semibold text-gray-800">Add Event</h3>
          <button 
            onClick={handleCloseModal} 
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
              value={newEvent.title}
              onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
              placeholder="Event title"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={newEvent.date}
                onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Time</label>
              <input
                type="time"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={newEvent.time}
                onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration</label>
            <div className="flex space-x-2 mt-1">
              <select
                className="flex-grow rounded-md border border-gray-300 px-3 py-2"
                value={
                  newEvent.duration === "" || 
                  ["30m", "1h", "1h30m", "2h", "3h", "4h"].includes(newEvent.duration) 
                    ? newEvent.duration 
                    : "custom"
                }
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    // When "Custom..." is selected, show the input field but keep previous value
                    const prevValue = newEvent.duration;
                    // Set a temporary value that won't match predefined options to show input
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
              
              {/* Show custom input field when not a standard option and not empty */}
              {(newEvent.duration !== "" && 
                !["30m", "1h", "1h30m", "2h", "3h", "4h"].includes(newEvent.duration)) && (
                <input
                  type="text"
                  className="w-24 rounded-md border border-gray-300 px-3 py-2"
                  placeholder="1h30m"
                  value={newEvent.duration.startsWith("custom_") ? "" : newEvent.duration}
                  onChange={(e) => setNewEvent({...newEvent, duration: e.target.value})}
                  onFocus={(e) => {
                    // Clear "custom_" prefix when focusing
                    if (newEvent.duration.startsWith("custom_")) {
                      setNewEvent({...newEvent, duration: ""});
                    }
                  }}
                  onBlur={(e) => {
                    // Validate format on blur
                    const val = e.target.value.trim();
                    if (val === "") {
                      // If empty, set to 1h default
                      setNewEvent({...newEvent, duration: "1h"});
                    } else if (!val.match(/^(\d+h)?(\d+m)?$/)) {
                      // If invalid format, show error and set default
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
            <div className="flex space-x-2 mt-1">
              {["#4285F4", "#EA4335", "#FBBC05", "#34A853", "#8430CE", "#F06292"].map(color => (
                <div 
                  key={color}
                  className={`w-8 h-8 rounded-full cursor-pointer ${newEvent.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewEvent({...newEvent, color})}
                ></div>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
            <textarea
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              rows="3"
              value={newEvent.description}
              onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
              placeholder="Add description or notes"
            ></textarea>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="completed"
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              checked={newEvent.completed}
              onChange={(e) => setNewEvent({...newEvent, completed: e.target.checked})}
            />
            <label htmlFor="completed" className="ml-2 block text-sm text-gray-700">
              Mark as completed
            </label>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={handleCloseModal}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateEvent}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={!newEvent.title.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateEventModal;