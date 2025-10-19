import React, { useState } from 'react';
import { SavedRecord, updateRecord, deleteRecord } from '../api';
import WeatherMap from './WeatherMap';
import YouTubeSuggestions from './YouTubeSuggestions';

// Enhanced weather code mapping with more detailed icons
const getWeatherIcon = (code: number): string => {
  const weatherCodes: { [key: number]: string } = {
    0: '☀️', // Clear sky
    1: '🌤️', // Mainly clear
    2: '⛅', // Partly cloudy
    3: '☁️', // Overcast
    45: '🌫️', // Fog
    48: '🌫️', // Depositing rime fog
    51: '🌦️', // Light drizzle
    53: '🌦️', // Moderate drizzle
    55: '🌦️', // Dense drizzle
    56: '🧊🌦️', // Light freezing drizzle
    57: '🧊🌦️', // Dense freezing drizzle
    61: '🌧️', // Slight rain
    63: '🌧️', // Moderate rain
    65: '🌧️💧', // Heavy rain
    66: '🧊🌧️', // Light freezing rain
    67: '🧊🌧️', // Heavy freezing rain
    71: '❄️', // Slight snow fall
    73: '❄️', // Moderate snow fall
    75: '❄️🌨️', // Heavy snow fall
    77: '❄️', // Snow grains
    80: '🌦️', // Slight rain showers
    81: '🌦️💧', // Moderate rain showers
    82: '🌦️💧💧', // Violent rain showers
    85: '❄️🌨️', // Slight snow showers
    86: '❄️🌨️', // Heavy snow showers
    95: '⛈️', // Thunderstorm
    96: '⛈️🧊', // Thunderstorm with slight hail
    99: '⛈️🧊💥', // Thunderstorm with heavy hail
  };
  return weatherCodes[code] || '❓';
};

const getWeatherDescription = (code: number): string => {
  const weatherDescriptions: { [key: number]: string } = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return weatherDescriptions[code] || 'Unknown';
};

// Enhanced icon functions for detailed weather information
const getRainIcon = (probability: number): string => {
  if (probability === 0) return '☔❌'; // No rain
  if (probability <= 20) return '🌦️'; // Light rain
  if (probability <= 40) return '🌧️'; // Moderate rain
  if (probability <= 60) return '🌧️💧'; // Heavy rain
  return '🌧️💧💧'; // Very heavy rain
};

const getUVIcon = (uvIndex: number): string => {
  if (uvIndex <= 2) return '☀️'; // Low
  if (uvIndex <= 5) return '☀️⚠️'; // Moderate
  if (uvIndex <= 7) return '☀️⚠️⚠️'; // High
  if (uvIndex <= 10) return '☀️🔥'; // Very High
  return '☀️🔥💀'; // Extreme
};

const getSunriseIcon = (): string => {
  return '🌅';
};

const getSunsetIcon = (): string => {
  return '🌇';
};

const getTemperatureIcon = (temp: number): string => {
  if (temp <= 0) return '🧊';
  if (temp <= 10) return '🥶';
  if (temp <= 20) return '😊';
  if (temp <= 30) return '😎';
  return '🔥';
};

interface SavedListProps {
  records: SavedRecord[];
  onRecordUpdate: () => void;
  selectedRecords: string[];
  onRecordSelection: (recordId: string, isSelected: boolean) => void;
  onSelectAll: () => void;
  onExportToPDF: () => void;
  exportLoading: boolean;
}

