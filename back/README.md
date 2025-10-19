# Weather API

A production-ready REST API that powers a Weather App with full CRUD operations, real-time weather data from Open-Meteo, geocoding services, and export capabilities.

## 🚀 Features

- **Real-time Weather Data**: Fetch current weather and 5-day forecasts from Open-Meteo API
- **Historical Weather**: Access historical weather data with date range queries
- **Geocoding**: Resolve locations from text, coordinates, or postal codes
- **CRUD Operations**: Full Create, Read, Update, Delete operations for weather records
- **Timezone Fixed**: UTC normalization prevents date mismatch issues
- **Better Error Handling**: Proper 404 responses for location not found errors
- **Export Functionality**: Export records in JSON, CSV, Markdown, and PDF formats
- **Robust Validation**: Zod schema validation with comprehensive error handling
- **TypeScript**: Fully typed with excellent developer experience
- **MongoDB Integration**: Persistent storage with Mongoose ODM
- **CORS Support**: Configurable CORS for frontend integration

## 🛠 Tech Stack

- **Node.js 20+** - Runtime environment
- **TypeScript** - Type-safe development
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **Zod** - Schema validation
- **Axios** - HTTP client for external APIs
- **Open-Meteo API** - Free weather data (no API key required)

## 📋 Prerequisites

- Node.js 20 or higher
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🚀 Quickstart

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the environment example file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` file with your configuration:

```env
# Server Configuration
PORT=4000

# Database
MONGODB_URI=mongodb://localhost:27017/weather_app

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# ZipCodeBase API for postal code lookup
ZIPCODEBASE_API_KEY=abb5e680-abd0-11f0-9467-dd9f67a87dcd

# Optional: Reserved for future use
YOUTUBE_API_KEY=
```

### 3. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:4000` with hot reload enabled.

### 4. Test the API

#### Health Check
```bash
curl http://localhost:4000/health
```

#### Search for Weather (Current + Forecast)
```bash
curl -X POST http://localhost:4000/api/weather/search \
  -H "Content-Type: application/json" \
  -d '{"location": "London, UK", "locationType": "city"}'
```

#### Search for Historical Weather
```bash
curl -X POST http://localhost:4000/api/weather/search \
  -H "Content-Type: application/json" \
  -d '{
    "location": "New York",
    "locationType": "city",
    "start": "2023-12-01",
    "end": "2023-12-07"
  }'
```

#### Get All Records
```bash
curl http://localhost:4000/api/records
```

#### Export Records as CSV
```bash
curl http://localhost:4000/api/records/export/all?format=csv
```

## 📚 API Documentation

### Weather Endpoints

#### POST `/api/weather/search`
Search for weather data and save to database.

**Request Body:**
```json
{
  "location": "London, UK",           // Required: location string
  "locationType": "city",             // Optional: location type hint
  "start": "2023-12-01",             // Optional: start date (YYYY-MM-DD)
  "end": "2023-12-07"                // Optional: end date (YYYY-MM-DD)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "record": {
      "id": "507f1f77bcf86cd799439011",
      "queryRaw": "London, UK",
      "location": {
        "name": "London",
        "country": "United Kingdom",
        "admin1": "England",
        "lat": 51.5074,
        "lon": -0.1278,
        "resolvedBy": "geocoding"
      },
      "dateRange": { "start": null, "end": null },
      "snapshot": {
        "current": { /* current weather data */ },
        "daily": { /* 5-day forecast */ },
        "source": "open-meteo"
      },
      "createdAt": "2023-12-01T10:00:00.000Z",
      "updatedAt": "2023-12-01T10:00:00.000Z"
    },
    "weather": { /* same as snapshot */ }
  }
}
```

#### GET `/api/weather/current/:location`
Get current weather without saving to database.
- **Query Parameter**: `?locationType=auto|coordinates|zipcode|landmark|city|address`

#### GET `/api/weather/coordinates/:lat/:lon`
Get weather for specific coordinates.

#### GET `/api/weather/geocode/:location`
Get geocoding information for a location.
- **Query Parameter**: `?locationType=auto|coordinates|zipcode|landmark|city|address`

### Records Endpoints

#### GET `/api/records`
List all records with optional filtering.

**Query Parameters:**
- `q` - Text search
- `from` - Filter from date (YYYY-MM-DD)
- `to` - Filter to date (YYYY-MM-DD)
- `limit` - Maximum number of results

#### GET `/api/records/:id`
Get a specific record by ID.

#### PUT `/api/records/:id`
Update a record.

