import React, { useState, useEffect } from 'react';
import { LocationType } from '../api';
import LocationTypeSelector from './LocationTypeSelector';

interface SearchFormProps {
  onSearch: (location: string, locationType: LocationType, start?: string, end?: string) => void;
  loading: boolean;
  searchSuccess?: boolean; // New prop to trigger field clearing
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, loading, searchSuccess = false }) => {
  const [location, setLocation] = useState('');
  const [locationType, setLocationType] = useState<LocationType>('city');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Clear fields when search is successful
  useEffect(() => {
    if (searchSuccess) {
      setLocation('');
      setStartDate('');
      setEndDate('');
      // Keep locationType as is, so user can search the same type again
    }
  }, [searchSuccess]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;
    
    const start = startDate || undefined;
    const end = endDate || undefined;
    onSearch(location.trim(), locationType, start, end);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setLocation('Getting location...');
    setLocationType('coordinates');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(`${latitude.toFixed(6)},${longitude.toFixed(6)}`);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please enter it manually.');
        setLocation('');
      }
    );
  };

  // Get placeholder based on location type
  const getPlaceholder = (type: LocationType): string => {
    switch (type) {
      case 'city':
        return 'City, state, or country name (e.g., Toronto, São Paulo, New York)';
      case 'zipcode':
        return 'ZIP/Postal code (e.g., 12345, 12345-6789)';
      case 'coordinates':
        return 'Latitude, longitude (e.g., -23.5505, -46.6333)';
      default:
        return 'Enter location';
    }
  };

  return (
    <div className="search-form">
      <form onSubmit={handleSubmit}>
        <LocationTypeSelector
          value={locationType}
          onChange={setLocationType}
          disabled={loading}
        />
        
        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={getPlaceholder(locationType)}
            required
          />
          {locationType === 'coordinates' && (
            <button 
              type="button" 
              onClick={handleUseMyLocation}
              className="location-btn"
              disabled={loading}
            >
              Use My Location
            </button>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="start-date">Start Date (optional)</label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="end-date">End Date (optional)</label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Searching...' : 'Search Weather'}
        </button>
      </form>
    </div>
  );
};

export default SearchForm;