// Component to display daily weather information
const DailyWeatherInfo: React.FC<{ 
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
  }
}> = ({ daily }) => {
  if (!daily || !daily.time || daily.time.length === 0) {
    return null;
  }

  return (
    <div className="daily-weather-section">
      <h4 className="daily-weather-title">Daily Weather Forecast</h4>
      <div className="daily-weather-grid">
        {daily.time.map((date, index) => (
          <div key={date} className="daily-weather-card">
            <div className="daily-date">
              {new Date(date).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            <div className="daily-icon">
              {getWeatherIcon(daily.weather_code[index])}
            </div>
            <div className="daily-description">
              {getWeatherDescription(daily.weather_code[index])}
            </div>
            <div className="daily-temps">
              <div className="temp-max-item">
                <span className="temp-icon">{getTemperatureIcon(daily.temperature_2m_max[index])}</span>
                <span className="temp-max">{Math.round(daily.temperature_2m_max[index])}°</span>
              </div>
              <span className="temp-separator">/</span>
              <div className="temp-min-item">
                <span className="temp-icon">{getTemperatureIcon(daily.temperature_2m_min[index])}</span>
                <span className="temp-min">{Math.round(daily.temperature_2m_min[index])}°</span>
              </div>
            </div>
            <div className="daily-details">
              <div className="detail-item rain-item">
                <span className="detail-icon">{getRainIcon(daily.precipitation_probability_max[index])}</span>
                <span className="detail-text">
                  <span className="detail-label">Rain</span>
                  <span className="detail-value">{daily.precipitation_probability_max[index]}%</span>
                </span>
              </div>
              <div className="detail-item uv-item">
                <span className="detail-icon">{getUVIcon(daily.uv_index_max[index])}</span>
                <span className="detail-text">
                  <span className="detail-label">UV</span>
                  <span className="detail-value">{daily.uv_index_max[index]}</span>
                </span>
              </div>
              <div className="detail-item sunrise-item">
                <span className="detail-icon">{getSunriseIcon()}</span>
                <span className="detail-text">
                  <span className="detail-label">Sunrise</span>
                  <span className="detail-value">{daily.sunrise[index].split('T')[1]}</span>
                </span>
              </div>
              <div className="detail-item sunset-item">
                <span className="detail-icon">{getSunsetIcon()}</span>
                <span className="detail-text">
                  <span className="detail-label">Sunset</span>
                  <span className="detail-value">{daily.sunset[index].split('T')[1]}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to format date range
const formatDateRange = (dateRange?: { start: string; end: string }) => {
  if (!dateRange) return 'Current + 5-day';
  const { start, end } = dateRange;
  if (start && end) return `${formatDate(start)} - ${formatDate(end)}`;
  if (start) return `From ${formatDate(start)}`;
  if (end) return `Until ${formatDate(end)}`;
  return 'Current + 5-day';
};

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Helper function to determine search type
const getSearchType = (record: SavedRecord): 'zipcode' | 'city' | 'coordinates' => {
  // Use locationType if available (new records)
  if (record.locationType) {
    return record.locationType;
  }
  
  // Fallback to pattern matching for old records
  const query = record.queryRaw.toLowerCase().trim();
  
  // Check if it's coordinates (lat, lon format)
  if (/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(query)) {
    return 'coordinates';
  }
  
  // Check if it's a zipcode (numeric with optional letters)
  if (/^\d{5}(-\d{4})?$/.test(query) || /^\d{4,6}$/.test(query)) {
    return 'zipcode';
  }
  
  // Default to city/state/country
  return 'city';
};

// Helper function to format coordinates
const formatCoordinates = (lat: number, lon: number): string => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${lat.toFixed(4)}°${latDir}, ${lon.toFixed(4)}°${lonDir}`;
};

// Location display components for different search types
const ZipcodeLocation: React.FC<{ record: SavedRecord }> = ({ record }) => (
  <div className="location-display zipcode-location">
    <div className="location-icon">📮</div>
    <div className="location-info">
      <div className="location-primary">{record.location.name}</div>
      <div className="location-secondary">{record.location.name}, {record.location.admin1}</div>
      <div className="location-tertiary">{record.location.country}</div>
    </div>
  </div>
);

const CityLocation: React.FC<{ record: SavedRecord }> = ({ record }) => (
  <div className="location-display city-location">
    <div className="location-icon">🏙️</div>
    <div className="location-info">
      <div className="location-primary">{record.location.name}</div>
      <div className="location-secondary">{record.location.admin1}, {record.location.country}</div>
      <div className="location-tertiary">{formatCoordinates(record.location.lat, record.location.lon)}</div>
    </div>
  </div>
);

const CoordinatesLocation: React.FC<{ record: SavedRecord }> = ({ record }) => (
  <div className="location-display coordinates-location">
    <div className="location-icon">📍</div>
    <div className="location-info">
      <div className="location-primary">{record.location.name}</div>
      <div className="location-secondary">{record.location.admin1}, {record.location.country}</div>
      <div className="location-tertiary">{formatCoordinates(record.location.lat, record.location.lon)}</div>
    </div>
  </div>
);

// Compact card component for collapsed state
const CompactCard: React.FC<{
  record: SavedRecord;
  onToggle: () => void;
  isSelected: boolean;
  onSelectionChange: (isSelected: boolean) => void;
}> = ({ record, onToggle, isSelected, onSelectionChange }) => {
  const daily = record.snapshot?.daily;
  const searchType = getSearchType(record);
  
  // Calculate overall min/max temperatures across all days
  const temperatureSummary = daily ? {
    weather: getWeatherIcon(daily.weather_code[0]), // Show first day weather icon
    tempMax: Math.round(Math.max(...daily.temperature_2m_max)),
    tempMin: Math.round(Math.min(...daily.temperature_2m_min)),
    description: getWeatherDescription(daily.weather_code[0])
  } : null;

  return (
    <div className="compact-card" onClick={onToggle}>
      <div className="compact-content">
        <div className="compact-selection">
          <label className="record-checkbox" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelectionChange(e.target.checked)}
            />
            <span className="checkmark"></span>
          </label>
        </div>
        
        <div className="compact-location">
          {searchType === 'zipcode' && <ZipcodeLocation record={record} />}
          {searchType === 'city' && <CityLocation record={record} />}
          {searchType === 'coordinates' && <CoordinatesLocation record={record} />}
        </div>
        
        <div className="compact-weather-section">
          <div className="compact-weather">
            {temperatureSummary && (
              <>
                <span className="compact-weather-icon">{temperatureSummary.weather}</span>
                <div className="compact-temps" title={`Temperature range for ${daily.time.length} day${daily.time.length > 1 ? 's' : ''}`}>
                  <span className="compact-temp-max">{temperatureSummary.tempMax}°</span>
                  <span className="compact-temp-sep">/</span>
                  <span className="compact-temp-min">{temperatureSummary.tempMin}°</span>
                </div>
              </>
            )}
          </div>
          
          <div className="compact-meta">
            <span className="compact-date">{formatDateRange(record.dateRange)}</span>
            <span className="compact-search-type">
              {searchType === 'zipcode' && '📮 ZIP Code'}
              {searchType === 'city' && '🏙️ City/State'}
              {searchType === 'coordinates' && '📍 Coordinates'}
            </span>
          </div>
        </div>
        
        <div className="compact-actions">
          <button 
            className="expand-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            title="Expand card"
          >
            <span className="expand-icon">▼</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const SavedList: React.FC<SavedListProps> = ({ 
  records, 
  onRecordUpdate, 
  selectedRecords, 
  onRecordSelection, 
  onSelectAll, 
  onExportToPDF, 
  exportLoading 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Ensure records is always an array to prevent map errors
  const safeRecords = Array.isArray(records) ? records : [];

  const handleEdit = (record: SavedRecord) => {
    setEditingId(record.id);
    setEditTitle(record.location.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim()) return;

    try {
      const currentRecord = records.find(r => r.id === id);
      if (!currentRecord) return;
      
      await updateRecord(id, { 
        location: { 
          ...currentRecord.location, 
          name: editTitle.trim() 
        } 
      });
      setEditingId(null);
      setEditTitle('');
      onRecordUpdate();
    } catch (error) {
      console.error('Failed to update record:', error);
      alert('Failed to update record. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const toggleCardExpansion = (recordId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const handleDelete = async (id: string, locationName: string) => {
    if (!confirm(`Are you sure you want to delete "${locationName}"?`)) {
      return;
    }

    try {
      await deleteRecord(id);
      onRecordUpdate();
    } catch (error) {
      console.error('Failed to delete record:', error);
      alert('Failed to delete record. Please try again.');
    }
  };


  if (safeRecords.length === 0) {
    return (
      <div className="saved-list">
        <h2>Saved Searches</h2>
        <p className="empty-message">No saved searches yet. Search for weather to see your history here.</p>
      </div>
    );
  }

  const isAllSelected = selectedRecords.length === safeRecords.length;
  const isPartiallySelected = selectedRecords.length > 0 && selectedRecords.length < safeRecords.length;

  return (
    <div className="saved-list">
      <div className="saved-list-header">
        <h2>Saved Searches</h2>
        <div className="selection-controls">
          <div className="select-all-control">
            <label className="select-all-checkbox">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(input) => {
                  if (input) input.indeterminate = isPartiallySelected;
                }}
                onChange={onSelectAll}
              />
              <span className="checkmark"></span>
              <span className="select-all-label">
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </span>
            </label>
          </div>
          
          {selectedRecords.length > 0 && (
            <div className="export-controls">
              <span className="selected-count">
                {selectedRecords.length} selected
              </span>
              <button
                className="export-pdf-btn"
                onClick={onExportToPDF}
                disabled={exportLoading}
              >
                {exportLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Exporting...
                  </>
                ) : (
                  <>
                    📄 Export PDF
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="records-list">
        {safeRecords.map((record) => {
          const isExpanded = expandedCards.has(record.id);
          
          return (
            <div key={record.id} className={`record-card ${isExpanded ? 'expanded' : 'collapsed'}`}>
              {editingId === record.id ? (
                <div className="edit-form">
                  <div className="edit-form-header">
                    <h3 className="edit-form-title">✏️ Edit Location Name</h3>
                    <p className="edit-form-subtitle">Update the display name for this location</p>
                  </div>
                  <div className="edit-input-container">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="edit-input"
                      placeholder="Enter location name..."
                      autoFocus
                    />
                    <div className="edit-input-icon">📍</div>
                  </div>
                  <div className="edit-buttons">
                    <button 
                      onClick={() => handleSaveEdit(record.id)}
                      className="save-btn"
                      disabled={!editTitle.trim()}
                    >
                      <span className="btn-icon">💾</span>
                      Save Changes
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="cancel-btn"
                    >
                      <span className="btn-icon">❌</span>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : isExpanded ? (
                <div className="record-content expanded-content">
                  <div className="record-header">
                    <div className="record-title-section">
                      {getSearchType(record) === 'zipcode' && <ZipcodeLocation record={record} />}
                      {getSearchType(record) === 'city' && <CityLocation record={record} />}
                      {getSearchType(record) === 'coordinates' && <CoordinatesLocation record={record} />}
                    </div>
                    <div className="record-actions">
                      <button 
                        onClick={() => toggleCardExpansion(record.id)}
                        className="collapse-btn"
                        title="Collapse card"
                      >
                        <span className="collapse-icon">▲</span>
                      </button>
                      <button 
                        onClick={() => handleEdit(record)}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(record.id, record.location.name)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="record-main-content">
                    {/* Left Column - Information */}
                    <div className="record-info-column">
                      <div className="record-details">
                        <div className="record-coords">
                          <strong>Coordinates:</strong> {formatCoordinates(record.location.lat, record.location.lon)}
                        </div>
                        <div className="record-search-info">
                          <div className="search-type-badge">
                            {getSearchType(record) === 'zipcode' && '📮 ZIP Code Search'}
                            {getSearchType(record) === 'city' && '🏙️ City/State Search'}
                            {getSearchType(record) === 'coordinates' && '📍 Coordinates Search'}
                          </div>
                          <div className="record-query">
                            <strong>Original Query:</strong> {record.queryRaw}
                          </div>
                        </div>
                        <div className="record-date">
                          <strong>Date Range:</strong> {formatDateRange(record.dateRange)}
                        </div>
                        <div className="record-created">
                          <strong>Created:</strong> {formatDate(record.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Map */}
                    <div className="record-map-column">
                      <div className="location-map-section">
                        <h4 className="location-map-title">🗺️ Location Map</h4>
                        <WeatherMap
                          lat={record.location.lat}
                          lon={record.location.lon}
                          locationName={record.location.name}
                          className="record-map"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Daily Weather Information */}
                  {record.snapshot?.daily && (
                    <DailyWeatherInfo daily={record.snapshot.daily} />
                  )}
                  
                  {record.youtubeSuggestions && record.youtubeSuggestions.length > 0 && (
                    <YouTubeSuggestions 
                      suggestions={record.youtubeSuggestions}
                      locationName={record.location.name}
                    />
                  )}
                </div>
              ) : (
                <CompactCard
                  record={record}
                  onToggle={() => toggleCardExpansion(record.id)}
                  isSelected={selectedRecords.includes(record.id)}
                  onSelectionChange={(isSelected) => onRecordSelection(record.id, isSelected)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SavedList;
