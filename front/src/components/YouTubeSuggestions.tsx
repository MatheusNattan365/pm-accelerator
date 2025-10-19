import React from 'react';
import { YouTubeSuggestion } from '../api';

interface YouTubeSuggestionsProps {
  suggestions: YouTubeSuggestion[];
  locationName: string;
}

const YouTubeSuggestions: React.FC<YouTubeSuggestionsProps> = ({ suggestions, locationName }) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const handleVideoClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="youtube-suggestions">
      <div className="youtube-header">
        <h3 className="youtube-title">
          🎥 Things to do in {locationName}
        </h3>
        <p className="youtube-subtitle">
          Discover amazing activities and attractions
        </p>
      </div>
      
      <div className="youtube-grid">
        {suggestions.map((suggestion, index) => (
          <div 
            key={index} 
            className="youtube-card"
            onClick={() => handleVideoClick(suggestion.url)}
          >
            <div className="youtube-thumbnail">
              <img 
                src={suggestion.thumbnail} 
                alt={suggestion.title}
                loading="lazy"
              />
              <div className="youtube-play-overlay">
                <div className="play-button">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="youtube-content">
              <h4 className="youtube-video-title" title={suggestion.title}>
                {suggestion.title}
              </h4>
              <p className="youtube-channel">
                📺 {suggestion.channelTitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default YouTubeSuggestions;
