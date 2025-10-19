import { z } from 'zod';

// Date validation helper with timezone handling
const dateString = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => {
    // Validate that the date is a valid date
    const parsed = new Date(date + 'T00:00:00.000Z');
    return !isNaN(parsed.getTime());
  }, 'Invalid date format')
  .refine((date) => {
    // Ensure date is not in the future beyond reasonable limits
    const parsed = new Date(date + 'T00:00:00.000Z');
    const today = new Date();
    const maxFuture = new Date();
    maxFuture.setFullYear(today.getFullYear() + 1); // Allow up to 1 year in future
    return parsed <= maxFuture;
  }, 'Date cannot be more than 1 year in the future');

// Location type enum
export const locationTypeEnum = z.enum([
  'auto',        // Automatic detection (default)
  'coordinates', // GPS coordinates
  'zipcode',     // Postal/ZIP code
  'landmark',    // Point of interest
  'city',        // City name
  'address'      // Full address
]);

// Search schema for weather endpoint
export const searchSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  locationType: locationTypeEnum.optional().default('auto'),
  start: dateString.optional(),
  end: dateString.optional()
}).refine((data) => {
  // If one date is provided, both must be provided
  if ((data.start && !data.end) || (!data.start && data.end)) {
    return false;
  }
  return true;
}, {
  message: 'Both start and end dates must be provided together, or neither',
  path: ['start', 'end']
}).refine((data) => {
  // If both dates are provided, start must be <= end
  if (data.start && data.end) {
    return data.start <= data.end;
  }
  return true;
}, {
  message: 'Start date must be before or equal to end date',
  path: ['start', 'end']
});

// Update record schema
export const updateRecordSchema = z.object({
  name: z.string().max(200, 'Name must be 200 characters or less').optional(),
  country: z.string().max(200, 'Country must be 200 characters or less').optional(),
  admin1: z.string().max(200, 'Admin1 must be 200 characters or less').optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  resolvedBy: z.enum(['coords', 'geocoding', 'zipcode', 'landmark']).optional()
});

// Query parameters for records list
export const recordsQuerySchema = z.object({
  q: z.string().optional(),
  from: dateString.optional(),
  to: dateString.optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').transform(Number).optional()
}).refine((data) => {
  if (data.from && data.to) {
    return data.from <= data.to;
  }
  return true;
}, {
  message: 'From date must be before or equal to to date',
  path: ['from', 'to']
});

// Export query parameters
export const exportQuerySchema = z.object({
  format: z.enum(['json', 'csv', 'md']).default('json')
});

// Export body schema
export const exportBodySchema = z.object({
  recordIds: z.array(z.string().min(1, 'Record ID cannot be empty')).min(1, 'At least one record ID is required')
});

// PDF export schema
export const pdfExportSchema = z.object({
  recordIds: z.array(z.string().min(1, 'Record ID cannot be empty')).min(1, 'At least one record ID is required'),
  title: z.string().max(100, 'Title must be 100 characters or less').optional(),
  includeWeatherData: z.boolean().optional().default(true),
  includeLocationDetails: z.boolean().optional().default(true),
  includeYouTubeSuggestions: z.boolean().optional().default(true)
});

// Type exports
export type SearchRequest = z.infer<typeof searchSchema>;
export type UpdateRecordRequest = z.infer<typeof updateRecordSchema>;
export type RecordsQueryRequest = z.infer<typeof recordsQuerySchema>;
export type ExportQueryRequest = z.infer<typeof exportQuerySchema>;
export type PDFExportRequest = z.infer<typeof pdfExportSchema>;
