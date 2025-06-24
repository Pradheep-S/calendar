// Enhanced conflict detection function that can be used across all views
export const detectEventConflicts = (events) => {
  const conflictMap = new Map();
  
  // First pass: identify all events
  events.forEach(event => {
    if (!event.time) return; // Skip all-day events
    
    const eventId = event.id.toString();
    const [hours, minutes] = event.time.split(':').map(Number);
    const durationMatch = event.duration?.match(/(\d+)([hm])/);
    const durationHours = durationMatch ? 
      (durationMatch[2] === 'h' ? Number(durationMatch[1]) : Number(durationMatch[1])/60) : 1;
    
    // Calculate start and end times in decimal hours
    const startTime = hours + (minutes / 60);
    const endTime = startTime + durationHours;
    
    if (!conflictMap.has(eventId)) {
      conflictMap.set(eventId, {
        event,
        startTime,
        endTime,
        conflicts: new Set()
      });
    }
  });
  
  // Second pass: detect conflicts
  const entries = Array.from(conflictMap.entries());
  for (let i = 0; i < entries.length; i++) {
    const [id1, data1] = entries[i];
    
    for (let j = i + 1; j < entries.length; j++) {
      const [id2, data2] = entries[j];
      
      // Check if events are on the same day
      if (data1.event.date !== data2.event.date) continue;
      
      // Check for time overlap
      if (
        (data1.startTime >= data2.startTime && data1.startTime < data2.endTime) ||
        (data1.endTime > data2.startTime && data1.endTime <= data2.endTime) ||
        (data1.startTime <= data2.startTime && data1.endTime >= data2.endTime)
      ) {
        // We have a conflict
        data1.conflicts.add(id2);
        data2.conflicts.add(id1);
      }
    }
  }
  
  // Convert to array with conflict count
  return Array.from(conflictMap.values())
    .filter(data => data.conflicts.size > 0)
    .map(data => ({
      ...data.event,
      conflictCount: data.conflicts.size,
      conflictIds: Array.from(data.conflicts)
    }));
};

// Group events by time slots to identify conflicts
export const handleEventConflicts = (events, date) => {
  const timeSlotMap = {};
  
  events.forEach(event => {
    if (event.date !== date.format("YYYY-MM-DD") || !event.time) return;
    
    const [hours, minutes] = event.time.split(':').map(Number);
    const durationMatch = event.duration.match(/(\d+)([hm])/);
    const durationHours = durationMatch ? 
      (durationMatch[2] === 'h' ? Number(durationMatch[1]) : Number(durationMatch[1])/60) : 1;
    
    // Calculate start and end times in decimal hours
    const startTime = hours + (minutes / 60);
    const endTime = startTime + durationHours;
    
    // Create 15-minute time slots for this event
    for (let t = startTime; t < endTime; t += 0.25) {
      const timeSlot = t.toFixed(2);
      if (!timeSlotMap[timeSlot]) {
        timeSlotMap[timeSlot] = [];
      }
      timeSlotMap[timeSlot].push(event);
    }
  });
  
  // Analyze conflicts
  const conflictGroups = {};
  Object.values(timeSlotMap).forEach(eventsInSlot => {
    if (eventsInSlot.length > 1) {
      // We have a conflict
      eventsInSlot.forEach(event => {
        if (!conflictGroups[event.id]) {
          conflictGroups[event.id] = {
            event,
            conflicts: new Set()
          };
        }
        
        // Add all other events in this slot as conflicts
        eventsInSlot.forEach(otherEvent => {
          if (otherEvent.id !== event.id) {
            conflictGroups[event.id].conflicts.add(otherEvent.id);
          }
        });
      });
    }
  });
  
  // Convert to array and add conflict count
  return Object.values(conflictGroups).map(group => ({
    ...group.event,
    conflictCount: group.conflicts.size,
    conflictIds: Array.from(group.conflicts)
  }));
};