// API base URL from environment variable
const BASE = (import.meta.env as any).VITE_API_URL || "http://localhost:4000";

// Types for API responses
export type LocationType = 'city' | 'zipcode' | 'coordinates';

export interface YouTubeSuggestion {
  title: string;
  url: string;
  thumbnail: string;
  channelTitle: string;
}

export interface WeatherSearchParams {
  location: string;
  locationType: LocationType;
  start?: string;
  end?: string;
}

export interface WeatherData {
  current?: {
    temperature: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    wind_gust?: number;
    precipitation: number;
    location: string;
  };
  forecast?: Array<{
    date: string;
    high: number;
    low: number;
    rain_chance: number;
    uv_max?: number;
  }>;
}

export interface SavedRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  dateRange: {
    start: string;
    end: string;
  };
  location: {
    name: string;
    country: string;
    admin1: string;
    lat: number;
    lon: number;
  };
  queryRaw: string;
  locationType?: LocationType;
  snapshot: {
    current: any;
    daily: any;
    source: string;
  };
  youtubeSuggestions?: YouTubeSuggestion[];
}

// API helper functions
export const searchWeather = async (params: WeatherSearchParams): Promise<WeatherData> => {
  const response = await fetch(`${BASE}/api/weather/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Weather search failed: ${response.statusText}`);
  }

  return response.json();
};

export const listRecords = async (): Promise<SavedRecord[]> => {
  try {
    const response = await fetch(`${BASE}/api/records`);

    if (!response.ok) {
      throw new Error(`Failed to fetch records: ${response.statusText}`);
    }

    const { data } = await response.json();
    // Ensure we return an array even if the API returns unexpected data
    return Array.isArray(data.records) ? data.records : [];
  } catch (error) {
    console.error('Error fetching records:', error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
};

export const updateRecord = async (id: string, patch: Partial<SavedRecord>): Promise<SavedRecord> => {
  const response = await fetch(`${BASE}/api/records/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    throw new Error(`Failed to update record: ${response.statusText}`);
  }

  return response.json();
};

export const deleteRecord = async (id: string): Promise<void> => {
  const response = await fetch(`${BASE}/api/records/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete record: ${response.statusText}`);
  }
};
