import axios from 'axios';
import { ILocation } from '../models/Record';
import { ZipCodeBaseService } from './zipcodebase.service';
import { NominatimService } from './nominatim.service';
import { FallbackGeocodeService } from './fallback-geocode.service';
import { LocationNotFoundError } from '../middleware/error';

export interface GeocodingResult {
  name: string;
  country: string;
  admin1: string;
  lat: number;
  lon: number;
}

export interface LocationInput {
  type: 'coordinates' | 'zipcode' | 'landmark' | 'city' | 'address' | 'unknown';
  value: string;
  normalized?: string;
}

export class GeocodingService {
  private readonly baseUrl = 'https://geocoding-api.open-meteo.com/v1';
  private readonly zipCodeBaseService: ZipCodeBaseService;
  private readonly nominatimService: NominatimService;
  private readonly fallbackGeocodeService: FallbackGeocodeService;

  constructor() {
    this.zipCodeBaseService = new ZipCodeBaseService();
    this.nominatimService = new NominatimService();
    this.fallbackGeocodeService = new FallbackGeocodeService();
  }

  /**
   * Resolve location from input string
   * @param input - Location input (can be coordinates, zipcode, landmark, city, address, etc.)
   * @param locationType - Optional location type hint ('auto', 'coordinates', 'zipcode', 'landmark', 'city', 'address')
   * @returns Resolved location information
   */
  async resolveLocation(input: string, locationType?: string): Promise<ILocation> {
    const trimmedInput = input.trim();
    
    // If locationType is provided and not 'auto', use it directly
    if (locationType && locationType !== 'auto') {
      const locationInput: LocationInput = {
        type: locationType as any,
        value: trimmedInput,
        normalized: trimmedInput
      };
      
      // Normalize based on type if needed
      if (locationType === 'coordinates') {
        locationInput.normalized = this.normalizeCoordinates(trimmedInput);
      } else if (locationType === 'zipcode') {
        locationInput.normalized = this.normalizeZipCode(trimmedInput);
      }
      
      return this.resolveByType(locationInput);
    }
    
    // Otherwise, use automatic detection
    const locationInput = this.detectLocationType(trimmedInput);
    return this.resolveByType(locationInput);
  }

  /**
   * Resolve location by type
   * @param locationInput - Location input object
   * @returns Resolved location
   */
  private resolveByType(locationInput: LocationInput): Promise<ILocation> {
    switch (locationInput.type) {
      case 'coordinates':
        return this.resolveCoordinates(locationInput);
      case 'zipcode':
        return this.resolveZipCode(locationInput);
      case 'landmark':
      case 'city':
      case 'address':
      case 'unknown':
      default:
        return this.resolveTextLocation(locationInput);
    }
  }

  /**
   * Detect the type of location input
   * @param input - Raw input string
   * @returns LocationInput object with detected type
   */
  private detectLocationType(input: string): LocationInput {
    const trimmed = input.trim();
    
    // Check for coordinates (various formats)
    if (this.isCoordinates(trimmed)) {
      return {
        type: 'coordinates',
        value: trimmed,
        normalized: this.normalizeCoordinates(trimmed)
      };
    }
    
    // Check for zip/postal code
    if (this.isZipCode(trimmed)) {
      return {
        type: 'zipcode',
        value: trimmed,
        normalized: this.normalizeZipCode(trimmed)
      };
    }
    
    // Check for landmark indicators
    if (this.isLandmark(trimmed)) {
      return {
        type: 'landmark',
        value: trimmed,
        normalized: trimmed
      };
    }
    
    // Check for city indicators
    if (this.isCity(trimmed)) {
      return {
        type: 'city',
        value: trimmed,
        normalized: trimmed
      };
    }
    
    // Default to address/text search
    return {
      type: 'address',
      value: trimmed,
      normalized: trimmed
    };
  }

