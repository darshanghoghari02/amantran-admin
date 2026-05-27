export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'sticker';
  x: number;             // X coordinate in logical pixel space (e.g. 1080px wide canvas)
  y: number;             // Y coordinate in logical pixel space (e.g. 1920px tall canvas)
  width: number;
  height: number;
  rotation: number;      // Rotation in degrees (0 - 360)
  opacity: number;       // Opacity (0 - 1)
  zIndex: number;
  isLocked: boolean;
  
  // Text element specific
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  lineHeight?: number;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  fontWeight?: string;
  fontStyle?: string;
  letterSpacing?: number;
  textShadow?: string;
  translations?: Record<string, string>;
  
  // Image / Sticker specific
  imagePath?: string;    // Static asset path (e.g. /assets/images/wedding/royal_wedding/ganesh.png)
}

export interface TemplatePage {
  id: string;
  name: string;
  backgroundImage: string;
  elements: CanvasElement[];
}

export interface Template {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  thumbnail: string;
  previewImages: string[];
  localAssetPaths: string[];
  isPremium: boolean;
  isActive: boolean;
  fonts: string[];
  languages: string[];
  pages: TemplatePage[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomFont {
  id: string;
  family: string;
  localPath: string;
  isActive: boolean;
  createdAt: string;
}

export interface Language {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'editor' | 'content_manager';
  isBlocked: boolean;
  invitationCount: number;
  draftsCount: number;
  createdAt: string;
}
