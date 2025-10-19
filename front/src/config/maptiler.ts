// MapTiler + MapLibre GL Configuration
// Get your free API key at https://www.maptiler.com/

export const MAPTILER_CONFIG = {
  // Replace with your actual MapTiler API key
  apiKey: import.meta.env.VITE_MAPTILER_API_KEY || 'YOUR_MAPTILER_API_KEY_HERE',
  
  // Default zoom level for static maps
  defaultZoom: 12,
  
  // Marker configuration
  marker: {
    color: '#3b82f6',
  },
  
  // Popup configuration
  popup: {
    offset: 25,
    closeButton: true,
  },
  
  // Static map configuration
  static: {
    interactive: false,
    showControls: false,
  },
  
  // MapLibre GL configuration
  maplibre: {
    style: 'streets', // Default MapTiler style
    attribution: '© MapTiler © OpenStreetMap contributors',
  }
};

// Helper function to get style URL with API key
export const getMapStyleUrl = (style: string = 'streets'): string => {
  const apiKey = MAPTILER_CONFIG.apiKey;
  return `https://api.maptiler.com/maps/${style}/style.json?key=${apiKey}`;
};

// Available map styles
export const MAP_STYLES = {
  STREETS: 'streets',
  OUTDOOR: 'outdoor',
  LIGHT: 'light',
  DARK: 'dark',
  SATELLITE: 'satellite',
  HYBRID: 'hybrid',
} as const;
