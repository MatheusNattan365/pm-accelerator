import React from 'react';

interface LoadingBackdropProps {
  isVisible: boolean;
  message?: string;
}

const LoadingBackdrop: React.FC<LoadingBackdropProps> = ({ 
  isVisible, 
  message = "Searching for weather data..." 
}) => {
  if (!isVisible) return null;

  return (
    <div className="loading-backdrop">
      <div className="loading-overlay">
        <div className="loading-content">
          <div className="loading-spinner-large">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          
          <div className="loading-text">
            <h3 className="loading-title">🌤️ Weather Search</h3>
            <p className="loading-message">{message}</p>
          </div>
          
          <div className="loading-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingBackdrop;
