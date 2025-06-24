import React from 'react';
import dayjs from 'dayjs';

const ConflictWarningModal = ({ 
  conflictInfo, 
  setShowConflictWarning, 
  getEventTime 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold flex items-center">
            <span className="text-yellow-500 mr-2">⚠️</span>
            Time Conflict Detected
          </h3>
          <button onClick={() => setShowConflictWarning(false)} className="text-gray-500 hover:text-gray-700">
            &times;
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800">
              The event "<strong>{conflictInfo.event.title}</strong>" at {getEventTime(conflictInfo.event)} 
              conflicts with {conflictInfo.conflictingEvents.length} other event(s):
            </p>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {conflictInfo.conflictingEvents.map(event => (
              <div 
                key={event.id}
                className="flex items-center p-2 border-b"
              >
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: event.color || "#4285F4" }}
                ></div>
                <div>
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-gray-600">
                    {dayjs(event.date).format("MMM D")} • {getEventTime(event)} ({event.duration})
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-sm text-gray-600">
            You can:
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Keep both events (they will display side by side)</li>
              <li>Reschedule one of the events</li>
              <li>Delete one of the events</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setShowConflictWarning(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictWarningModal;