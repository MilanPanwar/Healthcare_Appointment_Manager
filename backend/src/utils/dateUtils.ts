/**
 * Parses time string like "09:00" or "14:30" into total minutes from start of day
 */
export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Converts total minutes from start of day to "HH:MM" format (24-hour)
 */
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Generates regular interval slots between startTime and endTime
 */
export const generateSlots = (
  startTime: string,
  endTime: string,
  durationMinutes: number
): { startTime: string; endTime: string }[] => {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const slots: { startTime: string; endTime: string }[] = [];

  let current = startMin;
  while (current + durationMinutes <= endMin) {
    slots.push({
      startTime: minutesToTime(current),
      endTime: minutesToTime(current + durationMinutes),
    });
    current += durationMinutes;
  }

  return slots;
};

/**
 * Normalizes a date string "YYYY-MM-DD" to start of UTC day Date object
 */
export const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

/**
 * Formats Date to "YYYY-MM-DD" string
 */
export const formatDateToIso = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Calculates day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 */
export const getDayOfWeek = (date: Date): number => {
  return date.getUTCDay();
};
