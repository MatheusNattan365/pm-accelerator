import { IRecord } from '../models/Record';

export type ExportFormat = 'json' | 'csv' | 'md';

export interface ExportOptions {
  format: ExportFormat;
  records: IRecord[];
}
export interface ExportBody {
  recordIds: string[];
}

export class ExportService {
  /**
   * Export records in the specified format
   * @param options - Export options
   * @returns Formatted export string
   */
  static exportRecords(options: ExportOptions): string {
    switch (options.format) {
      case 'json':
        return this.exportAsJSON(options.records);
      case 'csv':
        return this.exportAsCSV(options.records);
      case 'md':
        return this.exportAsMarkdown(options.records);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export records as JSON
   * @param records - Records to export
   * @returns JSON string
   */
  private static exportAsJSON(records: IRecord[]): string {
    const exportData = records.map(record => ({
      id: record._id,
      queryRaw: record.queryRaw,
      location: record.location,
      dateRange: record.dateRange,
      snapshot: record.snapshot,
      title: record.title,
      notes: record.notes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }));

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export records as CSV
   * @param records - Records to export
   * @returns CSV string
   */
  private static exportAsCSV(records: IRecord[]): string {
    if (records.length === 0) {
      return 'No records to export';
    }

    const headers = [
      'ID',
      'Query',
      'Location Name',
      'Country',
      'Admin1',
      'Latitude',
      'Longitude',
      'Date Range Start',
      'Date Range End',
      'Title',
      'Notes',
      'Created At',
      'Updated At'
    ];

    const rows = records.map(record => [
      (record._id as any).toString(),
      this.escapeCsvField(record.queryRaw),
      this.escapeCsvField(record.location.name),
      this.escapeCsvField(record.location.country),
      this.escapeCsvField(record.location.admin1),
      record.location.lat.toString(),
      record.location.lon.toString(),
      record.dateRange.start || '',
      record.dateRange.end || '',
      this.escapeCsvField(record.title || ''),
      this.escapeCsvField(record.notes || ''),
      record.createdAt.toISOString(),
      record.updatedAt.toISOString()
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Export records as Markdown
   * @param records - Records to export
   * @returns Markdown string
   */
  private static exportAsMarkdown(records: IRecord[]): string {
    if (records.length === 0) {
      return '# Weather Records Export\n\nNo records to export.';
    }

    let markdown = '# Weather Records Export\n\n';
    markdown += `**Export Date:** ${new Date().toISOString()}\n`;
    markdown += `**Total Records:** ${records.length}\n\n`;

    records.forEach((record, index) => {
      markdown += `## Record ${index + 1}\n\n`;
      markdown += `**ID:** \`${record._id}\`\n\n`;
      markdown += `**Query:** ${record.queryRaw}\n\n`;
      markdown += `**Location:** ${record.location.name}, ${record.location.admin1}, ${record.location.country}\n\n`;
      markdown += `**Coordinates:** ${record.location.lat}, ${record.location.lon}\n\n`;
      
      if (record.dateRange.start || record.dateRange.end) {
        markdown += `**Date Range:** ${record.dateRange.start || 'N/A'} to ${record.dateRange.end || 'N/A'}\n\n`;
      }
      
      if (record.title) {
        markdown += `**Title:** ${record.title}\n\n`;
      }
      
      if (record.notes) {
        markdown += `**Notes:**\n${record.notes}\n\n`;
      }

      if (record.snapshot.current) {
        markdown += `**Current Weather:**\n`;
        markdown += `- Temperature: ${record.snapshot.current.temperature_2m}°C\n`;
        markdown += `- Apparent Temperature: ${record.snapshot.current.apparent_temperature}°C\n`;
        markdown += `- Humidity: ${record.snapshot.current.relative_humidity_2m}%\n`;
        markdown += `- Wind Speed: ${record.snapshot.current.wind_speed_10m} km/h\n`;
        markdown += `- Precipitation: ${record.snapshot.current.precipitation} mm\n\n`;
      }

      if (record.snapshot.daily && record.snapshot.daily.time) {
        markdown += `**Daily Forecast:**\n\n`;
        markdown += `| Date | Max Temp | Min Temp | Weather | Precipitation |\n`;
        markdown += `|------|----------|----------|---------|---------------|\n`;
        
        for (let i = 0; i < record.snapshot.daily.time.length; i++) {
          const date = record.snapshot.daily.time[i];
          const maxTemp = record.snapshot.daily.temperature_2m_max?.[i] || 'N/A';
          const minTemp = record.snapshot.daily.temperature_2m_min?.[i] || 'N/A';
          const weather = record.snapshot.daily.weather_code?.[i] || 'N/A';
          const precipitation = record.snapshot.daily.precipitation_probability_max?.[i] || 'N/A';
          
          markdown += `| ${date} | ${maxTemp}°C | ${minTemp}°C | ${weather} | ${precipitation}% |\n`;
        }
        markdown += `\n`;
      }

      markdown += `**Created:** ${record.createdAt.toISOString()}\n`;
      markdown += `**Updated:** ${record.updatedAt.toISOString()}\n\n`;
      markdown += `---\n\n`;
    });

    return markdown;
  }

  /**
   * Escape CSV field to handle commas, quotes, and newlines
   * @param field - Field value to escape
   * @returns Escaped field value
   */
  private static escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  /**
   * Get MIME type for export format
   * @param format - Export format
   * @returns MIME type
   */
  static getMimeType(format: ExportFormat): string {
    switch (format) {
      case 'json':
        return 'application/json';
      case 'csv':
        return 'text/csv';
      case 'md':
        return 'text/markdown';
      default:
        return 'text/plain';
    }
  }

  /**
   * Get file extension for export format
   * @param format - Export format
   * @returns File extension
   */
  static getFileExtension(format: ExportFormat): string {
    switch (format) {
      case 'json':
        return 'json';
      case 'csv':
        return 'csv';
      case 'md':
        return 'md';
      default:
        return 'txt';
    }
  }
}
