
// Базовые типы для приложения
export interface BaseEntity {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enums
export enum UserRole {
  PRODUCER = 'producer',
  DISTRIBUTOR = 'distributor',
  INVESTOR = 'investor',
  ADMIN = 'admin',
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
  PENDING = 'pending',
}

export enum LotStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  SOLD = 'sold',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum AuctionType {
  FIXED = 'fixed',
  AUCTION = 'auction',
  REVERSE_AUCTION = 'reverse_auction',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum BidStatus {
  ACTIVE = 'active',
  OUTBID = 'outbid',
  WINNING = 'winning',
  WON = 'won',
  LOST = 'lost',
}

export enum ShipmentStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  PAYMENT = 'payment',
  REFUND = 'refund',
  FEE = 'fee',
  INVESTMENT = 'investment',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum CertificateStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum NotificationType {
  CERTIFICATE_APPROVED = 'certificate_approved',
  CERTIFICATE_REJECTED = 'certificate_rejected',
  LOT_ACTIVATED = 'lot_activated',
  LOT_DEACTIVATED = 'lot_deactivated',
  BID_PLACED = 'bid_placed',
  BID_WON = 'bid_won',
  SYSTEM_UPDATE = 'system_update',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
}

export enum InvestmentType {
  EQUITY = 'equity',
  DEBT = 'debt',
  REVENUE_SHARE = 'revenue_share',
}

export enum InvestmentStatus {
  FUNDRAISING = 'fundraising',
  FUNDED = 'funded',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum NotificationType {
  BID_UPDATE = 'bid_update',
  LOT_WON = 'lot_won',
  PAYMENT = 'payment',
  SHIPMENT = 'shipment',
  SYSTEM = 'system',
  NEW_BID = 'new_bid',
  BID_WON = 'bid_won',
  BID_OUTBID = 'bid_outbid',
  AUCTION_ENDING = 'auction_ending',
  PRODUCT_APPROVED = 'product_approved',
  PRODUCT_REJECTED = 'product_rejected',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  SYSTEM_UPDATE = 'system_update',
  CERTIFICATE_APPROVED = 'certificate_approved',
  CERTIFICATE_REJECTED = 'certificate_rejected',
}

export enum PaymentMethodType {
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
  CRYPTO = 'crypto',
  ESCROW = 'escrow',
}

// Интерфейсы
export interface Address {
  street: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  zipCode: string;
  coordinates?: [number, number];
}

export interface User extends BaseEntity {
  id?: string; // Для совместимости с API ответом
  userId?: string; // Для совместимости с фронтендом
  email: string;
  password: string;
  role: UserRole;
  profile: {
    firstName: string;
    lastName: string;
    company?: string;
    phone?: string;
    avatar?: string;
    avatarKey?: string;
    address?: Address;
  };
  verification: {
    email: boolean;
    identity: boolean;
    business: boolean;
  };
  preferences: {
    notifications: boolean;
    language: string;
    currency: string;
  };
  lastLogin?: Date;
}

export interface Product extends BaseEntity {
  id?: string; // Для совместимости с фронтендом
  producerId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  originCountry: string;
  certificationStatus: 'certified' | 'haram' | 'no-certificate';
  certificateIds?: string[];
  specifications: {
    volume: number;
    alcoholContent: number;
    ingredients: string[];
    nutritionFacts?: Record<string, any>;
  };
  images: string[];
  status: ProductStatus;
}

export interface Lot extends BaseEntity {
  productId: string | { _id: string; name: string; category: string; images: string[] };
  producerId: string | { _id: string; profile: { firstName: string; lastName: string; company: string } };
  title: string;
  description: string;
  quantity: number;
  unit: string;
  startingPrice: number;
  currentPrice: number;
  currency: string;
  auction: {
    startDate: Date;
    endDate: Date;
    type: AuctionType;
    minBidIncrement?: number;
  };
  location: {
    city: string;
    country: string;
    street: string;
    house: string;
    coordinates?: [number, number];
  };
  status: LotStatus;
  winnerId?: string;
  bidsCount?: number;
  viewsCount?: number;
}

export interface Bid extends BaseEntity {
  lotId: string | {
    _id: string;
    title: string;
    currentPrice: number;
    endDate?: string;
    auction?: {
      endDate: string;
    };
    status: 'active' | 'sold' | 'expired' | 'cancelled';
    producerId?: {
      profile?: {
        company?: string;
      };
    };
    productId?: {
      name?: string;
      images?: string[];
    };
  };
  bidderId: string | {
    _id: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      company?: string;
    };
    email?: string;
  };
  amount: number;
  currency: string;
  message?: string;
  status: BidStatus;
  isWinning?: boolean;
  automaticBid?: {
    maxAmount: number;
    increment: number;
  };
}

export interface Shipment extends BaseEntity {
  lotId: string;
  sellerId: string;
  buyerId: string;
  trackingNumber: string;
  carrier: string;
  origin: Address;
  destination: Address;
  status: ShipmentStatus;
  timeline: {
    event: string;
    timestamp: Date;
    location?: string;
  }[];
  estimatedDelivery: Date;
  actualDelivery?: Date;
  documents: {
    invoice?: string;
    bill_of_lading?: string;
    customs?: string;
  };
  iotData?: {
    temperature: number[];
    humidity: number[];
    location: [number, number][];
    lastUpdate: Date;
  };
}

export interface Transaction extends BaseEntity {
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  relatedTo?: {
    type: 'lot' | 'investment' | 'fee';
    id: string;
  };
  paymentMethod: {
    type: PaymentMethodType;
    details: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

export interface Certificate extends BaseEntity {
  userId: string;
  title: string;
  issuedBy: string;
  certificateNumber: string;
  issueDate: Date;
  expiryDate: Date;
  status: CertificateStatus;
  documents: {
    original: string;
    thumbnail?: string;
  };
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export interface Notification extends BaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  data?: Record<string, any>;
  readAt?: Date;
}

export interface Investment extends BaseEntity {
  investorId: string;
  type: InvestmentType;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  terms: {
    duration: number; // months
    expectedROI: number; // percentage
    minimumInvestment: number;
    riskLevel: RiskLevel;
  };
  status: InvestmentStatus;
  investors: {
    userId: string;
    amount: number;
    date: Date;
  }[];
  documents: string[];
}

export interface Notification extends BaseEntity {
  id?: string; // Для совместимости с фронтендом
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
}

export interface IBid extends BaseEntity {
  lotId: string;
  bidderId: string;
  amount: number;
  currency: string;
  message?: string;
  status: BidStatus;
  automaticBid?: {
    maxAmount: number;
    increment: number;
  };
}

export interface IShipment extends BaseEntity {
  lotId: string;
  sellerId: string;
  buyerId: string;
  trackingNumber: string;
  carrier: string;
  origin: Address;
  destination: Address;
  status: ShipmentStatus;
  timeline: {
    event: string;
    timestamp: Date;
    location?: string;
  }[];
  estimatedDelivery: Date;
  actualDelivery?: Date;
  documents: {
    invoice?: string;
    bill_of_lading?: string;
    customs?: string;
  };
  iotData?: {
    temperature: number[];
    humidity: number[];
    location: [number, number][];
    lastUpdate: Date;
  };
}

export interface ITransaction extends BaseEntity {
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  relatedTo?: {
    type: 'lot' | 'investment' | 'fee';
    id: string;
  };
  paymentMethod: {
    type: PaymentMethodType;
    details: object;
  };
  metadata?: object;
}

export interface ICertificate extends BaseEntity {
  userId: string;
  title: string;
  issuedBy: string;
  certificateNumber: string;
  issueDate: Date;
  expiryDate: Date;
  status: CertificateStatus;
  documents: {
    original: string;
    thumbnail?: string;
  };
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export interface IInvestment extends BaseEntity {
  investorId: string;
  type: InvestmentType;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  terms: {
    duration: number; // months
    expectedROI: number; // percentage
    minimumInvestment: number;
    riskLevel: RiskLevel;
  };
  status: InvestmentStatus;
  investors: {
    userId: string;
    amount: number;
    date: Date;
  }[];
  documents: string[];
}

export interface INotification extends BaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
}

export interface Order extends BaseEntity {
  id?: string; // Для совместимости с фронтендом
  buyerId: string;
  sellerId: string;
  lotId: string;
  quantity: number;
  totalAmount: number;
  status: OrderStatus;
  paymentDetails?: {
    method: string;
    transactionId?: string;
    paidAt?: Date;
  };
  shippingDetails?: {
    address: Address;
    carrier?: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
  };
}

// Типы для API ответов
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Типы для пагинации
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Типы для форм
export interface FormState<T = any> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Типы для состояния загрузки
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Типы для фильтров
export interface LotFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  status?: LotStatus;
  auctionType?: AuctionType;
}

export interface ProductFilters {
  category?: string;
  producerId?: string;
  status?: ProductStatus;
  certificationStatus?: 'certified' | 'halal' | 'haram' | 'no-certificate';
}

// Типы для создания сущностей
export interface CreateUserInput {
  email: string;
  password: string;
  role: UserRole;
  profile: {
    firstName: string;
    lastName: string;
    company?: string;
    phone?: string;
  };
}

export interface CreateProductInput {
  name: string;
  description: string;
  category: string;
  specifications: {
    volume: number;
    alcoholContent: number;
    ingredients: string[];
    nutritionFacts: Record<string, any>;
  };
  images: string[];
}

export interface CreateLotInput {
  productId: string;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  startingPrice: number;
  currency: string;
  auction: {
    startDate: Date;
    endDate: Date;
    type: AuctionType;
    minBidIncrement?: number;
  };
  location: {
    city: string;
    country: string;
    street: string;
    house: string;
    coordinates?: [number, number];
  };
}

export interface CreateBidInput {
  lotId: string;
  amount: number;
  currency: string;
  message?: string;
  automaticBid?: {
    maxAmount: number;
    increment: number;
  };
}