  /**
   * Check if input is coordinates
   * @param input - Input string
   * @returns True if coordinates
   */
  private isCoordinates(input: string): boolean {
    // Decimal degrees: -23.5505,-46.6333 or 23.5505,46.6333
    const decimalPattern = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/;
    
    // DMS format: 23°33'1.8"S 46°37'59.9"W
    const dmsPattern = /^\d+°\d+['′]\d*\.?\d*["″]?[NS]\s+\d+°\d+['′]\d*\.?\d*["″]?[EW]$/i;
    
    // Alternative coordinate formats
    const altPattern = /^(-?\d+\.?\d*)\s*[,;]\s*(-?\d+\.?\d*)$/;
    
    return decimalPattern.test(input) || dmsPattern.test(input) || altPattern.test(input);
  }

  /**
   * Check if input is a zip/postal code
   * @param input - Input string
   * @returns True if zip code
   */
  private isZipCode(input: string): boolean {
    // US ZIP: 12345 or 12345-6789
    const usZip = /^\d{5}(-\d{4})?$/;
    
    // Brazilian CEP: 12345-678 or 12345678
    const brCep = /^\d{5}-?\d{3}$/;
    
    // UK Postcode: SW1A 1AA, M1 1AA, etc.
    const ukPostcode = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
    
    // Canadian Postal Code: K1A 0A6
    const caPostcode = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i;
    
    // Generic numeric postal codes (5-10 digits)
    const genericZip = /^\d{5,10}$/;
    
    return usZip.test(input) || brCep.test(input) || ukPostcode.test(input) || 
           caPostcode.test(input) || genericZip.test(input);
  }

  /**
   * Check if input is a landmark
   * @param input - Input string
   * @returns True if landmark
   */
  private isLandmark(input: string): boolean {
    const landmarkKeywords = [
      'airport', 'station', 'hospital', 'university', 'college', 'school',
      'museum', 'park', 'plaza', 'square', 'mall', 'center', 'centre',
      'tower', 'bridge', 'monument', 'cathedral', 'church', 'temple',
      'stadium', 'arena', 'theater', 'theatre', 'cinema', 'hotel',
      'restaurant', 'cafe', 'bar', 'club', 'gym', 'library'
    ];
    
    const lowerInput = input.toLowerCase();
    return landmarkKeywords.some(keyword => lowerInput.includes(keyword));
  }

  /**
   * Check if input is a city
   * @param input - Input string
   * @returns True if city
   */
  private isCity(input: string): boolean {
    // Simple heuristic: if it's short and doesn't contain numbers, likely a city
    const words = input.split(/\s+/);
    return words.length <= 3 && !/\d/.test(input) && words.every(word => word.length > 1);
  }

  /**
   * Normalize coordinates to decimal format
   * @param input - Coordinate string
   * @returns Normalized coordinate string
   */
  private normalizeCoordinates(input: string): string {
    // Handle DMS format (basic conversion)
    const dmsMatch = input.match(/^(\d+)°(\d+)['′](\d*\.?\d*)["″]?([NS])\s+(\d+)°(\d+)['′](\d*\.?\d*)["″]?([EW])$/i);
    if (dmsMatch) {
      const [, latDeg, latMin, latSec, latDir, lonDeg, lonMin, lonSec, lonDir] = dmsMatch;
      
      let lat = parseFloat(latDeg) + parseFloat(latMin) / 60 + parseFloat(latSec || '0') / 3600;
      let lon = parseFloat(lonDeg) + parseFloat(lonMin) / 60 + parseFloat(lonSec || '0') / 3600;
      
      if (latDir.toUpperCase() === 'S') lat = -lat;
      if (lonDir.toUpperCase() === 'W') lon = -lon;
      
      return `${lat},${lon}`;
    }
    
    // Handle alternative separators
    const altMatch = input.match(/^(-?\d+\.?\d*)\s*[,;]\s*(-?\d+\.?\d*)$/);
    if (altMatch) {
      return `${altMatch[1]},${altMatch[2]}`;
    }
    
    return input;
  }

  /**
   * Normalize zip code format
   * @param input - Zip code string
   * @returns Normalized zip code
   */
  private normalizeZipCode(input: string): string {
    // Remove spaces and normalize separators
    return input.replace(/\s+/g, '').replace(/-/g, '-');
  }

  /**
   * Resolve coordinates to location
   * @param locationInput - Location input object
   * @returns Resolved location
   */
  private async resolveCoordinates(locationInput: LocationInput): Promise<ILocation> {
    const coords = locationInput.normalized!.split(',');
    const lat = parseFloat(coords[0]);
    const lon = parseFloat(coords[1]);
    
    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      throw new Error('Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.');
    }
    
    // For coordinates, we need to reverse geocode to get detailed location information
    try {
      const locationDetails = await this.reverseGeocode(lat, lon);
      return {
        name: locationDetails.name,
        country: locationDetails.country,
        admin1: locationDetails.admin1,
        lat,
        lon,
        resolvedBy: 'coords'
      };
    } catch (error) {
      // If reverse geocoding fails, use coordinates as name
      return {
        name: `${lat},${lon}`,
        country: 'Unknown',
        admin1: 'Unknown',
        lat,
        lon,
        resolvedBy: 'coords'
      };
    }
  }

  /**
   * Resolve zip code to location
   * @param locationInput - Location input object
   * @returns Resolved location
   */
  private async resolveZipCode(locationInput: LocationInput): Promise<ILocation> {
    // First try ZipCodeBase if available
    if (this.zipCodeBaseService.isAvailable()) {
      try {
        const results = await this.zipCodeBaseService.searchPostalCode(locationInput.normalized!);
        const bestResult = this.zipCodeBaseService.getBestResult(results);
        
        if (bestResult) {
          return {
            name: this.buildLocationNameFromZipCodeBase(bestResult),
            country: this.getCountryName(bestResult.country_code),
            admin1: bestResult.state || bestResult.state_en || 'Unknown',
            lat: parseFloat(bestResult.latitude),
            lon: parseFloat(bestResult.longitude),
            resolvedBy: 'zipcode' as const
          };
        }
      } catch (error) {
        console.warn('ZipCodeBase lookup failed, falling back to Open-Meteo:', error);
        // Fall through to Open-Meteo fallback
      }
    }
    
    // Fallback to Open-Meteo geocoding
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          name: locationInput.normalized,
          count: 1,
          language: 'en',
          format: 'json'
        },
        timeout: 10000
      });
      
