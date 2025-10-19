/**
 * Date utility functions for handling timezone issues
 */

/**
 * Normalize date string to ensure consistent timezone handling
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Normalized date string
 */
export function normalizeDateString(dateString: string): string {
  if (!dateString || typeof dateString !== 'string') {
    throw new Error('Invalid date string');
  }

  // Ensure the date string is in YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    throw new Error('Date must be in YYYY-MM-DD format');
  }

  // Parse the date and ensure it's treated as UTC to avoid timezone issues
  const date = new Date(dateString + 'T00:00:00.000Z');
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }

  // Return the date in YYYY-MM-DD format
  return date.toISOString().split('T')[0];
}

/**
 * Adjust date for timezone to prevent off-by-one day issues
 * @param dateString - Date string in YYYY-MM-DD format
 * @param timezone - Timezone offset in hours (optional)
 * @returns Adjusted date string
 */
export function adjustDateForTimezone(dateString: string, timezone?: number): string {
  const normalizedDate = normalizeDateString(dateString);
  
  if (timezone === undefined) {
    // If no timezone provided, return the normalized date
    return normalizedDate;
  }

  // Create date object in UTC
  const date = new Date(normalizedDate + 'T00:00:00.000Z');
  
  // Adjust for timezone offset
  const adjustedDate = new Date(date.getTime() + (timezone * 60 * 60 * 1000));
  
  return adjustedDate.toISOString().split('T')[0];
}

/**
 * Get timezone offset for a location
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Timezone offset in hours
 */
export function getTimezoneOffset(lat: number, lon: number): number {
  // Simple timezone estimation based on longitude
  // This is a rough approximation - for production, use a proper timezone library
  const timezoneOffset = Math.round(lon / 15);
  
  // Clamp to valid range (-12 to +14)
  return Math.max(-12, Math.min(14, timezoneOffset));
}

/**
 * Validate date range
 * @param startDate - Start date string
 * @param endDate - End date string
 * @returns True if valid range
 */
export function validateDateRange(startDate: string, endDate: string): boolean {
  try {
    const start = new Date(normalizeDateString(startDate) + 'T00:00:00.000Z');
    const end = new Date(normalizeDateString(endDate) + 'T00:00:00.000Z');
    
    return start <= end;
  } catch (error) {
    return false;
  }
}

/**
 * Check if date is in the future
 * @param dateString - Date string
 * @returns True if future date
 */
export function isFutureDate(dateString: string): boolean {
  try {
    const inputDate = new Date(normalizeDateString(dateString) + 'T00:00:00.000Z');
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Reset time to start of day in UTC
    
    return inputDate > today;
  } catch (error) {
    return false;
  }
}

/**
 * Format date for API calls
 * @param dateString - Date string
 * @returns Formatted date for API
 */
export function formatDateForAPI(dateString: string): string {
  return normalizeDateString(dateString);
}
