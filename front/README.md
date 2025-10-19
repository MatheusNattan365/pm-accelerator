# Weather Forecast Frontend

A React + Vite + TypeScript weather application that provides current weather conditions and 5-day forecasts with location search and saved search history.

## Features

- **Location Search**: Search by city, landmark, zip code, or coordinates
- **Geolocation**: Use your current location with one click
- **Current Weather**: Temperature, feels-like, humidity, wind speed/gust, precipitation
- **5-Day Forecast**: High/low temperatures, rain chance, UV index
- **Date Range Search**: Optional start/end dates for historical data
- **Saved Searches**: View, edit, and delete your search history
- **Responsive Design**: Works on desktop and mobile devices

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Backend API running (see backend setup)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup environment**:
   Create a `.env` file in the root directory:
   ```bash
   VITE_API_URL=http://localhost:4000
   ```
   Or copy from the example:
   ```bash
   cp env.example .env
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── main.tsx                 # App entry point
├── App.tsx                  # Main app component
├── api.ts                   # API helper functions
├── styles.css              # Global styles
└── components/
    ├── SearchForm.tsx      # Location search form
    ├── WeatherCard.tsx     # Current weather display
    ├── ForecastList.tsx    # 5-day forecast grid
    ├── SavedList.tsx       # Saved searches CRUD
    └── InfoButton.tsx      # PM Accelerator info
```

## API Integration

The app connects to a backend API with the following endpoints:

- `POST /api/weather/search` - Search weather data
- `GET /api/records` - List saved searches
- `PUT /api/records/:id` - Update saved search
- `DELETE /api/records/:id` - Delete saved search

## Usage

### Search Weather

1. Enter a location (city, landmark, zip, or coordinates)
2. Optionally set date range for historical data
3. Click "Use My Location" for geolocation
4. Click "Search Weather" to get results

### Manage Saved Searches

- View all your previous searches
- Click "Edit" to rename a saved search
- Click "Delete" to remove a saved search

### Info Button

Click the "ℹ︎ Info" button to learn about PM Accelerator.

## Data Sources

- **Weather Data**: Open-Meteo (Forecast)
- **Location Data**: Open-Meteo Geocoding

## Technologies Used

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **CSS3** - Styling with utility classes
- **Fetch API** - HTTP requests

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:4000)

## Screenshots

*Screenshots would be added here showing:*
- Search form with location input
- Current weather display
- 5-day forecast grid
- Saved searches list
- Mobile responsive design

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the PM Accelerator program.
