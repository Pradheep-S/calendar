import React, { useState, useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt, FaTimes, FaHome } from 'react-icons/fa';

const DatePicker = ({ currentDate, onDateChange, isOpen, onClose }) => {
  const [viewMode, setViewMode] = useState('days'); // 'days', 'months', 'years'
  const [viewDate, setViewDate] = useState(currentDate);
  const [decadeStart, setDecadeStart] = useState(Math.floor(currentDate.year() / 10) * 10);
  const [isMobile, setIsMobile] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const pickerRef = useRef(null);
  
  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Reset view when opening
  useEffect(() => {
    if (isOpen) {
      setViewDate(currentDate);
      setViewMode('days');
      setAnimationClass('animate-fadeIn');
      
      // Remove animation class after animation completes
      const timer = setTimeout(() => {
        setAnimationClass('');
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentDate]);
  
  // Handle click outside to close picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // If not open, don't render
  if (!isOpen) return null;
  
  // Navigate to previous/next month, year, or decade
  const handlePrev = () => {
    if (viewMode === 'days') {
      setViewDate(viewDate.subtract(1, 'month'));
    } else if (viewMode === 'months') {
      setViewDate(viewDate.subtract(1, 'year'));
    } else if (viewMode === 'years') {
      setDecadeStart(decadeStart - 10);
    }
  };
  
  const handleNext = () => {
    if (viewMode === 'days') {
      setViewDate(viewDate.add(1, 'month'));
    } else if (viewMode === 'months') {
      setViewDate(viewDate.add(1, 'year'));
    } else if (viewMode === 'years') {
      setDecadeStart(decadeStart + 10);
    }
  };
  
  // Handle selecting a date, month, or year
  const handleDaySelect = (day) => {
    const newDate = viewDate.date(day);
    onDateChange(newDate);
    onClose();
  };
  
  const handleMonthSelect = (month) => {
    setViewDate(viewDate.month(month));
    setViewMode('days');
  };
  
  const handleYearSelect = (year) => {
    setViewDate(viewDate.year(year));
    setViewMode('months');
  };
  
  // Switch between view modes
  const handleHeaderClick = () => {
    if (viewMode === 'days') {
      setViewMode('months');
    } else if (viewMode === 'months') {
      setViewMode('years');
      setDecadeStart(Math.floor(viewDate.year() / 10) * 10);
    }
  };
  
  // Jump to today
  const handleTodayClick = () => {
    const today = dayjs();
    setViewDate(today);
    onDateChange(today);
    onClose();
  };
  
  // Render the days view
  const renderDaysView = () => {
    const daysInMonth = viewDate.daysInMonth();
    const firstDayOfMonth = viewDate.startOf('month').day();
    const lastMonth = viewDate.subtract(1, 'month');
    const daysInLastMonth = lastMonth.daysInMonth();
    
    // Create day labels (Sun, Mon, etc.)
    const dayLabels = [];
    for (let i = 0; i < 7; i++) {
      dayLabels.push(
        <div key={`label-${i}`} className="text-xs font-medium text-gray-500 text-center py-2">
          {isMobile ? dayjs().day(i).format('dd')[0] : dayjs().day(i).format('dd')}
        </div>
      );
    }
    
    // Create days from previous month
    const prevMonthDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      const day = daysInLastMonth - firstDayOfMonth + i + 1;
      prevMonthDays.push(
        <div 
          key={`prev-${day}`} 
          className="text-center py-1 text-gray-400 text-sm cursor-pointer hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto"
          onClick={() => {
            const newDate = viewDate.subtract(1, 'month').date(day);
            onDateChange(newDate);
            onClose();
          }}
        >
          {day}
        </div>
      );
    }
    
    // Create days for current month
    const currentMonthDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = viewDate.date(day).isSame(dayjs(), 'day');
      const isSelected = viewDate.date(day).isSame(currentDate, 'day');
      
      currentMonthDays.push(
        <div 
          key={`current-${day}`} 
          className={`text-center py-1 text-sm cursor-pointer rounded-full w-8 h-8 flex items-center justify-center mx-auto
            ${isToday ? 'bg-blue-100 text-blue-600 font-medium' : ''}
            ${isSelected ? 'bg-blue-600 text-white font-medium' : ''}
            ${!isToday && !isSelected ? 'hover:bg-gray-100' : ''}
          `}
          onClick={() => handleDaySelect(day)}
        >
          {day}
        </div>
      );
    }
    
    // Create days for next month
    const nextMonthDays = [];
    const totalCells = 42; // 6 rows * 7 days
    const remainingCells = totalCells - prevMonthDays.length - currentMonthDays.length;
    
    for (let day = 1; day <= remainingCells; day++) {
      nextMonthDays.push(
        <div 
          key={`next-${day}`} 
          className="text-center py-1 text-gray-400 text-sm cursor-pointer hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto"
          onClick={() => {
            const newDate = viewDate.add(1, 'month').date(day);
            onDateChange(newDate);
            onClose();
          }}
        >
          {day}
        </div>
      );
    }
    
    // Combine all days
    const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
    
    return (
      <>
        <div className="grid grid-cols-7 mt-2">
          {dayLabels}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {allDays}
        </div>
      </>
    );
  };
  
  // Render the months view
  const renderMonthsView = () => {
    const months = [];
    const currentYear = viewDate.year() === dayjs().year();
    
    for (let i = 0; i < 12; i++) {
      const isCurrentMonth = currentYear && i === dayjs().month();
      const isSelected = i === viewDate.month() && viewDate.year() === currentDate.year();
      
      months.push(
        <div 
          key={`month-${i}`}
          className={`p-2 text-center cursor-pointer rounded-lg hover:bg-gray-100
            ${isCurrentMonth ? 'text-blue-600 font-medium' : ''}
            ${isSelected ? 'bg-blue-600 text-white font-medium hover:bg-blue-500' : ''}
          `}
          onClick={() => handleMonthSelect(i)}
        >
          {dayjs().month(i).format('MMM')}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-3 gap-2 p-2 mt-2">
        {months}
      </div>
    );
  };
  
  // Render the years view
  const renderYearsView = () => {
    const years = [];
    const currentYear = dayjs().year();
    
    for (let year = decadeStart; year < decadeStart + 12; year++) {
      const isCurrentYear = year === currentYear;
      const isSelected = year === currentDate.year();
      
      years.push(
        <div 
          key={`year-${year}`}
          className={`p-2 text-center cursor-pointer rounded-lg hover:bg-gray-100
            ${isCurrentYear ? 'text-blue-600 font-medium' : ''}
            ${isSelected ? 'bg-blue-600 text-white font-medium hover:bg-blue-500' : ''}
            ${year < decadeStart || year >= decadeStart + 10 ? 'text-gray-400' : ''}
          `}
          onClick={() => handleYearSelect(year)}
        >
          {year}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-3 gap-2 p-2 mt-2">
        {years}
      </div>
    );
  };
  
  // Render the header based on current view mode
  const renderHeader = () => {
    if (viewMode === 'days') {
      return (
        <button 
          className="font-medium hover:bg-gray-100 px-3 py-1 rounded-md transition-colors text-left w-full flex items-center justify-center"
          onClick={handleHeaderClick}
        >
          <span className="text-lg font-bold">{viewDate.format('MMMM YYYY')}</span>
        </button>
      );
    } else if (viewMode === 'months') {
      return (
        <button 
          className="font-medium hover:bg-gray-100 px-3 py-1 rounded-md transition-colors text-left w-full flex items-center justify-center"
          onClick={handleHeaderClick}
        >
          <span className="text-lg font-bold">{viewDate.format('YYYY')}</span>
        </button>
      );
    } else if (viewMode === 'years') {
      return (
        <button 
          className="font-medium hover:bg-gray-100 px-3 py-1 rounded-md transition-colors text-center w-full flex items-center justify-center"
        >
          <span className="text-lg font-bold">{`${decadeStart} - ${decadeStart + 9}`}</span>
        </button>
      );
    }
  };
  
  // Shared date picker design
  const datePickerContent = (
    <div className={`bg-white rounded-lg shadow-xl p-4 w-full max-w-xs ${animationClass}`}>
      <div className="flex items-center justify-between mb-2">
        <button 
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
          onClick={handlePrev}
        >
          <FaChevronLeft size={16} />
        </button>
        
        <div className="flex-1 text-center">
          {renderHeader()}
        </div>
        
        <button 
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
          onClick={handleNext}
        >
          <FaChevronRight size={16} />
        </button>
      </div>
      
      {viewMode === 'days' && renderDaysView()}
      {viewMode === 'months' && renderMonthsView()}
      {viewMode === 'years' && renderYearsView()}
      
      <div className="mt-4 flex justify-between items-center pt-3 border-t">
        <button 
          className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-md font-medium flex items-center"
          onClick={handleTodayClick}
        >
          <FaHome className="mr-1" size={12} />
          Today
        </button>
        
        <button 
          className="text-sm text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-md"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
  
  // Mobile or desktop view
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 animate-fadeIn">
      <div 
        ref={pickerRef}
        className={isMobile ? "w-full max-w-[320px] mx-auto mt-24" : ""}
      >
        {datePickerContent}
      </div>
    </div>
  );
};

export default DatePicker;