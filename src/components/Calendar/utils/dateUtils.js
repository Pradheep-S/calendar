import dayjs from 'dayjs';

// Get the time portion for rendering events
export const getEventTime = (event) => {
  if (!event.time) return "";
  const [hours, minutes] = event.time.split(":");
  const ampm = hours >= 12 ? "pm" : "am";
  const hour = hours % 12 || 12;
  return `${hour}:${minutes} ${ampm}`;
};

// Get styles for events based on count in month view
export const getMonthEventStyles = (dayEvents) => {
  if (dayEvents.length > 3) {
    return {
      maxToShow: 2,
      hasMore: true,
      moreCount: dayEvents.length - 2
    };
  }
  return {
    maxToShow: dayEvents.length,
    hasMore: false,
    moreCount: 0
  };
};