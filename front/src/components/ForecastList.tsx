import React from 'react';

interface ForecastDay {
  date: string;
  high: number;
  low: number;
  rain_chance: number;
  uv_max?: number;
}

interface ForecastListProps {
  forecast: ForecastDay[];
}

const ForecastList: React.FC<ForecastListProps> = ({ forecast }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTemperature = (temp: number) => `${Math.round(temp)}°F`;

  return (
    <div className="forecast-list">
      <h2>5-Day Forecast</h2>
      
      <div className="forecast-grid">
        {forecast.map((day, index) => (
          <div key={index} className="forecast-card">
            <div className="forecast-date">{formatDate(day.date)}</div>
            
            <div className="forecast-temps">
              <span className="temp-high">{formatTemperature(day.high)}</span>
              <span className="temp-separator">/</span>
              <span className="temp-low">{formatTemperature(day.low)}</span>
            </div>

            <div className="forecast-details">
              <div className="rain-chance">
                🌧️ {day.rain_chance}%
              </div>
              
              {day.uv_max && (
                <div className="uv-index">
                  ☀️ UV: {day.uv_max}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForecastList;
