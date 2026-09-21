export type AppMode = 'convert' | 'compress' | 'merge' | 'split' | 'rotate' | 'img2pdf' | 'remove' | 'protect' | 'unlock' | 'organize' | null;

export type ImageFormat = 'jpeg' | 'png' | 'webp';

export interface ConvertedImage {
  id: string;
  pageNumber: number;
  dataUrl: string;
  blob: Blob;
  format: ImageFormat;
}

export type ProcessingState = 'idle' | 'configuring' | 'reading' | 'converting' | 'zipping' | 'error' | 'compressing' | 'merging' | 'splitting' | 'rotating' | 'generating' | 'removing' | 'protecting' | 'unlocking' | 'organizing';

export interface ConversionOptions {
  quality: number;
  scale: number;
  format: ImageFormat;
  pageRange: string;
}

export type CompressionMode = 'percentage' | 'targetSize';

export interface CompressionOptions {
  mode: CompressionMode;
  percentage?: number; // 1 to 100
  targetSizeMB?: number;
  resolution?: 'low' | 'medium' | 'high' | 'original';
  pageRange?: string;
}

export interface SplitOptions {
  pageRange: string;
}

export interface RotateOptions {
  degrees: number; // usually 90, 180, 270
}

export interface RemovePagesOptions {
  pageRange: string;
}

export interface ProtectOptions {
  userPassword?: string;
  ownerPassword?: string;
}

export interface UnlockOptions {
  password?: string;
}

export interface OrganizeOptions {
  pageOrder: number[];
}

