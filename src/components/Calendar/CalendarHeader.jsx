import React from 'react';
import { FaChevronLeft, FaChevronRight, FaPlus } from "react-icons/fa";

const CalendarHeader = ({
  currentDate,
  activeView,
  views,
  handlePrev,
  handleNext,
  handleToday,
  setActiveView,
  handleOpenModal
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
      {/* Left side with brand and navigation */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-3 sm:mb-0">
        <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Calendar</h2>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleToday} 
            className="px-3 py-1 text-xs sm:text-sm bg-white text-blue-700 rounded-md shadow-sm hover:shadow transition-all duration-200 border border-blue-100 hover:bg-blue-50"
          >
            Today
          </button>
          
          <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-100">
            <button 
              onClick={handlePrev} 
              className="p-1.5 sm:p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
              aria-label="Previous"
            >
              <FaChevronLeft className="text-gray-600" size={12} />
            </button>
            <button 
              onClick={handleNext} 
              className="p-1.5 sm:p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
              aria-label="Next"
            >
              <FaChevronRight className="text-gray-600" size={12} />
            </button>
          </div>
        </div>
        
        <h3 className="text-base sm:text-lg font-medium text-gray-800">
          {activeView === "Day" 
            ? currentDate.format("MMMM D, YYYY")
            : activeView === "Week" 
              ? `${currentDate.startOf("week").format("MMM D")} - ${currentDate.endOf("week").format("MMM D")}`
              : currentDate.format("MMMM YYYY")
          }
        </h3>
      </div>
      
      {/* Right side with view options */}
      <div className="flex items-center space-x-2">
        <div className="flex rounded-lg shadow-sm overflow-hidden bg-white border border-gray-100">
          {views.map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm transition-all duration-200 ${
                activeView === view
                  ? "bg-blue-600 text-white font-medium"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {view}
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => handleOpenModal(currentDate)}
          className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all duration-200"
        >
          <FaPlus size={12} />
          <span className="hidden sm:inline">Create</span>
        </button>
      </div>
    </div>
  );
};

export default CalendarHeader;