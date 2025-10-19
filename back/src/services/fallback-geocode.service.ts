import axios from 'axios';
import { ILocation } from '../models/Record';

export interface FallbackGeocodeResult {
  name: string;
  country: string;
  admin1: string;
  lat: number;
  lon: number;
  resolvedBy: 'fallback-geocoding';
}

export class FallbackGeocodeService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org';

  /**
   * Search for location using Nominatim as fallback
   * @param query - Location query string
   * @returns Promise<ILocation> - Resolved location
   */
  async searchLocation(query: string): Promise<ILocation> {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          q: query,
          format: 'json',
          limit: 1,
          addressdetails: 1,
          'accept-language': 'en'
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Weather-API/1.0'
        }
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No results found');
      }

      const result = response.data[0];
      
      return {
        name: this.buildLocationName(result),
        country: this.getCountryName(result),
        admin1: this.getStateName(result),
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        resolvedBy: 'geocoding' as const
      };
    } catch (error) {
      console.error('Fallback geocoding failed:', error);
      throw error;
    }
  }

  /**
   * Build location name from Nominatim result
   * @param result - Nominatim result
   * @returns Formatted location name
   */
  private buildLocationName(result: any): string {
    const address = result.address || {};
    const parts = [];

    // Try to build a meaningful location name
    if (address.city) {
      parts.push(address.city);
    } else if (address.town) {
      parts.push(address.town);
    } else if (address.village) {
      parts.push(address.village);
    } else if (address.hamlet) {
      parts.push(address.hamlet);
    } else if (address.municipality) {
      parts.push(address.municipality);
    } else if (result.display_name) {
      // Fallback to display name and extract first part
      const displayParts = result.display_name.split(',');
      if (displayParts.length > 0) {
        parts.push(displayParts[0].trim());
      }
    }

    // Add state/province if available
    if (address.state && address.state !== parts[0]) {
      parts.push(address.state);
    } else if (address.province && address.province !== parts[0]) {
      parts.push(address.province);
    }

    // Add country
    if (address.country) {
      parts.push(address.country);
    }

    return parts.length > 0 ? parts.join(', ') : result.display_name || 'Unknown Location';
  }

  /**
   * Get country name from Nominatim result
   * @param result - Nominatim result
   * @returns Country name
   */
  private getCountryName(result: any): string {
    const address = result.address || {};
    return address.country || 'Unknown';
  }

  /**
   * Get state/province name from Nominatim result
   * @param result - Nominatim result
   * @returns State/province name
   */
  private getStateName(result: any): string {
    const address = result.address || {};
    return address.state || address.province || address.region || 'Unknown';
  }

  /**
   * Search with multiple query variations for better results
   * @param originalQuery - Original location query
   * @returns Promise<ILocation> - Best matching location
   */
  async searchWithVariations(originalQuery: string): Promise<ILocation> {
    const queries = this.generateQueryVariations(originalQuery);
    
    for (const query of queries) {
      try {
        const result = await this.searchLocation(query);
        if (result && result.name !== 'Unknown Location') {
          return result;
        }
      } catch (error) {
        console.warn(`Fallback query "${query}" failed:`, error);
        continue;
      }
    }
    
    throw new Error(`No fallback location found for: ${originalQuery}`);
  }

  /**
   * Generate query variations for better search results
   * @param query - Original query
   * @returns Array of query variations
   */
  private generateQueryVariations(query: string): string[] {
    const variations = [query];
    const lowerQuery = query.toLowerCase();
    
    // Common misspellings and variations
    const corrections: { [key: string]: string[] } = {
      'tokio': ['tokyo', 'tokyo japan'],
      'tokyo': ['tokyo japan', 'tokyo, japan'],
      'japan': ['japan', 'japan country'],
      'paris': ['paris france', 'paris, france'],
      'london': ['london england', 'london uk', 'london, england'],
      'new york': ['new york city', 'new york, ny', 'new york city, ny'],
      'los angeles': ['los angeles, ca', 'los angeles california'],
      'sao paulo': ['sao paulo brazil', 'sao paulo, brazil'],
      'rio de janeiro': ['rio de janeiro brazil', 'rio de janeiro, brazil']
    };

    // Add corrections if found
    for (const [key, values] of Object.entries(corrections)) {
      if (lowerQuery.includes(key)) {
        variations.push(...values);
      }
    }

    // Add variations with common suffixes
    const suffixes = ['city', 'town', 'village', 'municipality'];
    for (const suffix of suffixes) {
      if (!lowerQuery.includes(suffix)) {
        variations.push(`${query} ${suffix}`);
      }
    }

    // Remove duplicates and return
    return [...new Set(variations)];
  }
}
