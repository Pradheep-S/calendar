import React, { useEffect, useRef } from 'react';
import { FaTimes, FaCalendarAlt, FaCalendarDay, FaCalendarWeek, FaList, FaCheck } from "react-icons/fa";

const MobileNavDrawer = ({ onClose, activeView, views, setActiveView, currentDate, handleToday }) => {
  const drawerRef = useRef(null);
  
  const handleViewChange = (view) => {
    setActiveView(view);
    onClose();
  };

  const getTodayEvents = () => {
    handleToday();
    setActiveView("Day");
    onClose();
  };
  
  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 sm:hidden">
      <div 
        ref={drawerRef}
        className="absolute top-0 left-0 bottom-0 w-64 bg-white shadow-lg animate-slideInLeft"
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium">Menu</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <FaTimes size={16} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-2">
          <button 
            onClick={getTodayEvents}
            className="w-full flex items-center p-3 mb-1 rounded-md hover:bg-gray-100 text-left"
          >
            <FaCalendarDay className="text-blue-600 mr-3" size={16} />
            <span>Today</span>
          </button>
          
          <div className="mb-4 mt-4">
            <h4 className="px-3 mb-2 text-xs uppercase font-medium text-gray-500">Views</h4>
            {views.map(view => (
              <button
                key={view}
                onClick={() => handleViewChange(view)}
                className={`w-full flex items-center p-3 rounded-md hover:bg-gray-100 text-left ${
                  activeView === view ? "bg-blue-50 text-blue-700" : ""
                }`}
              >
                {view === "Month" && <FaCalendarAlt className="mr-3" size={16} />}
                {view === "Week" && <FaCalendarWeek className="mr-3" size={16} />}
                {view === "Day" && <FaCalendarDay className="mr-3" size={16} />}
                {view === "Agenda" && <FaList className="mr-3" size={16} />}
                <span>{view}</span>
              </button>
            ))}
          </div>
          
          <div className="mt-6">
            <h4 className="px-3 mb-2 text-xs uppercase font-medium text-gray-500">Today</h4>
            <div className="py-2 px-3 text-sm text-gray-500">
              {currentDate.format("MMMM D, YYYY")}
            </div>
            {/* You could load and display today's events here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNavDrawer;