import { Router, Request, Response } from 'express';
import { searchSchema, SearchRequest } from '../validators/schemas';
import { GeocodingService } from '../services/geocode.service';
import { WeatherService } from '../services/weather.service';
import { YouTubeService } from '../services/youtube.service';
import { Record, IRecord } from '../models/Record';
import { asyncHandler, CustomError, LocationNotFoundError } from '../middleware/error';
import { normalizeDateString } from '../utils/dateUtils';

const router = Router();
const geocodingService = new GeocodingService();
const weatherService = new WeatherService();
const youtubeService = new YouTubeService(process.env.YOUTUBE_API_URL || 'http://yt-scraper:8000');

/**
 * POST /api/weather/search
 * Search for weather data by location
 */
router.post('/search', asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData: SearchRequest = searchSchema.parse(req.body);
  const { location, locationType, start, end } = validatedData;

  // Resolve location
  const resolvedLocation = await geocodingService.resolveLocation(location, locationType);

  // Normalize dates to prevent timezone issues
  const normalizedStart = start ? normalizeDateString(start) : undefined;
  const normalizedEnd = end ? normalizeDateString(end) : undefined;

  // Fetch weather data
  const weatherData = await weatherService.fetchWeatherData({
    location: resolvedLocation,
    startDate: normalizedStart,
    endDate: normalizedEnd
  });

  // Only fetch YouTube suggestions if location was successfully resolved
  let youtubeSuggestions: any[] = [];
  if (resolvedLocation && resolvedLocation.name) {
    try {
      youtubeSuggestions = await youtubeService.searchThingsToDo(resolvedLocation.name, 5);
    } catch (error) {
      console.error('Failed to fetch YouTube suggestions:', error);
      // Continue without YouTube suggestions - don't fail the entire request
    }
  }

  // Create record in database
  const record = new Record({
    queryRaw: location,
    location: resolvedLocation,
    dateRange: {
      start: normalizedStart || null,
      end: normalizedEnd || null
    },
    snapshot: weatherData,
    youtubeSuggestions: youtubeSuggestions
  });

  const savedRecord = await record.save();

  // Return response
  res.status(201).json({
    success: true,
    data: {
      record: {
        id: savedRecord._id,
        queryRaw: savedRecord.queryRaw,
        location: savedRecord.location,
        dateRange: savedRecord.dateRange,
        snapshot: savedRecord.snapshot,
        youtubeSuggestions: savedRecord.youtubeSuggestions,
        title: savedRecord.title,
        notes: savedRecord.notes,
        createdAt: savedRecord.createdAt,
        updatedAt: savedRecord.updatedAt
      },
      weather: weatherData
    }
  });
}));

/**
 * GET /api/weather/current/:location
 * Get current weather for a location (without saving to database)
 * Query parameter: ?locationType=auto|coordinates|zipcode|landmark|city|address
 */
router.get('/current/:location(*)', asyncHandler(async (req: Request, res: Response) => {
  const { location } = req.params;
  const { locationType } = req.query;
  
  if (!location) {
    throw new CustomError('Location parameter is required', 400);
  }

  // Decode URL-encoded location
  const decodedLocation = decodeURIComponent(location);

  // Resolve location with optional type hint
  const resolvedLocation = await geocodingService.resolveLocation(
    decodedLocation, 
    locationType as string
  );

  // Fetch current weather only
  const weatherData = await weatherService.fetchWeatherData({
    location: resolvedLocation
  });

  res.json({
    success: true,
    data: {
      location: resolvedLocation,
      weather: weatherData
    }
  });
}));

/**
 * GET /api/weather/coordinates/:lat/:lon
 * Get weather for specific coordinates (without saving to database)
 */
router.get('/coordinates/:lat/:lon', asyncHandler(async (req: Request, res: Response) => {
  const { lat, lon } = req.params;
  
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  
  if (isNaN(latitude) || isNaN(longitude)) {
    throw new CustomError('Invalid coordinates. Must be valid numbers.', 400);
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new CustomError('Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.', 400);
  }

  // Create location object from coordinates
  const location = {
    name: `${latitude},${longitude}`,
    country: 'Unknown',
    admin1: 'Unknown',
    lat: latitude,
    lon: longitude,
    resolvedBy: 'coords' as const
  };

  // Fetch weather data
  const weatherData = await weatherService.fetchWeatherData({
    location
  });

  res.json({
    success: true,
    data: {
      location,
      weather: weatherData
    }
  });
}));

/**
 * GET /api/weather/geocode/:location
 * Get geocoding information for a location (without saving to database)
 * Query parameter: ?locationType=auto|coordinates|zipcode|landmark|city|address
 */
router.get('/geocode/:location(*)', asyncHandler(async (req: Request, res: Response) => {
  const { location } = req.params;
  const { locationType } = req.query;
  
  if (!location) {
    throw new CustomError('Location parameter is required', 400);
  }

  // Decode URL-encoded location
  const decodedLocation = decodeURIComponent(location);

  // Resolve location with optional type hint
  const resolvedLocation = await geocodingService.resolveLocation(
    decodedLocation, 
    locationType as string
  );

  res.json({
    success: true,
    data: {
      query: decodedLocation,
      location: resolvedLocation
    }
  });
}));

export default router;
