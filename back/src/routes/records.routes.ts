import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { updateRecordSchema, recordsQuerySchema, exportQuerySchema, pdfExportSchema, UpdateRecordRequest, RecordsQueryRequest, PDFExportRequest, exportBodySchema } from '../validators/schemas';
import { Record } from '../models/Record';
import { GeocodingService } from '../services/geocode.service';
import { WeatherService } from '../services/weather.service';
import { ExportBody, ExportOptions, ExportService } from '../lib/export';
import { PDFService } from '../services/pdf.service';
import { asyncHandler, CustomError } from '../middleware/error';

const router = Router();
const geocodingService = new GeocodingService();
const weatherService = new WeatherService();
const pdfService = new PDFService();

/**
 * GET /api/records
 * List records with optional filtering
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  // Validate query parameters
  const validatedQuery: RecordsQueryRequest = recordsQuerySchema.parse(req.query);
  const { q, from, to, limit } = validatedQuery;

  // Build filter object
  const filter: any = {};

  // Text search
  if (q) {
    filter.$or = [
      { 'location.name': { $regex: q, $options: 'i' } },
      { 'location.country': { $regex: q, $options: 'i' } },
      { title: { $regex: q, $options: 'i' } },
      { notes: { $regex: q, $options: 'i' } },
      { queryRaw: { $regex: q, $options: 'i' } }
    ];
  }

  // Date range filter (on createdAt)
  if (from || to) {
    filter.createdAt = {};
    if (from) {
      filter.createdAt.$gte = new Date(from);
    }
    if (to) {
      // Add one day to include the entire end date
      const endDate = new Date(to);
      endDate.setDate(endDate.getDate() + 1);
      filter.createdAt.$lt = endDate;
    }
  }

  // Build query
  const query = Record.find(filter).sort({ createdAt: -1 });

  // Apply limit
  if (limit) {
    query.limit(limit);
  }

  const records = await query.exec();

  // Format response
  const formattedRecords = records.map(record => ({
    id: record._id,
    queryRaw: record.queryRaw,
    location: record.location,
    dateRange: record.dateRange,
    snapshot: record.snapshot,
    youtubeSuggestions: record.youtubeSuggestions,
    title: record.title,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  }));

  res.json({
    success: true,
    data: {
      records: formattedRecords,
      count: formattedRecords.length,
      filters: {
        q,
        from,
        to,
        limit
      }
    }
  });
}));

/**
 * GET /api/records/:id
 * Get a specific record by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new CustomError('Invalid record ID format', 400);
  }

  const record = await Record.findById(id);
  
  if (!record) {
    throw new CustomError('Record not found', 404);
  }

  res.json({
    success: true,
    data: {
      record: {
        id: record._id,
        queryRaw: record.queryRaw,
        location: record.location,
        dateRange: record.dateRange,
        snapshot: record.snapshot,
        youtubeSuggestions: record.youtubeSuggestions,
        title: record.title,
        notes: record.notes,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }
    }
  });
}));

/**
 * PUT /api/records/:id
 * Update a specific record
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new CustomError('Invalid record ID format', 400);
  }

  // Validate request body
  const validatedData: UpdateRecordRequest = updateRecordSchema.parse(req.body.location);
  const { name } = validatedData;

  const record = await Record.findById(id);
  
  if (!record) {
    throw new CustomError('Record not found', 404);
  }

  if (name !== undefined) {
    record.location.admin1 = `${record.location.name}, ${record.location.admin1}`
    record.location.name = name;
  }

  const updatedRecord = await record.save();

  res.json({
    success: true,
    data: {
      record: {
        id: updatedRecord._id,
        queryRaw: updatedRecord.queryRaw,
        location: updatedRecord.location,
        dateRange: updatedRecord.dateRange,
        snapshot: updatedRecord.snapshot,
        youtubeSuggestions: updatedRecord.youtubeSuggestions,
        title: updatedRecord.title,
        notes: updatedRecord.notes,
        createdAt: updatedRecord.createdAt,
        updatedAt: updatedRecord.updatedAt
      }
    }
  });
}));

/**
 * DELETE /api/records/:id
 * Delete a specific record
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new CustomError('Invalid record ID format', 400);
  }

  const record = await Record.findByIdAndDelete(id);
  
  if (!record) {
    throw new CustomError('Record not found', 404);
  }

  res.json({
    success: true,
    message: 'Record deleted successfully',
    data: {
      deletedRecordId: id
    }
  });
}));

/**
 * GET /api/records/export/all
 * Export all records in specified format
 */
router.get('/export/all', asyncHandler(async (req: Request, res: Response) => {
  // Validate query parameters
  const validatedQuery = exportQuerySchema.parse(req.query);
  const { format } = validatedQuery;
  const validatedBody: ExportBody = exportBodySchema.parse(req.body);
  const { recordIds } = validatedBody;

  // Get all records
  const records = await Record.find({ _id: { $in: recordIds } });

  // Export records
  const exportData = ExportService.exportRecords({
    format,
    records
  });

  // Set appropriate headers
  const filename = `weather-records-export-${new Date().toISOString().split('T')[0]}.${ExportService.getFileExtension(format)}`;
  
  res.setHeader('Content-Type', ExportService.getMimeType(format));
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', Buffer.byteLength(exportData, 'utf8'));

  res.send(exportData);
}));

/**
 * POST /api/export/pdf
 * Export selected records as PDF
 */
router.post('/export/pdf', asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData: PDFExportRequest = pdfExportSchema.parse(req.body);
  const { recordIds, title, includeWeatherData, includeLocationDetails, includeYouTubeSuggestions } = validatedData;

  // Validate record IDs
  const validIds = recordIds.filter(id => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length === 0) {
    throw new CustomError('No valid record IDs provided', 400);
  }

  // Find records
  const records = await Record.find({ _id: { $in: validIds } });
  
  if (records.length === 0) {
    throw new CustomError('No records found with the provided IDs', 404);
  }

  if (records.length !== validIds.length) {
    throw new CustomError(`Only ${records.length} out of ${validIds.length} records were found`, 404);
  }

  try {
    // Generate PDF
    const pdfBuffer = await pdfService.generateWeatherReportPDF(records, {
      recordIds: validIds,
      title: title || 'Weather Report',
      includeWeatherData,
      includeLocationDetails,
      includeYouTubeSuggestions
    });

    // Set response headers for PDF download
    const filename = `weather-report-${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (pdfError) {
    console.error('PDF generation failed:', pdfError);
    throw new CustomError(`Failed to generate PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`, 500);
  }
}));

export default router;
