import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WeatherData, SavedRecord, searchWeather, listRecords, LocationType } from './api';
import LandingPage from './components/LandingPage';
import SearchForm from './components/SearchForm';
import WeatherCard from './components/WeatherCard';
import ForecastList from './components/ForecastList';
import SavedList from './components/SavedList';
import InfoButton from './components/InfoButton';
import LinkedInButton from './components/LinkedInButton';
import PersonalLinkedInButton from './components/PersonalLinkedInButton';
import Toast from './components/Toast';
import LoadingBackdrop from './components/LoadingBackdrop';

import WeatherApp from './components/WeatherApp';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<WeatherApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
