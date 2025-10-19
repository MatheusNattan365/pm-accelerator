import axios from 'axios';
import dotenv from 'dotenv';
import { LocationNotFoundError } from '../middleware/error';

dotenv.config();

export interface ZipCodeBaseResult {
  postal_code: string;
  country_code: string;
  latitude: string;
  longitude: string;
  city: string;
  state: string;
  city_en: string;
  state_en: string;
  state_code: string;
  province: string;
  province_code: string;
}

export interface ZipCodeBaseResponse {
  query: {
    codes: string[];
    country: string | null;
  };
  results: {
    [postalCode: string]: ZipCodeBaseResult[];
  };
}

export class ZipCodeBaseService {
  private readonly baseUrl = 'https://app.zipcodebase.com/api/v1';
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.ZIPCODEBASE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('ZIPCODEBASE_API_KEY not found in environment variables');
    }
  }

  /**
   * Search for postal code information
   * @param postalCode - Postal code to search for
   * @returns Array of location results
   */
  async searchPostalCode(postalCode: string): Promise<ZipCodeBaseResult[]> {
    if (!this.apiKey) {
      throw new Error('ZipCodeBase API key not configured');
    }

    try {
      // Normalize postal code (remove spaces, dashes, etc.)
      const normalizedCode = this.normalizePostalCode(postalCode);
      
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          codes: normalizedCode,
          apikey: this.apiKey
        },
        timeout: 10000
      });

      const data: ZipCodeBaseResponse = response.data;
      
      if (data.results && data.results[normalizedCode]) {
        return data.results[normalizedCode];
      }
      
      return [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new LocationNotFoundError(postalCode);
        }
        if (error.response?.status === 401) {
          throw new Error('Invalid ZipCodeBase API key');
        }
        if (error.response?.status === 429) {
          throw new Error('ZipCodeBase API rate limit exceeded');
        }
        throw new Error(`ZipCodeBase API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Normalize postal code format
   * @param postalCode - Raw postal code
   * @returns Normalized postal code
   */
  private normalizePostalCode(postalCode: string): string {
    // Remove all non-numeric characters for Brazilian CEP
    const cleaned = postalCode.replace(/\D/g, '');
    
    // For Brazilian CEP (8 digits), format as XXXXX-XXX
    if (cleaned.length === 8) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }
    
    // For other formats, return as is
    return cleaned;
  }

  /**
   * Check if the service is available
   * @returns True if API key is configured
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get the best result from multiple results
   * @param results - Array of results
   * @returns Best result or first result
   */
  getBestResult(results: ZipCodeBaseResult[]): ZipCodeBaseResult | null {
    if (!results || results.length === 0) {
      return null;
    }

    // If only one result, return it
    if (results.length === 1) {
      return results[0];
    }

    // Prefer results with more complete information
    const scoredResults = results.map(result => ({
      result,
      score: this.calculateResultScore(result)
    }));

    // Sort by score (higher is better) and return the best
    scoredResults.sort((a, b) => b.score - a.score);
    return scoredResults[0].result;
  }

  /**
   * Calculate a score for result quality
   * @param result - ZipCodeBase result
   * @returns Score (higher is better)
   */
  private calculateResultScore(result: ZipCodeBaseResult): number {
    let score = 0;

    // Prefer results with city name
    if (result.city && result.city.trim()) {
      score += 10;
    }

    // Prefer results with state name
    if (result.state && result.state.trim()) {
      score += 8;
    }

    // Prefer results with province information
    if (result.province && result.province.trim()) {
      score += 5;
    }

    // Prefer results with valid coordinates
    if (result.latitude && result.longitude) {
      const lat = parseFloat(result.latitude);
      const lon = parseFloat(result.longitude);
      if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        score += 15;
      }
    }

    // Prefer results with country code
    if (result.country_code && result.country_code.trim()) {
      score += 3;
    }

    return score;
  }
}
