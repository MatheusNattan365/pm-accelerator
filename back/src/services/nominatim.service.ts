import axios from 'axios';
import { LocationNotFoundError } from '../middleware/error';

export interface NominatimAddress {
  railway?: string;
  road?: string;
  suburb?: string;
  city?: string;
  municipality?: string;
  city_district?: string;
  town?: string;
  county?: string;
  state_district?: string;
  state?: string;
  'ISO3166-2-lvl4'?: string;
  region?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

export interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  address: NominatimAddress;
  boundingbox: string[];
}

export class NominatimService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org/reverse';

  /**
   * Reverse geocode coordinates to get detailed location information
   * @param lat - Latitude
   * @param lon - Longitude
   * @returns Detailed location information from Nominatim
   */
  async reverseGeocode(lat: number, lon: number): Promise<NominatimResult | null> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          lat: lat.toString(),
          lon: lon.toString(),
          format: 'json',
          addressdetails: 1,
          zoom: 18
        },
        headers: {
          'User-Agent': 'WeatherApp/1.0 (contact@example.com)'
        },
        timeout: 10000
      });

      if (response.data && response.data.place_id) {
        return response.data as NominatimResult;
      }

      return null;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Nominatim API rate limit exceeded');
        }
        if (error.response?.status === 404) {
          throw new LocationNotFoundError(`${lat},${lon}`);
        }
        throw new Error(`Nominatim API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Build location name from Nominatim result
   * @param result - Nominatim result
   * @returns Formatted location name
   */
  buildLocationName(result: NominatimResult): string {
    const parts = [];
    const address = result.address;

    // Add specific location name if available
    if (result.name && result.name.trim()) {
      parts.push(result.name);
    }

    // Add city if available and different from name
    if (address.city && address.city.trim() && address.city !== result.name) {
      parts.push(address.city);
    }

    if (address.city_district && address.city_district.trim() && address.city_district !== address.city && address.city_district !== result.name) {
      parts.push(address.city_district);
    }
    
    if (address.town && address.town.trim() && address.town !== address.city && address.town !== result.name) {
      parts.push(address.town);
    }

    if (address.municipality && address.municipality.trim() && address.municipality !== address.city && address.municipality !== result.name) {
      parts.push(address.municipality);
    }

    // Add suburb if available and different from city
    if (address.suburb && address.suburb.trim() && 
        address.suburb !== address.city && address.suburb !== result.name) {
      parts.push(address.suburb);
    }

    // Add state if available
    if (address.state && address.state.trim()) {
      parts.push(address.state);
    }

    // Add country if available
    if (address.country && address.country.trim()) {
      parts.push(address.country);
    }

    return parts.length > 0 ? parts.join(', ') : result.display_name;
  }

  /**
   * Get country name from Nominatim result
   * @param result - Nominatim result
   * @returns Country name
   */
  getCountryName(result: NominatimResult): string {
    return result.address.country || 'Unknown';
  }

  /**
   * Get state/province name from Nominatim result
   * @param result - Nominatim result
   * @returns State name
   */
  getStateName(result: NominatimResult): string {
    return result.address.state || result.address.region || 'Unknown';
  }

  /**
   * Get city name from Nominatim result
   * @param result - Nominatim result
   * @returns City name
   */
  getCityName(result: NominatimResult): string {
    return result.address.city || result.address.city_district || result.address.town || result.address.municipality || result.name || 'Unknown';
  }

  /**
   * Check if the result represents a city or town
   * @param result - Nominatim result
   * @returns True if it's a city/town
   */
  isCityOrTown(result: NominatimResult): boolean {
    const cityTypes = ['city', 'town', 'village', 'hamlet', 'municipality'];
    return cityTypes.includes(result.type) || 
           cityTypes.includes(result.class) ||
           !!(result.address.city && result.address.city.trim() !== '');
  }

  /**
   * Get additional location details
   * @param result - Nominatim result
   * @returns Additional details object
   */
  getAdditionalDetails(result: NominatimResult): {
    postcode?: string;
    road?: string;
    suburb?: string;
    region?: string;
    countryCode?: string;
  } {
    return {
      postcode: result.address.postcode,
      road: result.address.road,
      suburb: result.address.suburb,
      region: result.address.region,
      countryCode: result.address.country_code
    };
  }
}