**Request Body:**
```json
{
  "title": "Updated Title",           // Optional: max 120 chars
  "notes": "Updated notes",           // Optional: max 2000 chars
  "start": "2023-12-01",             // Optional: start date
  "end": "2023-12-07"                // Optional: end date
}
```

#### DELETE `/api/records/:id`
Delete a record.

#### GET `/api/records/export/all`
Export all records.

**Query Parameters:**
- `format` - Export format: `json`, `csv`, or `md` (default: `json`)

#### POST `/api/export/pdf`
Export selected records as PDF.

**Request Body:**
```json
{
  "recordIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "title": "Relatório de Pesquisas Meteorológicas",
  "includeWeatherData": true,
  "includeLocationDetails": true
}
```

**Parameters:**
- `recordIds` - Array of record IDs to export (required)
- `title` - Custom report title (optional, max 100 chars)
- `includeWeatherData` - Include weather data in PDF (optional, default: true)
- `includeLocationDetails` - Include location details in PDF (optional, default: true)

**Response:** PDF file download

## 🏗 Project Structure

```
src/
├── server.ts                 # Main server file
├── middleware/
│   └── error.ts             # Error handling middleware
├── models/
│   └── Record.ts            # MongoDB record model
├── validators/
│   └── schemas.ts           # Zod validation schemas
├── services/
│   ├── geocode.service.ts   # Geocoding service
│   ├── weather.service.ts   # Weather data service
│   ├── pdf.service.ts       # PDF generation service
│   ├── nominatim.service.ts # Nominatim reverse geocoding
│   └── zipcodebase.service.ts # ZipCodeBase postal code lookup
├── routes/
│   ├── weather.routes.ts    # Weather API routes
│   └── records.routes.ts    # Records CRUD routes
└── lib/
    └── export.ts            # Export utilities
```

## 🔧 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## 🌍 Supported Location Formats

The API now supports advanced location search with automatic type detection:

### 📍 Coordinates
- **Decimal Degrees**: `-23.5505,-46.6333`, `51.5074,-0.1278`
- **DMS Format**: `23°33'1.8"S 46°37'59.9"W`, `40°42'51"N 74°0'21"W`
- **Alternative Separators**: `-23.5505; -46.6333`
- **Smart Reverse Geocoding**: Automatically resolves to "City, State, Country" format

### 📮 Postal Codes
- **US ZIP**: `12345`, `12345-6789`
- **Brazilian CEP**: `12345-678`, `12345678` (enhanced with ZipCodeBase API)
- **UK Postcode**: `SW1A 1AA`, `M1 1AA`
- **Canadian Postal**: `K1A 0A6`, `M5V 3A8`

### 🏛️ Landmarks & Points of Interest
- **Airports**: `São Paulo Airport`, `JFK Airport`, `Heathrow Airport`
- **Stations**: `Central Station`, `Grand Central Terminal`
- **Hospitals**: `Hospital das Clínicas`, `Johns Hopkins Hospital`
- **Universities**: `Harvard University`, `University of São Paulo`
- **Museums**: `Louvre Museum`, `Museu do Ipiranga`
- **Parks**: `Central Park`, `Ibirapuera Park`
- **Shopping Centers**: `Times Square`, `Praça da Sé`

### 🏙️ Cities & Addresses
- **Cities**: `São Paulo`, `New York`, `London`, `Tokyo`
- **Cities with State**: `São Paulo, SP`, `New York, NY`
- **Full Addresses**: `Rua Augusta, 123, São Paulo, SP`

### 🔍 Smart Detection
The system automatically detects the input type and applies appropriate processing:
- **Coordinates** → Intelligent reverse geocoding with city/state/country resolution
- **Postal Codes** → Specialized postal code lookup
- **Landmarks** → Enhanced landmark search with context
- **Cities/Addresses** → Standard geocoding with improved accuracy

### 🎯 Location Type Parameter
You can now specify the location type for improved accuracy:

- **`auto`** (default): Automatic type detection
- **`coordinates`**: GPS coordinates (lat,lon)
- **`zipcode`**: Postal/ZIP codes
- **`landmark`**: Points of interest (airports, museums, parks, etc.)
- **`city`**: City names
- **`address`**: Full addresses

**Example:**
```json
{
  "location": "São Paulo",
  "locationType": "city"
}
```

### 🎯 Enhanced Reverse Geocoding
When coordinates are provided, the system now:
- **Nominatim Integration**: Uses OpenStreetMap's Nominatim for detailed location data
- **Rich Location Details**: Returns specific place names, streets, and neighborhoods
- **Multi-Result Search**: Fetches up to 5 nearby locations for better accuracy (fallback)
- **City Prioritization**: Prefers city/town results over other location types
- **Descriptive Naming**: Builds comprehensive location names (e.g., "Sé, São Paulo, São Paulo, Brazil")
- **Robust Fallback**: Multiple fallback strategies for edge cases
- **Complete Information**: Returns the nearest city, state, and country

### 📮 Enhanced Postal Code Lookup
For postal codes, the system now uses:
- **ZipCodeBase API**: Primary service for accurate postal code resolution
- **Brazilian CEP Support**: Enhanced support for Brazilian postal codes
- **Detailed Information**: Returns city, state, province, and coordinates
- **Fallback Support**: Falls back to Open-Meteo if ZipCodeBase is unavailable
- **Smart Result Selection**: Chooses the best result from multiple matches

For detailed examples, see [LOCATION_SEARCH_EXAMPLES.md](./LOCATION_SEARCH_EXAMPLES.md)

### 🕐 Date/Time Fix
The system now properly handles date/time issues:
- **UTC Normalization**: All dates are normalized to UTC to prevent timezone mismatches
- **No More Off-by-One**: Fixed the issue where dates would appear one day earlier
- **Consistent Formatting**: Dates are consistently formatted as YYYY-MM-DD
- **Robust Validation**: Enhanced date validation with proper error handling

### 🚨 Error Handling Improvements
The system now provides better error responses:
- **Location Not Found**: Returns 404 with clear message instead of 500 error
- **Custom Error Types**: Specific error classes for different failure scenarios
- **Frontend-Friendly**: Error responses include helpful information for debugging
- **Consistent Format**: Standardized error response format across all endpoints

### 📄 PDF Export Feature
Generate professional PDF reports from weather research data:
- **Selected Records**: Export specific records by ID
- **Customizable Content**: Choose to include weather data and location details
- **Professional Layout**: Formatted PDF with headers, styling, and pagination
- **Flexible Options**: Custom titles and content selection
- **Automatic Download**: PDF files are automatically downloaded

## 📊 Data Model

### Record Schema
```typescript
{
  queryRaw: string,              // Original search query
  location: {
    name: string,                // Resolved location name
    country: string,             // Country name
    admin1: string,              // State/Province/Region
    lat: number,                 // Latitude
    lon: number,                 // Longitude
    resolvedBy: "coords" | "geocoding" | "zipcode" | "landmark"
  },
  dateRange: {
    start: string | null,        // Start date (YYYY-MM-DD)
    end: string | null           // End date (YYYY-MM-DD)
  },
  snapshot: {
    current: any | null,         // Current weather data
    daily: any | null,           // Daily forecast/historical data
    source: "open-meteo"         // Data source
  },
  title?: string,                // User-defined title (max 120 chars)
  notes?: string,                // User-defined notes (max 2000 chars)
  createdAt: Date,               // Record creation timestamp
  updatedAt: Date                // Record last update timestamp
}
```

## 🚨 Error Handling

The API provides comprehensive error handling:

- **400 Bad Request**: Invalid input, validation errors
- **404 Not Found**: Record not found, invalid routes
- **409 Conflict**: Duplicate records
- **422 Unprocessable Entity**: Business logic errors
- **500 Internal Server Error**: Server errors
- **502 Bad Gateway**: External API errors

All errors follow this format:
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "details": [] // Optional: validation details
  }
}
```

## 🔒 CORS Configuration

Configure allowed origins in your `.env` file:

```env
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## 🚀 Production Deployment

### 1. Build the Application
```bash
npm run build
```

### 2. Start Production Server
```bash
npm start
```

### 3. Environment Variables for Production
```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb://your-production-db:27017/weather_app
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

## 🧪 Testing Examples

### Search Current Weather
```bash
curl -X POST http://localhost:4000/api/weather/search \
  -H "Content-Type: application/json" \
  -d '{"location": "Paris, France", "locationType": "city"}'
```

### Search Historical Weather
```bash
curl -X POST http://localhost:4000/api/weather/search \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Tokyo, Japan",
    "locationType": "city",
    "start": "2023-11-01",
    "end": "2023-11-05"
  }'
```

### Update Record with Title and Notes
```bash
curl -X PUT http://localhost:4000/api/records/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Weekend Trip Weather",
    "notes": "Planning a weekend trip to London. Need to check weather conditions."
  }'
```

### Export Records as Markdown
```bash
curl http://localhost:4000/api/records/export/all?format=md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the API documentation above
2. Review the error messages in responses
3. Ensure your MongoDB instance is running
4. Verify your environment variables are set correctly

---

**Happy Weather Tracking! 🌤️**
