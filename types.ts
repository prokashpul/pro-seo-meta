export enum ProcessingStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export enum ModelMode {
  QUALITY = 'QUALITY', // gemini-3-pro-preview
  FAST = 'FAST'        // gemini-2.5-flash-lite-latest
}

export interface StockMetadata {
  title: string;
  description: string;
  keywords: string[];
  category: string;
}

export interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string;
  status: ProcessingStatus;
  metadata?: StockMetadata;
  error?: string;
  trendingContext?: string[]; // Extra keywords from search
}

export interface GenerationStats {
  totalFiles: number;
  processed: number;
  success: number;
  failed: number;
}
