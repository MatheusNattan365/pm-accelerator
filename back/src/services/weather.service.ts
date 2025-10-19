import axios from 'axios';
import { ILocation } from '../models/Record';
import { normalizeDateString, formatDateForAPI } from '../utils/dateUtils';

export interface WeatherData {
  current?: any;
  daily?: any;
  source: 'open-meteo';
}

export interface WeatherParams {
  location: ILocation;
  startDate?: string;
  endDate?: string;
}

export class WeatherService {
  private readonly forecastUrl = 'https://api.open-meteo.com/v1/forecast';
  private readonly archiveUrl = 'https://archive-api.open-meteo.com/v1/era5';

  /**
   * Fetch weather data based on location and date range
   * @param params - Weather parameters
   * @returns Weather data
   */
  async fetchWeatherData(params: WeatherParams): Promise<WeatherData> {
    const { location, startDate, endDate } = params;
    
    if (startDate && endDate) {
      // Fetch historical data for date range
      return this.fetchHistoricalWeather(location, startDate, endDate);
    } else {
      // Fetch current weather and 5-day forecast
      return this.fetchCurrentAndForecast(location);
    }
  }

  /**
   * Fetch current weather and 5-day forecast
   * @param location - Location information
   * @returns Current and forecast weather data
   */
  private async fetchCurrentAndForecast(location: ILocation): Promise<WeatherData> {
    try {
      const response = await axios.get(this.forecastUrl, {
        params: {
          latitude: location.lat,
          longitude: location.lon,
          current: [
            'temperature_2m',
            'relative_humidity_2m',
            'apparent_temperature',
            'wind_speed_10m',
            'wind_gusts_10m',
            'precipitation',
            'weather_code'
          ].join(','),
          daily: [
            'weather_code',
            'temperature_2m_max',
            'temperature_2m_min',
            'precipitation_probability_max',
            'sunrise',
            'sunset',
            'uv_index_max'
          ].join(','),
          timezone: 'auto',
          forecast_days: 5
        },
        timeout: 15000
      });

      const data = response.data;
      
      // Trim daily array to max 5 items
      if (data.daily && data.daily.time) {
        const maxItems = Math.min(5, data.daily.time.length);
        const trimmedDaily: any = {};
        
        Object.keys(data.daily).forEach(key => {
          if (Array.isArray((data.daily as any)[key])) {
            trimmedDaily[key] = (data.daily as any)[key].slice(0, maxItems);
          }
        });
        
        data.daily = trimmedDaily;
      }

      return {
        current: data.current || null,
        daily: data.daily || null,
        source: 'open-meteo'
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Weather service error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Fetch historical weather data for date range
   * @param location - Location information
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Historical weather data
   */
  private async fetchHistoricalWeather(
    location: ILocation,
    startDate: string,
    endDate: string
  ): Promise<WeatherData> {
    try {
      // Normalize dates to prevent timezone issues
      const normalizedStartDate = formatDateForAPI(startDate);
      const normalizedEndDate = formatDateForAPI(endDate);
      
      // First try the forecast API (for recent dates)
      let response;
      try {
        response = await axios.get(this.forecastUrl, {
          params: {
            latitude: location.lat,
            longitude: location.lon,
            daily: [
              'weather_code',
              'temperature_2m_max',
              'temperature_2m_min',
              'precipitation_probability_max',
              'sunrise',
              'sunset',
              'uv_index_max'
            ].join(','),
            start_date: normalizedStartDate,
            end_date: normalizedEndDate,
            timezone: 'auto'
          },
          timeout: 15000
        });
      } catch (forecastError) {
        // If forecast API fails or returns no data, try archive API
        response = await axios.get(this.archiveUrl, {
          params: {
            latitude: location.lat,
            longitude: location.lon,
            daily: [
              'weather_code',
              'temperature_2m_max',
              'temperature_2m_min',
              'precipitation_probability_max',
              'sunrise',
              'sunset',
              'uv_index_max'
            ].join(','),
            start_date: normalizedStartDate,
            end_date: normalizedEndDate,
            timezone: 'auto'
          },
          timeout: 15000
        });
      }

      const data = response.data;
      
      return {
        current: null,
        daily: data.daily || null,
        source: 'open-meteo'
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Historical weather service error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Validate date format and range
   * @param startDate - Start date
   * @param endDate - End date
   * @returns True if valid
   */
  static validateDateRange(startDate: string, endDate: string): boolean {
    try {
      const normalizedStart = normalizeDateString(startDate);
      const normalizedEnd = normalizeDateString(endDate);
      
      const start = new Date(normalizedStart + 'T00:00:00.000Z');
      const end = new Date(normalizedEnd + 'T00:00:00.000Z');
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return false;
      }
      
      // Check if start is before or equal to end
      return start <= end;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if date is in the future
   * @param date - Date string
   * @returns True if future date
   */
  static isFutureDate(date: string): boolean {
    try {
      const normalizedDate = normalizeDateString(date);
      const inputDate = new Date(normalizedDate + 'T00:00:00.000Z');
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0); // Reset time to start of day in UTC
      return inputDate > today;
    } catch (error) {
      return false;
    }
  }
}
