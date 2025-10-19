import React from 'react';

interface CurrentWeather {
  temperature: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  wind_gust?: number;
  precipitation: number;
  location: string;
}

interface WeatherCardProps {
  current: CurrentWeather;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ current }) => {
  const formatTemperature = (temp: number) => `${Math.round(temp)}°F`;
  const formatSpeed = (speed: number) => `${Math.round(speed)} mph`;
  const formatPrecipitation = (precip: number) => `${precip.toFixed(1)} in`;

  return (
    <div className="weather-card">
      <h2>Current Weather - {current.location}</h2>
      
      <div className="weather-grid">
        <div className="weather-item">
          <div className="weather-value">{formatTemperature(current.temperature)}</div>
          <div className="weather-label">Temperature</div>
        </div>

        <div className="weather-item">
          <div className="weather-value">{formatTemperature(current.feels_like)}</div>
          <div className="weather-label">Feels Like</div>
        </div>

        <div className="weather-item">
          <div className="weather-value">{current.humidity}%</div>
          <div className="weather-label">Humidity</div>
        </div>

        <div className="weather-item">
          <div className="weather-value">
            {formatSpeed(current.wind_speed)}
            {current.wind_gust && (
              <span className="wind-gust"> (gust: {formatSpeed(current.wind_gust)})</span>
            )}
          </div>
          <div className="weather-label">Wind Speed</div>
        </div>

        <div className="weather-item">
          <div className="weather-value">{formatPrecipitation(current.precipitation)}</div>
          <div className="weather-label">Precipitation</div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
