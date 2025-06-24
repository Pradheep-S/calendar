import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaPlus, FaBars, FaCalendarDay } from "react-icons/fa";
import MobileNavDrawer from './MobileNavDrawer';

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
  const [showMobileNav, setShowMobileNav] = useState(false);

  const toggleMobileNav = () => {
    setShowMobileNav(!showMobileNav);
  };

  const handleSwitchToToday = () => {
    handleToday();
    // If not already in day view, switch to it
    if (activeView !== "Day") {
      setActiveView("Day");
    }
  };

  // Renders month name prominently for mobile
  const renderHeaderTitle = () => {
    if (activeView === "Month") {
      return currentDate.format("MMMM YYYY");
    } else if (activeView === "Week") {
      return `${currentDate.startOf("week").format("MMM D")} - ${currentDate.endOf("week").format("MMM D")}`;
    } else if (activeView === "Day") {
      return currentDate.format("MMMM D, YYYY");
    } else {
      return "Upcoming Events";
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
      {/* Left side with navigation */}
      <div className="flex items-center justify-between mb-3 sm:mb-0">
        {/* Hamburger menu for mobile */}
        <div className="flex items-center sm:hidden">
          <button 
            onClick={toggleMobileNav}
            className="p-2 rounded-full hover:bg-gray-100 mr-2"
            aria-label="Open menu"
          >
            <FaBars className="text-gray-700" size={16} />
          </button>
        </div>

        {/* Display month/date instead of "Calendar" */}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{renderHeaderTitle()}</h2>
        
        <div className="flex items-center sm:ml-6 space-x-2">
          <button 
            onClick={handleToday} 
            className="px-3 py-1 text-xs sm:text-sm bg-white text-blue-700 rounded-md shadow-sm hover:shadow transition-all duration-200 border border-blue-100 hover:bg-blue-50 hidden sm:block"
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
      </div>
      
      {/* Right side with view options */}
      <div className="flex items-center justify-between">
        {/* Desktop view selector */}
        <div className="hidden sm:flex rounded-lg shadow-sm overflow-hidden bg-white border border-gray-100">
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

        {/* Mobile: Today button with icon and text */}
        <button 
          onClick={handleSwitchToToday}
          className="sm:hidden flex items-center px-2 py-1.5 rounded-md hover:bg-blue-50 text-blue-600 border border-blue-100 bg-white"
          aria-label="Go to today's view"
        >
          <FaCalendarDay size={14} />
          <span className="text-xs ml-1.5">Today</span>
        </button>
        
        <button 
          onClick={() => handleOpenModal(currentDate)}
          className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all duration-200 ml-2"
        >
          <FaPlus size={12} />
          <span className="hidden sm:inline">Create</span>
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {showMobileNav && (
        <MobileNavDrawer 
          onClose={toggleMobileNav}
          activeView={activeView}
          views={views}
          setActiveView={setActiveView}
          currentDate={currentDate}
          handleToday={handleToday}
        />
      )}
    </div>
  );
};

export default CalendarHeader;