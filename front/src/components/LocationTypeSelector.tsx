import React from 'react';
import { LocationType } from '../api';

interface LocationTypeSelectorProps {
  value: LocationType;
  onChange: (type: LocationType) => void;
  disabled?: boolean;
}

const LocationTypeSelector: React.FC<LocationTypeSelectorProps> = ({ 
  value, 
  onChange, 
  disabled = false 
}) => {
  const locationTypes: { type: LocationType; label: string; icon: string; description: string }[] = [
    {
      type: 'city',
      label: 'City/State',
      icon: '🏙️',
      description: 'City, state, or country name'
    },
    {
      type: 'zipcode',
      label: 'ZIP Code',
      icon: '📮',
      description: 'Postal/ZIP code'
    },
    {
      type: 'coordinates',
      label: 'Coordinates',
      icon: '📍',
      description: 'Latitude, longitude'
    }
  ];

  return (
    <div className="location-type-selector">
      <label className="location-type-label">Search Type</label>
      <div className="location-type-options">
        {locationTypes.map(({ type, label, icon, description }) => (
          <div
            key={type}
            className={`location-type-option ${value === type ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && onChange(type)}
          >
            <div className="location-type-icon">{icon}</div>
            <div className="location-type-content">
              <div className="location-type-label-text">{label}</div>
              <div className="location-type-description">{description}</div>
            </div>
            <div className="location-type-radio">
              <input
                type="radio"
                name="locationType"
                value={type}
                checked={value === type}
                onChange={() => onChange(type)}
                disabled={disabled}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationTypeSelector;
