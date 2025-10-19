import puppeteer from 'puppeteer';
import { IRecord } from '../models/Record';

export interface PDFExportOptions {
  recordIds: string[];
  title?: string;
  includeWeatherData?: boolean;
  includeLocationDetails?: boolean;
  includeYouTubeSuggestions?: boolean;
}

export class PDFService {
  /**
   * Generate PDF from weather records
   * @param records - Array of weather records
   * @param options - PDF generation options
   * @returns PDF buffer
   */
  async generateWeatherReportPDF(records: IRecord[], options: PDFExportOptions): Promise<Buffer> {
    let browser;
    
    try {
      // Launch browser with more robust configuration for Docker
      browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
        timeout: 30000
      });

      const page = await browser.newPage();
      
      // Set viewport for consistent rendering
      await page.setViewport({ width: 1200, height: 800 });
      
      // Generate HTML content
      const htmlContent = this.generateHTMLContent(records, options);
      
      // Set content with timeout
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      // Generate PDF with error handling
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: this.getHeaderTemplate(),
        footerTemplate: this.getFooterTemplate(),
        timeout: 30000
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.warn('Error closing browser:', closeError);
        }
      }
    }
  }

  /**
   * Generate HTML content for PDF
   * @param records - Weather records
   * @param options - PDF options
   * @returns HTML string
   */
  private generateHTMLContent(records: IRecord[], options: PDFExportOptions): string {
    const title = this.escapeHtml(options.title || 'Weather Research Report');
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          ${this.getCSSStyles()}
        </style>
      </head>
      <body>
        <div class="container">
          <header class="report-header">
            <div class="header-content">
              <h1>${title}</h1>
              <div class="header-meta">
                <div class="meta-item">
                  <span class="meta-label">Generated:</span>
                  <span class="meta-value">${currentDate}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Total Records:</span>
                  <span class="meta-value">${records.length}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Report ID:</span>
                  <span class="meta-value">${this.generateReportId()}</span>
                </div>
              </div>
            </div>
          </header>

          <main class="report-content">
            ${records.map((record, index) => this.generateRecordHTML(record, index + 1, options)).join('')}
          </main>

          <footer class="report-footer">
            <div class="footer-content">
              <p>This report was generated automatically by the Weather Research System</p>
              <p>For technical support, contact the system administrator</p>
            </div>
          </footer>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML for a single record
   * @param record - Weather record
   * @param index - Record index
   * @param options - PDF options
   * @returns HTML string
   */
  private generateRecordHTML(record: IRecord, index: number, options: PDFExportOptions): string {
    const location = record.location;
    const dateRange = record.dateRange;
    const weatherData = record.snapshot;
    const createdDate = new Date(record.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `
      <div class="record">
        <div class="record-header">
          <div class="record-title">
            <h2>Record #${index}</h2>
            <div class="record-badge">${this.getRecordTypeBadge(record)}</div>
          </div>
          <div class="record-meta">
            <div class="meta-grid">
              <div class="meta-item">
                <span class="meta-label">Record ID:</span>
                <span class="meta-value">${this.escapeHtml(this.safeString(record._id))}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Created:</span>
                <span class="meta-value">${createdDate}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Updated:</span>
                <span class="meta-value">${new Date(record.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="record-content">
          <div class="location-section">
            <div class="section-header">
              <h3>📍 Location Information</h3>
              <div class="section-icon">🌍</div>
            </div>
            <div class="location-details">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Location Name:</span>
                  <span class="detail-value">${this.escapeHtml(this.safeString(location.name))}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Country:</span>
                  <span class="detail-value">${this.escapeHtml(this.safeString(location.country))}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">State/Province:</span>
                  <span class="detail-value">${this.escapeHtml(this.safeString(location.admin1))}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Coordinates:</span>
                  <span class="detail-value">${location.lat.toFixed(6)}, ${location.lon.toFixed(6)}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Resolution Method:</span>
                  <span class="detail-value">${this.escapeHtml(this.getResolvedByText(location.resolvedBy))}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Original Query:</span>
                  <span class="detail-value">${this.escapeHtml(this.safeString(record.queryRaw))}</span>
                </div>
              </div>
              <div class="location-stats">
                <div class="stat-item">
                  <span class="stat-label">Latitude:</span>
                  <span class="stat-value">${location.lat >= 0 ? 'N' : 'S'} ${Math.abs(location.lat).toFixed(4)}°</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Longitude:</span>
                  <span class="stat-value">${location.lon >= 0 ? 'E' : 'W'} ${Math.abs(location.lon).toFixed(4)}°</span>
                </div>
              </div>
            </div>
          </div>

          ${dateRange.start || dateRange.end ? `
            <div class="date-section">
              <div class="section-header">
                <h3>📅 Time Period</h3>
                <div class="section-icon">⏰</div>
              </div>
              <div class="date-details">
                <div class="date-grid">
                  ${dateRange.start ? `
                    <div class="date-item">
                      <span class="date-label">Start Date:</span>
                      <span class="date-value">${this.escapeHtml(this.safeString(dateRange.start))}</span>
                    </div>
                  ` : ''}
                  ${dateRange.end ? `
                    <div class="date-item">
                      <span class="date-label">End Date:</span>
                      <span class="date-value">${this.escapeHtml(this.safeString(dateRange.end))}</span>
                    </div>
                  ` : ''}
                  ${dateRange.start && dateRange.end ? `
                    <div class="date-item">
                      <span class="date-label">Duration:</span>
                      <span class="date-value">${this.calculateDuration(dateRange.start, dateRange.end)}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          ` : ''}

          ${options.includeWeatherData && weatherData ? this.generateWeatherDataHTML(weatherData) : ''}

          ${record.title || record.notes ? `
            <div class="notes-section">
              <div class="section-header">
                <h3>📝 Additional Information</h3>
                <div class="section-icon">📋</div>
              </div>
              <div class="notes-content">
                ${record.title ? `
                  <div class="note-item">
                    <span class="note-label">Title:</span>
                    <span class="note-value">${this.escapeHtml(this.safeString(record.title))}</span>
                  </div>
                ` : ''}
                ${record.notes ? `
                  <div class="note-item">
                    <span class="note-label">Notes:</span>
                    <span class="note-value">${this.escapeHtml(this.safeString(record.notes))}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          ${options.includeYouTubeSuggestions && record.youtubeSuggestions && record.youtubeSuggestions.length > 0 ? `
            <div class="youtube-section">
              <div class="section-header">
                <h3>🎥 Things to Do in ${this.escapeHtml(this.safeString(location.name))}</h3>
                <div class="section-icon">📺</div>
              </div>
              <div class="youtube-content">
                <div class="youtube-intro">
                  <p>Discover exciting activities and attractions in ${this.escapeHtml(this.safeString(location.name))} with these curated video suggestions:</p>
                </div>
                <div class="youtube-videos">
                  ${record.youtubeSuggestions.map((video, videoIndex) => `
                    <div class="youtube-video">
                      <div class="video-header">
                        <div class="video-number">${videoIndex + 1}</div>
                        <div class="video-info">
                          <h4 class="video-title">${this.escapeHtml(this.safeString(video.title))}</h4>
                          <div class="video-channel">by ${this.escapeHtml(this.safeString(video.channelTitle))}</div>
                        </div>
                      </div>
                      <div class="video-thumbnail">
                        <img src="${this.escapeHtml(this.safeString(video.thumbnail))}" alt="Video thumbnail" class="thumbnail-img" />
                      </div>
                      <div class="video-link">
                        <span class="link-label">Watch on YouTube:</span>
                        <a href="${this.escapeHtml(this.safeString(video.url))}" class="youtube-link">${this.escapeHtml(this.safeString(video.url))}</a>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Generate HTML for weather data
   * @param weatherData - Weather data
   * @returns HTML string
   */
  private generateWeatherDataHTML(weatherData: any): string {
    let html = `
      <div class="weather-section">
        <div class="section-header">
          <h3>🌤️ Weather Data</h3>
          <div class="section-icon">🌡️</div>
        </div>
    `;
    
    try {
      // Current weather
      if (weatherData && weatherData.current) {
        html += `
          <div class="current-weather">
            <div class="subsection-header">
              <h4>Current Conditions</h4>
              <div class="weather-icon">🌡️</div>
            </div>
            <div class="weather-grid">
        `;
        
        const current = weatherData.current;
        
        if (current.temperature_2m !== undefined && current.temperature_2m !== null) {
          const temp = parseFloat(this.safeString(current.temperature_2m));
          const tempF = (temp * 9/5) + 32;
          html += `
            <div class="weather-card temperature">
              <div class="card-icon">🌡️</div>
              <div class="card-content">
                <div class="card-label">Temperature</div>
                <div class="card-value">${temp.toFixed(1)}°C</div>
                <div class="card-subvalue">${tempF.toFixed(1)}°F</div>
              </div>
            </div>
          `;
        }
        
        if (current.relative_humidity_2m !== undefined && current.relative_humidity_2m !== null) {
          const humidity = parseFloat(this.safeString(current.relative_humidity_2m));
          html += `
            <div class="weather-card humidity">
              <div class="card-icon">💧</div>
              <div class="card-content">
                <div class="card-label">Humidity</div>
                <div class="card-value">${humidity}%</div>
                <div class="card-subvalue">${this.getHumidityDescription(humidity)}</div>
              </div>
            </div>
          `;
        }
        
        if (current.wind_speed_10m !== undefined && current.wind_speed_10m !== null) {
          const windSpeed = parseFloat(this.safeString(current.wind_speed_10m));
          const windMph = windSpeed * 0.621371;
          html += `
            <div class="weather-card wind">
              <div class="card-icon">💨</div>
              <div class="card-content">
                <div class="card-label">Wind Speed</div>
                <div class="card-value">${windSpeed.toFixed(1)} km/h</div>
                <div class="card-subvalue">${windMph.toFixed(1)} mph</div>
              </div>
            </div>
          `;
        }
        
        if (current.precipitation !== undefined && current.precipitation !== null) {
          const precipitation = parseFloat(this.safeString(current.precipitation));
          html += `
            <div class="weather-card precipitation">
              <div class="card-icon">🌧️</div>
              <div class="card-content">
                <div class="card-label">Precipitation</div>
                <div class="card-value">${precipitation} mm</div>
                <div class="card-subvalue">${(precipitation * 0.0393701).toFixed(2)} in</div>
              </div>
            </div>
          `;
        }
        
        if (current.apparent_temperature !== undefined && current.apparent_temperature !== null) {
          const apparentTemp = parseFloat(this.safeString(current.apparent_temperature));
          const apparentTempF = (apparentTemp * 9/5) + 32;
          html += `
            <div class="weather-card apparent-temp">
              <div class="card-icon">🤔</div>
              <div class="card-content">
                <div class="card-label">Feels Like</div>
                <div class="card-value">${apparentTemp.toFixed(1)}°C</div>
                <div class="card-subvalue">${apparentTempF.toFixed(1)}°F</div>
              </div>
            </div>
          `;
        }
        
        html += '</div></div>';
      }

      // Daily weather
      if (weatherData && weatherData.daily && weatherData.daily.time && Array.isArray(weatherData.daily.time)) {
        html += `
          <div class="daily-weather">
            <div class="subsection-header">
              <h4>Daily Forecast</h4>
              <div class="weather-icon">📅</div>
            </div>
            <div class="daily-grid">
        `;
        
        for (let i = 0; i < weatherData.daily.time.length; i++) {
          const date = weatherData.daily.time[i];
          const maxTemp = weatherData.daily.temperature_2m_max?.[i];
          const minTemp = weatherData.daily.temperature_2m_min?.[i];
          const precipitation = weatherData.daily.precipitation_probability_max?.[i];
          const sunrise = weatherData.daily.sunrise?.[i];
          const sunset = weatherData.daily.sunset?.[i];
          const uvIndex = weatherData.daily.uv_index_max?.[i];
          
          try {
            const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            }) : 'Invalid Date';
            
            html += `
              <div class="daily-card">
                <div class="daily-header">
                  <div class="daily-date">${this.escapeHtml(formattedDate)}</div>
                  <div class="daily-icon">${this.getWeatherIcon(precipitation)}</div>
                </div>
                <div class="daily-temps">
                  ${maxTemp !== undefined && maxTemp !== null ? `
                    <div class="temp-high">
                      <span class="temp-label">High</span>
                      <span class="temp-value">${this.safeString(maxTemp)}°C</span>
                    </div>
                  ` : ''}
                  ${minTemp !== undefined && minTemp !== null ? `
                    <div class="temp-low">
                      <span class="temp-label">Low</span>
                      <span class="temp-value">${this.safeString(minTemp)}°C</span>
                    </div>
                  ` : ''}
                </div>
                <div class="daily-details">
                  ${precipitation !== undefined && precipitation !== null ? `
                    <div class="detail-row">
                      <span class="detail-label">Rain:</span>
                      <span class="detail-value">${this.safeString(precipitation)}%</span>
                    </div>
                  ` : ''}
                  ${uvIndex !== undefined && uvIndex !== null ? `
                    <div class="detail-row">
                      <span class="detail-label">UV Index:</span>
                      <span class="detail-value">${this.safeString(uvIndex)}</span>
                    </div>
                  ` : ''}
                  ${sunrise ? `
                    <div class="detail-row">
                      <span class="detail-label">Sunrise:</span>
                      <span class="detail-value">${new Date(sunrise).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ` : ''}
                  ${sunset ? `
                    <div class="detail-row">
                      <span class="detail-label">Sunset:</span>
                      <span class="detail-value">${new Date(sunset).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          } catch (dateError) {
            console.warn('Error formatting date:', dateError);
            html += `
              <div class="daily-card">
                <div class="daily-header">
                  <div class="daily-date">Invalid Date</div>
                </div>
                <div class="daily-temps">-</div>
              </div>
            `;
          }
        }
        
        html += '</div></div>';
      }
    } catch (error) {
      console.warn('Error generating weather data HTML:', error);
      html += '<div class="weather-error">Error processing weather data</div>';
    }

    html += '</div>';
    return html;
  }

  /**
   * Get resolved by text in English
   * @param resolvedBy - Resolution method
   * @returns English text
   */
  private getResolvedByText(resolvedBy: string): string {
    const translations: { [key: string]: string } = {
      'coords': 'GPS Coordinates',
      'geocoding': 'Geocoding',
      'zipcode': 'Postal Code',
      'landmark': 'Point of Interest'
    };
    return translations[resolvedBy] || resolvedBy;
  }

  /**
   * Get record type badge
   * @param record - Weather record
   * @returns Badge text
   */
  private getRecordTypeBadge(record: IRecord): string {
    if (record.dateRange.start || record.dateRange.end) {
      return 'Historical';
    }
    return 'Current';
  }

  /**
   * Generate report ID
   * @returns Report ID
   */
  private generateReportId(): string {
    return `WR-${Date.now().toString(36).toUpperCase()}`;
  }

  /**
   * Calculate duration between dates
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Duration string
   */
  private calculateDuration(startDate: string, endDate: string): string {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        return '1 day';
      } else if (diffDays < 7) {
        return `${diffDays} days`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''}`;
      } else {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''}`;
      }
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * Get humidity description
   * @param humidity - Humidity percentage
   * @returns Description
   */
  private getHumidityDescription(humidity: number): string {
    if (humidity < 30) return 'Dry';
    if (humidity < 50) return 'Comfortable';
    if (humidity < 70) return 'Moderate';
    return 'Humid';
  }

  /**
   * Get weather icon based on precipitation
   * @param precipitation - Precipitation probability
   * @returns Weather icon
   */
  private getWeatherIcon(precipitation: number | undefined): string {
    if (precipitation === undefined || precipitation === null) return '☀️';
    if (precipitation < 20) return '☀️';
    if (precipitation < 50) return '⛅';
    if (precipitation < 80) return '🌦️';
    return '🌧️';
  }

  /**
   * Get CSS styles for PDF
   * @returns CSS string
   */
  private getCSSStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
        line-height: 1.6;
        color: #1a1a1a;
        background: #ffffff;
        font-size: 14px;
      }

      .container {
        max-width: 100%;
        margin: 0 auto;
        padding: 0;
      }

      .report-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 40px 30px;
        margin-bottom: 30px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
      }

      .header-content h1 {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 20px;
        text-align: center;
        letter-spacing: -0.5px;
      }

      .header-meta {
        display: flex;
        justify-content: center;
        gap: 40px;
        flex-wrap: wrap;
      }

      .meta-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .meta-label {
        font-size: 12px;
        opacity: 0.8;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .meta-value {
        font-size: 16px;
        font-weight: 600;
      }

      .record {
        margin-bottom: 40px;
        page-break-inside: avoid;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        background: white;
      }

      .record-header {
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        padding: 24px 30px;
        border-bottom: 1px solid #e5e7eb;
      }

      .record-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .record-title h2 {
        color: #1e293b;
        font-size: 24px;
        font-weight: 700;
        margin: 0;
      }

      .record-badge {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .meta-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .meta-item {
        display: flex;
        flex-direction: column;
      }

      .meta-label {
        font-size: 11px;
        color:rgb(255, 255, 255);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
        font-weight: 600;
      }

      .meta-value {
        font-size: 14px;
        color: #1e293b;
        font-weight: 500;
      }

      .record-content {
        padding: 30px;
      }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid #e5e7eb;
      }

      .section-header h3 {
        color: #1e293b;
        font-size: 18px;
        font-weight: 700;
        margin: 0;
      }

      .section-icon {
        font-size: 20px;
      }

      .subsection-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .subsection-header h4 {
        color: #374151;
        font-size: 16px;
        font-weight: 600;
        margin: 0;
      }

      .weather-icon {
        font-size: 18px;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
        margin-bottom: 20px;
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #f8fafc;
        border-radius: 8px;
        border-left: 4px solid #3b82f6;
      }

      .detail-label {
        font-weight: 600;
        color: #374151;
        font-size: 13px;
      }

      .detail-value {
        font-weight: 500;
        color: #1e293b;
        font-size: 14px;
      }

      .location-stats {
        display: flex;
        gap: 20px;
        margin-top: 16px;
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 16px;
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        border-radius: 12px;
        flex: 1;
      }

      .stat-label {
        font-size: 12px;
        color: #1e40af;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }

      .stat-value {
        font-size: 16px;
        color: #1e40af;
        font-weight: 700;
      }

      .date-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .date-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #fef3c7;
        border-radius: 8px;
        border-left: 4px solid #f59e0b;
      }

      .date-label {
        font-weight: 600;
        color: #92400e;
        font-size: 13px;
      }

      .date-value {
        font-weight: 500;
        color: #92400e;
        font-size: 14px;
      }

      .weather-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-top: 16px;
      }

      .weather-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
        transition: transform 0.2s ease;
      }

      .weather-card.temperature {
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        border-color: #fca5a5;
      }

      .weather-card.humidity {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        border-color: #93c5fd;
      }

      .weather-card.wind {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border-color: #86efac;
      }

      .weather-card.precipitation {
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border-color: #7dd3fc;
      }

      .weather-card.apparent-temp {
        background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
        border-color: #fde047;
      }

      .card-icon {
        font-size: 24px;
        margin-bottom: 8px;
      }

      .card-label {
        font-size: 12px;
        color: #6b7280;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }

      .card-value {
        font-size: 20px;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 4px;
      }

      .card-subvalue {
        font-size: 12px;
        color: #6b7280;
        font-weight: 500;
      }

      .daily-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
        margin-top: 16px;
      }

      .daily-card {
        background: white;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        border: 1px solid #e5e7eb;
      }

      .daily-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e5e7eb;
      }

      .daily-date {
        font-weight: 600;
        color: #374151;
        font-size: 13px;
      }

      .daily-icon {
        font-size: 18px;
      }

      .daily-temps {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .temp-high, .temp-low {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .temp-label {
        font-size: 10px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 2px;
      }

      .temp-value {
        font-size: 16px;
        font-weight: 700;
      }

      .temp-high .temp-value {
        color: #dc2626;
      }

      .temp-low .temp-value {
        color: #2563eb;
      }

      .daily-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
      }

      .detail-label {
        color: #6b7280;
        font-weight: 500;
      }

      .detail-value {
        color: #374151;
        font-weight: 600;
      }

      .notes-content {
        background: #f8fafc;
        padding: 20px;
        border-radius: 8px;
        border-left: 4px solid #10b981;
      }

      .note-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 12px;
      }

      .note-item:last-child {
        margin-bottom: 0;
      }

      .note-label {
        font-weight: 600;
        color: #374151;
        font-size: 13px;
      }

      .note-value {
        color: #1e293b;
        font-size: 14px;
        line-height: 1.5;
      }

      .weather-error {
        background: #fef2f2;
        color: #dc2626;
        padding: 16px;
        border-radius: 8px;
        text-align: center;
        border: 1px solid #fca5a5;
      }

      .report-footer {
        margin-top: 40px;
        padding: 20px;
        background: #f8fafc;
        border-radius: 8px;
        text-align: center;
      }

      .footer-content p {
        color: #6b7280;
        font-size: 12px;
        margin-bottom: 4px;
      }

      /* YouTube Suggestions Styles */
      .youtube-section {
        margin-top: 30px;
        padding: 24px;
        background: linear-gradient(135deg, #fef3f2 0%, #fef7f0 100%);
        border-radius: 12px;
        border: 1px solid #fed7d7;
      }

      .youtube-content {
        margin-top: 16px;
      }

      .youtube-intro {
        margin-bottom: 20px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 8px;
        border-left: 4px solid #ff6b6b;
      }

      .youtube-intro p {
        color: #374151;
        font-size: 14px;
        line-height: 1.6;
        margin: 0;
      }

      .youtube-videos {
        display: grid;
        gap: 16px;
      }

      .youtube-video {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
        page-break-inside: avoid;
      }

      .video-header {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 16px;
      }

      .video-number {
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;
        flex-shrink: 0;
      }

      .video-info {
        flex: 1;
      }

      .video-title {
        color: #1e293b;
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 8px 0;
        line-height: 1.4;
      }

      .video-channel {
        color: #6b7280;
        font-size: 13px;
        font-weight: 500;
      }

      .video-thumbnail {
        margin-bottom: 16px;
        text-align: center;
      }

      .thumbnail-img {
        max-width: 200px;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        border: 1px solid #e5e7eb;
      }

      .video-link {
        padding: 12px 16px;
        background: #f8fafc;
        border-radius: 8px;
        border-left: 4px solid #3b82f6;
      }

      .link-label {
        display: block;
        font-size: 12px;
        color: #6b7280;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }

      .youtube-link {
        color: #dc2626;
        text-decoration: none;
        font-size: 13px;
        font-weight: 500;
        word-break: break-all;
        line-height: 1.4;
      }

      .youtube-link:hover {
        text-decoration: underline;
      }

      @media print {
        .record {
          page-break-inside: avoid;
        }
        
        .report-header {
          background: #667eea !important;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
        
        .weather-card, .daily-card {
          box-shadow: none !important;
          border: 1px solid #e5e7eb !important;
        }
      }
    `;
  }

  /**
   * Get header template for PDF
   * @returns Header HTML
   */
  private getHeaderTemplate(): string {
    return `
      <div style="font-size: 10px; text-align: center; width: 100%; color: #666; padding: 5px;">
        Weather Research Report
      </div>
    `;
  }

  /**
   * Get footer template for PDF
   * @returns Footer HTML
   */
  private getFooterTemplate(): string {
    return `
      <div style="font-size: 10px; text-align: center; width: 100%; color: #666; padding: 5px;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated on ${new Date().toLocaleDateString('en-US')}
      </div>
    `;
  }

  /**
   * Escape HTML special characters
   * @param text - Text to escape
   * @returns Escaped HTML
   */
  private escapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Safely get string value
   * @param value - Value to convert to string
   * @returns Safe string value
   */
  private safeString(value: any): string {
    if (value === null || value === undefined) return '';
    return String(value);
  }
}
