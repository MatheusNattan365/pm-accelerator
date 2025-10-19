import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import LandingPage from './components/LandingPage';

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
