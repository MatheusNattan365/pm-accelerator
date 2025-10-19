import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/app');
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="floating-elements">
            <div className="floating-element element-1">🌤️</div>
            <div className="floating-element element-2">🌦️</div>
            <div className="floating-element element-3">⛅</div>
            <div className="floating-element element-4">🌧️</div>
            <div className="floating-element element-5">❄️</div>
            <div className="floating-element element-6">🌪️</div>
          </div>
        </div>
        
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">🚀</span>
            <span>Advanced Weather Platform</span>
          </div>
          
          <h1 className="hero-title">
            Intelligent Weather
            <span className="gradient-text"> Forecasting</span>
            <br />
            <span className="hero-subtitle">Powered by AI</span>
          </h1>
          
          <p className="hero-description">
            Get accurate weather forecasts, interactive maps, and detailed analytics 
            for any location worldwide. Save your searches, export data, and discover 
            weather-related content with our comprehensive platform.
          </p>
          
          <div className="hero-actions">
            <button className="cta-primary" onClick={handleGetStarted}>
              <span>Start Forecasting</span>
              <span className="cta-icon">→</span>
            </button>
            <button className="cta-secondary">
              <span>View Demo</span>
              <span className="demo-icon">▶</span>
            </button>
          </div>
          
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">99.9%</div>
              <div className="stat-label">Accuracy</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Updates</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">Global</div>
              <div className="stat-label">Coverage</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">
            Powerful Features for
            <span className="gradient-text"> Every Need</span>
          </h2>
          <p className="section-description">
            Our comprehensive weather platform offers everything you need for accurate forecasting and analysis.
          </p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3 className="feature-title">Global Location Search</h3>
            <p className="feature-description">
              Search by city name, zip code, or coordinates. Our intelligent geocoding finds any location worldwide.
            </p>
            <div className="feature-highlights">
              <span className="highlight">City Search</span>
              <span className="highlight">Zip Code</span>
              <span className="highlight">Coordinates</span>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Detailed Analytics</h3>
            <p className="feature-description">
              Comprehensive weather data including temperature, humidity, wind speed, and precipitation forecasts.
            </p>
            <div className="feature-highlights">
              <span className="highlight">7-Day Forecast</span>
              <span className="highlight">Hourly Data</span>
              <span className="highlight">UV Index</span>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🗺️</div>
            <h3 className="feature-title">Interactive Maps</h3>
            <p className="feature-description">
              Visualize weather patterns and locations with our interactive map integration powered by MapTiler.
            </p>
            <div className="feature-highlights">
              <span className="highlight">Real-time</span>
              <span className="highlight">Interactive</span>
              <span className="highlight">Detailed</span>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">💾</div>
            <h3 className="feature-title">Data Persistence</h3>
            <p className="feature-description">
              Save your searches and access historical weather data with our MongoDB-powered storage system.
            </p>
            <div className="feature-highlights">
              <span className="highlight">Save Searches</span>
              <span className="highlight">History</span>
              <span className="highlight">Export</span>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3 className="feature-title">PDF Export</h3>
            <p className="feature-description">
              Generate professional weather reports and export your data in PDF format for presentations and records.
            </p>
            <div className="feature-highlights">
              <span className="highlight">Professional</span>
              <span className="highlight">Customizable</span>
              <span className="highlight">Batch Export</span>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🎥</div>
            <h3 className="feature-title">Content Discovery</h3>
            <p className="feature-description">
              Discover relevant weather-related YouTube content and educational videos based on your searches.
            </p>
            <div className="feature-highlights">
              <span className="highlight">Educational</span>
              <span className="highlight">Relevant</span>
              <span className="highlight">Curated</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="tech-section">
        <div className="section-header">
          <h2 className="section-title">
            Built with
            <span className="gradient-text"> Modern Technology</span>
          </h2>
          <p className="section-description">
            Our platform leverages cutting-edge technologies for optimal performance and user experience.
          </p>
        </div>
        
        <div className="tech-grid">
          <div className="tech-category">
            <h3 className="tech-category-title">Frontend</h3>
            <div className="tech-items">
              <div className="tech-item">
                <div className="tech-icon react">⚛️</div>
                <span>React 18</span>
              </div>
              <div className="tech-item">
                <div className="tech-icon typescript">📘</div>
                <span>TypeScript</span>
              </div>
              <div className="tech-item">
                <div className="tech-icon vite">⚡</div>
                <span>Vite</span>
              </div>
            </div>
          </div>
          
          <div className="tech-category">
            <h3 className="tech-category-title">Backend</h3>
            <div className="tech-items">
              <div className="tech-item">
                <div className="tech-icon nodejs">🟢</div>
                <span>Node.js</span>
              </div>
              <div className="tech-item">
                <div className="tech-icon express">🚀</div>
                <span>Express</span>
              </div>
              <div className="tech-item">
                <div className="tech-icon mongodb">🍃</div>
                <span>MongoDB</span>
              </div>
            </div>
          </div>
          
          <div className="tech-category">
            <h3 className="tech-category-title">APIs & Services</h3>
            <div className="tech-items">
              <div className="tech-item">
                <div className="tech-icon openmeteo">🌤️</div>
                <span>Open-Meteo</span>
              </div>
              <div className="tech-item">
                <div className="tech-icon maptiler">🗺️</div>
                <span>MapTiler</span>
              </div>
              <div className="tech-item">
                <div className="tech-icon youtube">📺</div>
                <span>YouTube API</span>
              </div>
            </div>
          </div>
          
          <div className="tech-category">
            <h3 className="tech-category-title">Infrastructure</h3>
            <div className="tech-items">
              <div className="tech-item">
                <div className="tech-icon docker">🐳</div>
                <span>Docker</span>
              </div>
              <div className="tech-item">
                <div className="tech-icon fastapi">🐍</div>
                <span>FastAPI</span>
              </div>
              <div className="tech-item">
                <div className="tech-icon playwright">🎭</div>
                <span>Playwright</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-background">
          <div className="cta-pattern"></div>
        </div>
        
        <div className="cta-content">
          <h2 className="cta-title">
            Ready to Experience
            <span className="gradient-text"> Intelligent Weather</span>
            <span className="cta-title-accent"> Forecasting?</span>
          </h2>
          
          <p className="cta-description">
            Join thousands of users who trust our platform for accurate weather predictions, 
            detailed analytics, and seamless data management.
          </p>
          
          <div className="cta-actions">
            <button className="cta-primary large" onClick={handleGetStarted}>
              <span>Get Started Now</span>
              <span className="cta-icon">🚀</span>
            </button>
            <div className="cta-features">
              <div className="cta-feature">
                <span className="feature-check">✓</span>
                <span>Free to use</span>
              </div>
              <div className="cta-feature">
                <span className="feature-check">✓</span>
                <span>No registration required</span>
              </div>
              <div className="cta-feature">
                <span className="feature-check">✓</span>
                <span>Global coverage</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3 className="footer-title">Weather Forecast Platform</h3>
            <p className="footer-description">
              Advanced weather forecasting powered by modern technology and AI-driven insights.
            </p>
          </div>
          
          <div className="footer-links">
            <div className="footer-column">
              <h4 className="footer-column-title">Features</h4>
              <ul className="footer-list">
                <li><a href="#features">Weather Forecasting</a></li>
                <li><a href="#features">Interactive Maps</a></li>
                <li><a href="#features">Data Export</a></li>
                <li><a href="#features">Location Search</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4 className="footer-column-title">Technology</h4>
              <ul className="footer-list">
                <li><a href="#tech">React & TypeScript</a></li>
                <li><a href="#tech">Node.js & Express</a></li>
                <li><a href="#tech">MongoDB Atlas</a></li>
                <li><a href="#tech">Docker</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4 className="footer-column-title">Resources</h4>
              <ul className="footer-list">
                <li><a href="#api">API Documentation</a></li>
                <li><a href="#github">GitHub Repository</a></li>
                <li><a href="#support">Support</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="footer-copyright">
              © 2024 Weather Forecast Platform. Built with ❤️ using modern web technologies.
            </p>
            <div className="footer-social">
              <span className="social-text">Data powered by:</span>
              <span className="data-source">Open-Meteo</span>
              <span className="data-source">MapTiler</span>
              <span className="data-source">YouTube API</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
