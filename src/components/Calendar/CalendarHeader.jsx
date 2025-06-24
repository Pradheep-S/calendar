import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaPlus, FaBars, FaCalendarDay, FaCalendarAlt, FaCaretDown, FaListUl } from "react-icons/fa";
import MobileNavDrawer from './MobileNavDrawer';
import DatePicker from './DatePicker';
import dayjs from 'dayjs';

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
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup event listener
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

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

  // Function to get the appropriate icon for each view
  const getViewIcon = (view, isActive) => {
    switch(view) {
      case "Month":
        return <FaCalendarAlt size={10} className="mr-1 flex-shrink-0" />;
      case "Week":
        return (
          <div className={`flex items-center justify-center text-xs font-semibold mr-1 flex-shrink-0 rounded-sm w-3 h-3 ${
            isActive ? "bg-white text-blue-600" : "bg-gray-100 text-gray-700"
          }`}>
            7
          </div>
        );
      case "Day":
        return (
          <div className={`flex items-center justify-center text-xs font-semibold mr-1 flex-shrink-0 rounded-sm w-3 h-3 ${
            isActive ? "bg-white text-blue-600" : "bg-gray-100 text-gray-700"
          }`}>
            31
          </div>
        );
      case "Agenda":
        return <FaListUl size={10} className="mr-1 flex-shrink-0" />;
      default:
        return <FaCalendarDay size={10} className="mr-1 flex-shrink-0" />;
    }
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
        className={`flex items-center justify-center text-gray-800 hover:bg-gray-100 rounded-lg transition-colors
          ${isMobile ? 'px-2 py-1' : 'px-3 py-1.5'}`}
        style={{ minWidth: isMobile ? "120px" : "180px", maxWidth: isMobile ? "160px" : "220px" }}
      >
        <div className="flex flex-col items-center">
          <div className="flex items-center">
            <span 
              className={`font-bold truncate ${isMobile ? 'text-lg' : 'text-xl'} cursor-pointer hover:text-blue-600`}
              onClick={(e) => {
                e.stopPropagation(); // Stop event bubbling to parent button
                handleCurrentMonth();
              }}
            >
              {title}
            </span>
            <FaCaretDown className="ml-2 text-gray-500 flex-shrink-0" size={isMobile ? 12 : 14} />
          </div>
          {subtitle && <span className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>{subtitle}</span>}
        </div>
      </button>
    );
  };

  // Update this function to always go to the current month
  const handleCurrentMonth = () => {
    // Set the date to the first day of the current month (today's month, not the displayed month)
    const firstDayOfCurrentMonth = dayjs().startOf('month');
    
    // Update the date
    handleOpenModal(firstDayOfCurrentMonth, true); // Pass true to skip modal
    
    // Always switch to Month view
    setActiveView("Month");
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
      {/* Mobile View: Top Row with Navigation and Month */}
      <div className="flex items-center justify-between w-full sm:w-auto mb-2 sm:mb-0">
        {/* Hamburger menu for mobile */}
        <div className="flex items-center sm:hidden">
          <button 
            onClick={toggleMobileNav}
            className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 mr-1"
            aria-label="Open menu"
          >
            <FaBars className="text-gray-700" size={16} />
          </button>
        </div>

        {/* Display month/date with date picker */}
        <div className="flex items-center flex-grow justify-center sm:justify-start">
          <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 mr-2 sm:mr-3">
            <button 
              onClick={handlePrev} 
              className="p-2 rounded-l-md hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200 border-r border-gray-200"
              aria-label="Previous"
            >
              <FaChevronLeft className="text-gray-700" size={16} />
            </button>
            <button 
              onClick={handleNext} 
              className="p-2 rounded-r-md hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200"
              aria-label="Next"
            >
              <FaChevronRight className="text-gray-700" size={16} />
            </button>
          </div>
          
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl sm:text-2xl'} font-bold text-gray-800 flex-shrink-0`}>
            {renderHeaderTitle()}
          </h2>
        </div>

        {/* Create button - always visible */}
        <button 
          onClick={() => handleOpenModal(currentDate)}
          className="flex items-center bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg shadow-sm hover:shadow transition-all duration-200 ml-1 sm:ml-2"
          style={{ padding: isMobile ? '0.375rem 0.625rem' : '0.375rem 0.75rem' }}
        >
          <FaPlus size={isMobile ? 10 : 12} />
          <span className="hidden sm:inline ml-1 text-sm">Create</span>
        </button>
      </div>

      {/* Mobile View: Bottom Row with Today and View Toggles - IMPROVED */}
      <div className="flex items-center justify-between w-full sm:hidden mb-1">
        {/* Today button for mobile - Fixed alignment to prevent wrapping */}
        <button 
          onClick={handleSwitchToToday}
          className="flex items-center px-2.5 py-1.5 rounded-md hover:bg-blue-100 active:bg-blue-200 text-blue-600 border border-blue-200 bg-white shadow-sm whitespace-nowrap"
          aria-label="Go to today's view"
        >
          <FaCalendarDay size={12} className="flex-shrink-0" />
          <span className="text-xs font-medium ml-1 inline-block">Today</span>
        </button>
        
        {/* Mobile View Selector - Smaller, more compact for mobile */}
        <div className="flex rounded-lg shadow-sm overflow-hidden bg-white border border-gray-200">
          {views.map(view => {
            const isActive = activeView === view;
            return (
              <button
                key={view}
                onClick={() => {
                  // If clicking on Month view, go to current month
                  if (view === "Month") {
                    handleCurrentMonth();
                  } else {
                    // Other views just switch the view type
                    setActiveView(view);
                  }
                }}
                className={`flex items-center px-1.5 py-1.5 transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-blue-600 text-white font-medium"
                    : "bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                } ${view !== views[views.length-1] ? "border-r border-gray-200" : ""}`}
              >
                {getViewIcon(view, isActive)}
                <span className="text-xs font-medium truncate max-w-[42px]">{view}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop View: All in one row */}
      <div className="hidden sm:flex items-center justify-between">
        {/* Today button - desktop */}
        <button 
          onClick={handleSwitchToToday}
          className="mx-2 px-3 py-1.5 text-sm bg-white text-blue-700 rounded-md shadow-sm hover:shadow-md transition-all duration-200 border border-blue-200 hover:bg-blue-50 flex items-center whitespace-nowrap"
        >
          <FaCalendarDay className="mr-1.5 flex-shrink-0" size={12} />
          <span>Today</span>
        </button>

        {/* Desktop view selector */}
        <div className="hidden sm:flex rounded-lg shadow-sm overflow-hidden bg-white border border-gray-200 ml-3">
          {views.map(view => (
            <button
              key={view}
              onClick={() => {
                // If clicking on Month view, go to current month
                if (view === "Month") {
                  handleCurrentMonth();
                } else {
                  // Other views just switch the view type
                  setActiveView(view);
                }
              }}
              className={`px-3 sm:px-4 py-1.5 text-sm transition-all duration-200 whitespace-nowrap ${
                activeView === view
                  ? "bg-blue-600 text-white font-medium"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } ${view !== views[views.length-1] ? "border-r border-gray-200" : ""}`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {showMobileNav && (
        <MobileNavDrawer 
          onClose={toggleMobileNav}
          activeView={activeView}
          views={views}
          setActiveView={setActiveView}
          currentDate={currentDate}
          handleToday={handleSwitchToToday}
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