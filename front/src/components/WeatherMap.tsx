import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { MAPTILER_CONFIG } from '../config/maptiler';
import 'maplibre-gl/dist/maplibre-gl.css';

interface WeatherMapProps {
  lat: number;
  lon: number;
  locationName: string;
  className?: string;
}

const WeatherMap: React.FC<WeatherMapProps> = ({ lat, lon, locationName, className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (map.current) {
      console.log('Map already initialized, skipping...');
      return;
    }

    // Check if API key is configured
    if (!MAPTILER_CONFIG.apiKey || MAPTILER_CONFIG.apiKey === 'YOUR_MAPTILER_API_KEY_HERE') {
      setMapError('MapTiler API key not configured');
      return;
    }

    // Validate API key format
    if (MAPTILER_CONFIG.apiKey.length < 10) {
      setMapError('Invalid MapTiler API key format');
      return;
    }

    try {
      console.log('Initializing MapLibre GL with MapTiler API key:', MAPTILER_CONFIG.apiKey.substring(0, 8) + '...');

      if (mapContainer.current) {
        // Initialize MapLibre GL with MapTiler style
        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_CONFIG.apiKey}`,
          center: [lon, lat],
          zoom: MAPTILER_CONFIG.defaultZoom,
          interactive: false, // Make map static
        });

        // Add marker after map loads
        map.current.on('load', () => {
          try {
            console.log('MapLibre GL map loaded, adding marker...');
            
            // Ensure map is properly sized
            map.current!.resize();
            
            // Create marker using MapLibre GL
            const marker = new maplibregl.Marker({ 
              color: MAPTILER_CONFIG.marker.color 
            })
              .setLngLat([lon, lat])
              .addTo(map.current!);

            // Create popup using MapLibre GL
            const popup = new maplibregl.Popup({ 
              offset: MAPTILER_CONFIG.popup.offset,
              closeButton: MAPTILER_CONFIG.popup.closeButton 
            })
              .setLngLat([lon, lat])
              .setHTML(`
                <div style="padding: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;">
                  <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">${locationName}</div>
                  <div style="font-size: 0.75rem; color: #64748b;">
                    📍 Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}
                  </div>
                </div>
              `);

            // Add popup to marker
            marker.setPopup(popup);
              
            console.log('MapLibre GL marker and popup added successfully');
          } catch (markerError) {
            console.error('Error adding marker:', markerError);
            setMapError('Failed to add marker to map');
          }
        });

        // Error handling
        map.current.on('error', (e) => {
          console.error('MapLibre GL error:', e);
          setMapError('Map failed to load');
        });

        // Style loading error handling
        map.current.on('style.load', () => {
          console.log('MapLibre GL style loaded successfully');
        });

        map.current.on('style.error', (e) => {
          console.error('MapLibre GL style error:', e);
          setMapError('Map style failed to load');
        });
      }
    } catch (error) {
      console.error('MapLibre GL initialization error:', error);
      setMapError('Failed to initialize map');
    }

    return () => {
      if (map.current) {
        try {
          map.current.remove();
        } catch (cleanupError) {
          console.warn('Error during map cleanup:', cleanupError);
        } finally {
          map.current = null;
        }
      }
    };
  }, [lat, lon, locationName]);

  // Resize map when container size changes
  useEffect(() => {
    const handleResize = () => {
      if (map.current) {
        map.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show error state if map failed to load
  if (mapError) {
    return (
      <div className={`weather-map ${className} map-error`}>
        <div className="map-error-container">
          <div className="map-error-icon">🗺️</div>
          <div className="map-error-content">
            <div className="map-error-title">Map Not Available</div>
            <div className="map-error-message">
              {mapError === 'MapTiler API key not configured' 
                ? 'Please configure your MapTiler API key to view maps'
                : 'Unable to load map at this time'
              }
            </div>
            <div className="map-error-coords">
              📍 {locationName} - Lat: {lat.toFixed(4)}, Lon: {lon.toFixed(4)}
            </div>
            {mapError === 'MapTiler API key not configured' && (
              <div className="map-error-help">
                <a 
                  href="https://www.maptiler.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="map-error-link"
                >
                  Get free API key →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`weather-map ${className}`}>
      <div ref={mapContainer} className="map-container" />
      <div className="map-overlay">
        <div className="map-info">
          <span className="map-icon">📍</span>
          <span className="map-location">{locationName}</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherMap;
