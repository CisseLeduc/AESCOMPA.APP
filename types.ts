
export type TransactionType = 'sale' | 'purchase' | 'expense' | 'credit_repayment' | 'supplier_payment';
export type UserRole = 
  | 'owner' 
  | 'manager' 
  | 'cashier' 
  | 'inventory_manager' 
  | 'accountant' 
  | 'delivery' 
  | 'security';

export type BusinessType = 
  | 'boutique' 
  | 'restaurant' 
  | 'hotel' 
  | 'pharmacy' 
  | 'supermarket' 
  | 'warehouse' 
  | 'general';

export interface UserLearningProfile {
  lastTopics: string[];
  preferredLanguage: string;
  commonActions: Record<string, number>;
  businessPatterns: string[];
  autoOptimizerEnabled: boolean;
  voicePreference?: {
    formality: 'formal' | 'casual' | 'warm';
    pacing: 'slow' | 'normal' | 'fast';
    detectedDialect?: string;
    emotionalResponseLevel: number; // 0 to 1
  };
}

export interface StaffMember {
  id: string;
  name: string;
  role: UserRole;
  active: boolean;
  accessCode: string;
  permissions: string[];
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  category: string;
  address: string;
  balance: number;
  totalBusiness: number;
  lastDelivery?: string;
}

export interface Debt {
  id: string;
  customerName: string;
  amount: number;
  remainingAmount: number;
  date: string;
  dueDate?: string;
  status: 'pending' | 'partial' | 'paid';
  description: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  purchasePrice: number;
  stock: number;
  minStock: number;
  unit: string;
  category: string;
  sku: string;
  supplierId?: string;
  image?: string;
  lastUpdated: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  businessName: string;
  businessType: BusinessType;
  location: string;
  logo?: string;
  backupPhrase: string[];
  learningProfile: UserLearningProfile;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  paymentMethod: string;
  staffName?: string;
  customerName?: string;
  supplierId?: string;
  discount?: number;
  taxAmount?: number;
  metadata?: Record<string, any>;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  severity: 'low' | 'medium' | 'high';
}