      if (!response.data.results || response.data.results.length === 0) {
        throw new LocationNotFoundError(locationInput.value);
      }
      
      const result = response.data.results[0];
      return {
        name: result.name || locationInput.value,
        country: result.country || 'Unknown',
        admin1: result.admin1 || 'Unknown',
        lat: result.latitude,
        lon: result.longitude,
        resolvedBy: 'zipcode' as const
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404 || error.response?.status === 400) {
          throw new LocationNotFoundError(locationInput.value);
        }
        throw new Error(`Geocoding service error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Build location name from ZipCodeBase result
   * @param result - ZipCodeBase result
   * @returns Formatted location name
   */
  private buildLocationNameFromZipCodeBase(result: any): string {
    const parts = [];
    
    if (result.city && result.city.trim()) {
      parts.push(result.city);
    }
    
    if (result.state && result.state.trim() && result.state !== result.city) {
      parts.push(result.state);
    }
    
    if (result.province && result.province.trim() && result.province !== result.city && result.province !== result.state) {
      parts.push(result.province);
    }
    
    if (result.country_code && result.country_code.trim()) {
      parts.push(this.getCountryName(result.country_code));
    }
    
    return parts.length > 0 ? parts.join(', ') : result.postal_code;
  }

  /**
   * Get country name from country code
   * @param countryCode - Two-letter country code
   * @returns Country name
   */
  private getCountryName(countryCode: string): string {
    const countryMap: { [key: string]: string } = {
      'BR': 'Brazil',
      'US': 'United States',
      'CA': 'Canada',
      'GB': 'United Kingdom',
      'FR': 'France',
      'DE': 'Germany',
      'IT': 'Italy',
      'ES': 'Spain',
      'PT': 'Portugal',
      'JP': 'Japan',
      'CN': 'China',
      'IN': 'India',
      'AU': 'Australia',
      'MX': 'Mexico',
      'AR': 'Argentina',
      'CL': 'Chile',
      'CO': 'Colombia',
      'PE': 'Peru',
      'VE': 'Venezuela',
      'UY': 'Uruguay',
      'PY': 'Paraguay',
      'BO': 'Bolivia',
      'EC': 'Ecuador',
      'GY': 'Guyana',
      'SR': 'Suriname',
      'GF': 'French Guiana'
    };
    
    return countryMap[countryCode.toUpperCase()] || countryCode;
  }

  /**
   * Resolve text location (landmark, city, address)
   * @param locationInput - Location input object
   * @returns Resolved location
   */
  private async resolveTextLocation(locationInput: LocationInput): Promise<ILocation> {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          name: locationInput.normalized,
          count: 1,
          language: 'en',
          format: 'json'
        },
        timeout: 10000
      });
      
      if (!response.data.results || response.data.results.length === 0) {
        console.log(`Primary geocoding failed for "${locationInput.value}", trying fallback service...`);
        try {
          const fallbackResult = await this.fallbackGeocodeService.searchWithVariations(locationInput.value);
          console.log(`Fallback geocoding successful for "${locationInput.value}"`);
          return fallbackResult;
        } catch (fallbackError) {
          console.error(`Fallback geocoding also failed for "${locationInput.value}":`, fallbackError);
          throw new LocationNotFoundError(locationInput.value);
        }
      }
      
      const result = response.data.results[0];
      return {
        name: result.name || 'Unknown',
        country: result.country || 'Unknown',
        admin1: result.admin1 || 'Unknown',
        lat: result.latitude,
        lon: result.longitude,
        resolvedBy: locationInput.type === 'landmark' ? 'landmark' as const : 'geocoding' as const
      };
    } catch (error: any) {
      throw new Error(`Geocoding service error: ${error.message}`);
    }
  }

  /**
   * Reverse geocode coordinates to get detailed location information
   * @param lat - Latitude
   * @param lon - Longitude
   * @returns Detailed location information
   */
  private async reverseGeocode(lat: number, lon: number): Promise<{
    name: string;
    country: string;
    admin1: string;
    admin2?: string;
    admin3?: string;
  }> {
    // First try Nominatim for more detailed information
    try {
      const nominatimResult = await this.nominatimService.reverseGeocode(lat, lon);
      
      if (nominatimResult) {
        return {
          name: this.nominatimService.buildLocationName(nominatimResult),
          country: this.nominatimService.getCountryName(nominatimResult),
          admin1: this.nominatimService.getStateName(nominatimResult),
          admin2: this.nominatimService.getCityName(nominatimResult),
          admin3: nominatimResult.address.suburb
        };
      }
    } catch (error) {
      console.warn('Nominatim reverse geocoding failed, falling back to Open-Meteo:', error);
      // Fall through to Open-Meteo fallback
    }

    // Fallback to Open-Meteo geocoding
    try {
      // First try with a broader search to get more results
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          latitude: lat,
          longitude: lon,
          count: 5, // Get more results to find the best match
          language: 'en',
          format: 'json'
        },
        timeout: 10000
      });
      
      if (response.data.results && response.data.results.length > 0) {
        // Find the best result (prefer cities, then towns, then other locations)
        const results = response.data.results;
        let bestResult = results[0];
        
        // Look for a city or town result
        for (const result of results) {
          if (result.feature_code === 'PPL' || result.feature_code === 'PPLA' || result.feature_code === 'PPLA2') {
            bestResult = result;
            break;
          }
        }
        
        // Build a more descriptive location name
        const locationParts = [];
        
        // Add city/town name
        if (bestResult.name) {
          locationParts.push(bestResult.name);
        }
        
        // Add admin2 (city/municipality) if different from name and more specific
        if (bestResult.admin2 && bestResult.admin2 !== bestResult.name && 
            bestResult.admin2 !== bestResult.admin1) {
          locationParts.push(bestResult.admin2);
        }
        
        // Add admin1 (state/province) if available
        if (bestResult.admin1) {
          locationParts.push(bestResult.admin1);
        }
        
        // Add country if available
        if (bestResult.country) {
          locationParts.push(bestResult.country);
        }
        
        const locationName = locationParts.length > 0 
          ? locationParts.join(', ') 
          : `${lat},${lon}`;
        
        return {
          name: locationName,
          country: bestResult.country || 'Unknown',
          admin1: bestResult.admin1 || 'Unknown',
          admin2: bestResult.admin2,
          admin3: bestResult.admin3
        };
      }
      
      // If no results, try a fallback search with a wider radius
      return await this.fallbackReverseGeocode(lat, lon);
    } catch (error) {
      // Fallback on error
      return {
        name: `${lat},${lon}`,
        country: 'Unknown',
        admin1: 'Unknown'
      };
    }
  }

  /**
   * Fallback reverse geocoding with wider search
   * @param lat - Latitude
   * @param lon - Longitude
   * @returns Fallback location information
   */
  private async fallbackReverseGeocode(lat: number, lon: number): Promise<{
    name: string;
    country: string;
    admin1: string;
  }> {
    try {
      // Try searching for nearby locations within a reasonable radius
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          name: `${lat},${lon}`,
          count: 3,
          language: 'en',
          format: 'json'
        },
        timeout: 10000
      });
      
      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          name: result.name || `${lat},${lon}`,
          country: result.country || 'Unknown',
          admin1: result.admin1 || 'Unknown'
        };
      }
    } catch (error) {
      // Ignore fallback errors
    }
    
    // Final fallback
    return {
      name: `${lat},${lon}`,
      country: 'Unknown',
      admin1: 'Unknown'
    };
  }

  /**
   * Validate coordinates
   * @param lat - Latitude
   * @param lon - Longitude
   * @returns True if valid
   */
  static validateCoordinates(lat: number, lon: number): boolean {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }
}
