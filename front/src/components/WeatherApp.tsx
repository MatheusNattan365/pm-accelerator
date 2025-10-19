import { useState, useEffect } from 'react';
import { WeatherData, SavedRecord, searchWeather, listRecords, LocationType } from '../api';
import SearchForm from './SearchForm';
import WeatherCard from './WeatherCard';
import ForecastList from './ForecastList';
import SavedList from './SavedList';
import InfoButton from './InfoButton';
import LinkedInButton from './LinkedInButton';
import PersonalLinkedInButton from './PersonalLinkedInButton';
import Toast from './Toast';
import LoadingBackdrop from './LoadingBackdrop';

function WeatherApp() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [savedRecords, setSavedRecords] = useState<SavedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchSuccess, setSearchSuccess] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false
  });
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  // Load saved records on app start
  useEffect(() => {
    loadSavedRecords();
  }, []);

  // Reset search success after a short delay to allow form clearing
  useEffect(() => {
    if (searchSuccess) {
      const timer = setTimeout(() => {
        setSearchSuccess(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchSuccess]);

  const loadSavedRecords = async () => {
    try {
      const records = await listRecords();
      // Ensure we always set an array, even if the API returns unexpected data
      setSavedRecords(Array.isArray(records) ? records : []);
    } catch (err) {
      console.error('Failed to load saved records:', err);
      // Set empty array on error to prevent crashes
      setSavedRecords([]);
    }
  };

  const handleSearch = async (location: string, locationType: LocationType, start?: string, end?: string) => {
    setLoading(true);
    setSearchSuccess(false);
    
    try {
      const data = await searchWeather({ location, locationType, start, end });
      setWeatherData(data);
      // Reload saved records to show any newly saved search
      await loadSavedRecords();
      // Set search success to trigger field clearing
      setSearchSuccess(true);
      // Show success toast
      showToast('Weather data loaded successfully!', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      
      // Check for specific error types and show appropriate toast
      if (errorMessage.toLowerCase().includes('location not found') || 
          errorMessage.toLowerCase().includes('not found') ||
          errorMessage.toLowerCase().includes('invalid location')) {
        showToast('Location not found. Please check the spelling and try again.', 'error');
      } else if (errorMessage.toLowerCase().includes('network') || 
                 errorMessage.toLowerCase().includes('connection')) {
        showToast('Network error. Please check your connection and try again.', 'error');
      } else if (errorMessage.toLowerCase().includes('rate limit')) {
        showToast('Too many requests. Please wait a moment and try again.', 'warning');
      } else {
        showToast(errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecordUpdate = async () => {
    // Reload saved records when a record is updated/deleted
    await loadSavedRecords();
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToast({
      message,
      type,
      isVisible: true
    });
  };

  const hideToast = () => {
    setToast(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  const handleRecordSelection = (recordId: string, isSelected: boolean) => {
    setSelectedRecords(prev => {
      if (isSelected) {
        return [...prev, recordId];
      } else {
        return prev.filter(id => id !== recordId);
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedRecords.length === savedRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(savedRecords.map(record => record.id));
    }
  };

  const handleExportToPDF = async () => {
    if (selectedRecords.length === 0) {
      showToast('Please select at least one record to export.', 'warning');
      return;
    }

    setExportLoading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/records/export/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordIds: selectedRecords,
          includeWeatherData: true, 
          includeLocationDetails: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }

      // Download the PDF file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weather-export-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast(`Successfully exported ${selectedRecords.length} record(s) to PDF!`, 'success');
      setSelectedRecords([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export PDF';
      showToast(errorMessage, 'error');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Weather Forecast</h1>
        <div className="header-buttons">
          <PersonalLinkedInButton />
          <LinkedInButton />
          <InfoButton />
        </div>
      </header>

      <main className="main">
        <SearchForm onSearch={handleSearch} loading={loading} searchSuccess={searchSuccess} />
        

        {weatherData && (
          <div className="results">
            {weatherData.current && (
              <WeatherCard current={weatherData.current} />
            )}
            
            {weatherData.forecast && weatherData.forecast.length > 0 && (
              <ForecastList forecast={weatherData.forecast} />
            )}
          </div>
        )}

        <SavedList 
          records={savedRecords} 
          onRecordUpdate={handleRecordUpdate}
          selectedRecords={selectedRecords}
          onRecordSelection={handleRecordSelection}
          onSelectAll={handleSelectAll}
          onExportToPDF={handleExportToPDF}
          exportLoading={exportLoading}
        />
      </main>

      <footer className="footer">
        <p>Data: Open-Meteo (Forecast) & Open-Meteo Geocoding</p>
      </footer>

        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
          duration={toast.type === 'error' ? 6000 : 4000}
        />
        
        <LoadingBackdrop 
          isVisible={loading}
          message="Searching for weather data..."
        />
      </div>
    );
}

export default WeatherApp;
