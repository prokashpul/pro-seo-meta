export enum ProcessingStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export enum ModelMode {
  QUALITY = 'QUALITY', 
  FAST = 'FAST',
  ROBOTICS = 'ROBOTICS',
  GROQ_VISION = 'GROQ_VISION',
  MISTRAL_PIXTRAL = 'MISTRAL_PIXTRAL'
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
  vectorFile?: File; // Optional linked vector file (EPS/AI)
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

export interface ImageGenItem {
  id: string;
  prompt: string;
  aspectRatio: string;
  status: 'idle' | 'generating' | 'completed' | 'error';
  error?: string;
  generatedImageUrl?: string;
  sourceImage?: {
    base64: string;
    mimeType: string;
    previewUrl: string;
  };
  advancedSettings?: {
    negativePrompt?: string;
    guidanceScale?: number;
    seed?: number;
  };
}

export interface GenerationSettings {
  silhouette: boolean;
  whiteBackground: boolean;
  transparentBackground: boolean;
  singleWordKeywords: boolean;
  customPromptEnabled: boolean;
  customPromptText: string;
  prohibitedWordsEnabled: boolean;
  prohibitedWordsText: string;
  
  // Customization Ranges
  titleWordCountMin: number;
  titleWordCountMax: number;
  descriptionWordCountMin: number;
  descriptionWordCountMax: number;
  keywordCountMin: number;
  keywordCountMax: number;
}