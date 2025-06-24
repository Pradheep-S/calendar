import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaPlus, FaBars, FaCalendarDay, FaCalendarAlt, FaCaretDown } from "react-icons/fa";
import MobileNavDrawer from './MobileNavDrawer';
import DatePicker from './DatePicker';

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
  const [showDatePicker, setShowDatePicker] = useState(false);

  const toggleMobileNav = () => {
    setShowMobileNav(!showMobileNav);
  };

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  // Updated to ensure consistent behavior with DayView
  const handleSwitchToToday = () => {
    // Navigate to today's date
    handleToday();
    // Always switch to Day view when clicking Today button
    setActiveView("Day");
  };

  const handleDateChange = (newDate) => {
    // Handle date change and maintain current view
    handleOpenModal(newDate, true);
  };

  // Renders month name prominently for mobile
  const renderHeaderTitle = () => {
    let title, subtitle;
    
    if (activeView === "Month") {
      title = currentDate.format("MMMM");
      subtitle = currentDate.format("YYYY");
    } else if (activeView === "Week") {
      title = `${currentDate.startOf("week").format("MMM D")} - ${currentDate.endOf("week").format("MMM D")}`;
      subtitle = currentDate.format("YYYY");
    } else if (activeView === "Day") {
      title = currentDate.format("MMMM D");
      subtitle = currentDate.format("YYYY");
    } else {
      title = "Upcoming Events";
      subtitle = "";
    }
    
    return (
      <button 
        onClick={toggleDatePicker}
        className="flex items-center justify-center text-gray-800 hover:bg-gray-100 rounded-lg px-3 py-1.5 transition-colors"
        style={{ minWidth: "180px", maxWidth: "220px" }}
      >
        <div className="flex flex-col items-center">
          <div className="flex items-center">
            <span className="font-bold text-xl truncate">{title}</span>
            <FaCaretDown className="ml-2 text-gray-500 flex-shrink-0" size={14} />
          </div>
          {subtitle && <span className="text-sm text-gray-500">{subtitle}</span>}
        </div>
      </button>
    );
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

        {/* Display month/date with date picker */}
        <div className="flex items-center">
          <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 mr-3">
            <button 
              onClick={handlePrev} 
              className="p-2 sm:p-2.5 rounded-l-md hover:bg-gray-100 transition-colors duration-200 border-r border-gray-200"
              aria-label="Previous"
            >
              <FaChevronLeft className="text-gray-700" size={14} />
            </button>
            <button 
              onClick={handleNext} 
              className="p-2 sm:p-2.5 rounded-r-md hover:bg-gray-100 transition-colors duration-200"
              aria-label="Next"
            >
              <FaChevronRight className="text-gray-700" size={14} />
            </button>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex-shrink-0">
            {renderHeaderTitle()}
          </h2>

          {/* Today button - using handleSwitchToToday for both desktop and mobile */}
          <button 
            onClick={handleSwitchToToday}
            className="mx-2 px-3 py-1.5 text-sm bg-white text-blue-700 rounded-md shadow-sm hover:shadow-md transition-all duration-200 border border-blue-200 hover:bg-blue-50 hidden sm:flex items-center"
          >
            <FaCalendarDay className="mr-1.5" size={12} />
            Today
          </button>
        </div>
        
        <div className="flex items-center sm:ml-2 space-x-2">
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
            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all duration-200"
          >
            <FaPlus size={12} />
            <span className="hidden sm:inline ml-1">Create</span>
          </button>
        </div>
      </div>

      {/* Right side with view options */}
      <div className="flex items-center justify-between">
        {/* Desktop view selector */}
        <div className="hidden sm:flex rounded-lg shadow-sm overflow-hidden bg-white border border-gray-200">
          {views.map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-3 sm:px-4 py-1.5 text-sm transition-all duration-200 ${
                activeView === view
                  ? "bg-blue-600 text-white font-medium"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } ${view !== views[views.length-1] ? "border-r border-gray-200" : ""}`}
            >
              {view}
            </button>
          ))}
        </div>

        {/* Mobile: Today button removed as it's redundant with the one near the date picker */}
      </div>

      {/* Mobile Navigation Drawer */}
      {showMobileNav && (
        <MobileNavDrawer 
          onClose={toggleMobileNav}
          activeView={activeView}
          views={views}
          setActiveView={setActiveView}
          currentDate={currentDate}
          handleToday={handleSwitchToToday} // Pass the consistent handler
        />
      )}
      
      {/* Date Picker Component */}
      <DatePicker
        currentDate={currentDate}
        onDateChange={handleDateChange}
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
      />
    </div>
  );
};

export default CalendarHeader;