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
  languageStyles?: Record<string, {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    lineHeight?: number;
    alignment?: 'left' | 'center' | 'right' | 'justify';
    letterSpacing?: number;
    textShadow?: string;
  }>;
  
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
  singlePurchasePrice?: number;
  includedInMonthlyPlan?: boolean;
  includedInYearlyPlan?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  isActive: boolean;
  includedCategories: string[];
  includedTemplateIds: string[];
  durationType?: '1day' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  durationDays?: number;
  customStartDate?: string | null;
  customEndDate?: string | null;
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

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  isDefault: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  roleId?: string;
  permissions?: string[];
  customPermissions?: string[];
  isCustomPermissions?: boolean;
  password?: string;
  isBlocked: boolean;
  phoneNumber?: string;
  phone?: string;
  provider?: string;
  profilePhoto?: string;
  accountStatus?: string;
  lastLoginAt?: string;
  status?: 'active' | 'suspended';
  invitationCount: number;
  draftsCount: number;
  createdAt: string;
  rating?: number | null;
  subscription?: UserSubscription | null;
}

export interface Rating {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  rating: number;
  createdAt: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  type: string;
  planType?: string;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
  amountPaid: number;
  createdAt?: string;
  updatedAt: string;
}

export interface UserPurchase {
  id: string;
  userId: string;
  templateId: string;
  templateName?: string;
  amountPaid: number;
  purchasedAt: string;
  createdAt: string;
}

export interface UserDraft {
  id: string;
  userId: string;
  templateId: string;
  templateName?: string;
  customizedData: Record<string, any>;
  isPurchased: boolean;
  savedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userEmail?: string;
  type: 'subscription' | 'single_purchase';
  amount: number;
  templateId?: string;
  templateName?: string;
  planId?: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  createdAt: string;
}
