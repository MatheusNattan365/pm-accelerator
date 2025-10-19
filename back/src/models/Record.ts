import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation {
  name: string;
  country: string;
  admin1: string;
  lat: number;
  lon: number;
  resolvedBy: 'coords' | 'geocoding' | 'zipcode' | 'landmark';
}

export interface IDateRange {
  start: string | null;
  end: string | null;
}

export interface ISnapshot {
  current: any | null;
  daily: any | null;
  source: 'open-meteo';
}

export interface IYouTubeVideo {
  title: string;
  url: string;
  thumbnail: string;
  channelTitle: string;
}

export interface IRecord extends Document {
  queryRaw: string;
  location: ILocation;
  dateRange: IDateRange;
  snapshot: ISnapshot;
  youtubeSuggestions?: IYouTubeVideo[];
  title?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>({
  name: { type: String, required: true },
  country: { type: String, required: true },
  admin1: { type: String, required: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  resolvedBy: { type: String, enum: ['coords', 'geocoding', 'zipcode', 'landmark'], required: true }
}, { _id: false });

const DateRangeSchema = new Schema<IDateRange>({
  start: { type: String, default: null },
  end: { type: String, default: null }
}, { _id: false });

const SnapshotSchema = new Schema<ISnapshot>({
  current: { type: Schema.Types.Mixed, default: null },
  daily: { type: Schema.Types.Mixed, default: null },
  source: { type: String, enum: ['open-meteo'], default: 'open-meteo' }
}, { _id: false });

const YouTubeVideoSchema = new Schema<IYouTubeVideo>({
  title: { type: String, required: true },
  url: { type: String, required: true },
  thumbnail: { type: String, required: true },
  channelTitle: { type: String, required: true }
}, { _id: false });

const RecordSchema = new Schema<IRecord>({
  queryRaw: { type: String, required: true },
  location: { type: LocationSchema, required: true },
  dateRange: { type: DateRangeSchema, required: true },
  snapshot: { type: SnapshotSchema, required: true },
  youtubeSuggestions: { type: [YouTubeVideoSchema], default: [] },
  title: { type: String, maxlength: 120 },
  notes: { type: String, maxlength: 2000 }
}, {
  timestamps: true,
  collection: 'records'
});

// Indexes for better query performance
RecordSchema.index({ 'location.name': 'text', 'location.country': 'text', title: 'text', notes: 'text' });
RecordSchema.index({ createdAt: -1 });
RecordSchema.index({ 'dateRange.start': 1, 'dateRange.end': 1 });

export const Record = mongoose.model<IRecord>('Record', RecordSchema);
