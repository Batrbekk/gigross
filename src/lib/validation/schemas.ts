import { z } from 'zod';
import { UserRole, AuctionType, LotStatus, ProductStatus } from '@/types';

// Базовые схемы
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid ObjectId' });

export const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  coordinates: z.tuple([z.number(), z.number()]).optional(),
});

// Схемы аутентификации
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(UserRole),
  profile: z.object({
    firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
    company: z.string().max(100, 'Company name too long').optional(),
    phone: z
      .string()
      .regex(/^\+?[\d\s\-\(\)]+$/, { message: 'Invalid phone format' })
      .optional(),
  }),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Схемы продуктов
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Name too long'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().positive('Price must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  originCountry: z.string().min(1, 'Origin country is required'),
  certificationStatus: z.enum(['certified', 'haram', 'no-certificate']),
  certificateIds: z.array(objectIdSchema).optional(),
  specifications: z.object({
    volume: z.number().min(0, 'Volume must be non-negative'),
    alcoholContent: z.number().min(0, 'Alcohol content must be non-negative').max(100, 'Alcohol content cannot exceed 100%'),
    ingredients: z.array(z.string().min(1, 'Ingredient cannot be empty')),
    nutritionFacts: z.record(z.any()).optional(),
  }),
  images: z.array(z.string().url('Invalid image URL')),
  producerId: objectIdSchema.optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  status: z.nativeEnum(ProductStatus).optional(),
});

export const productFiltersSchema = z.object({
  category: z.string().optional(),
  producerId: z.union([objectIdSchema, z.literal('me')]).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  certificationStatus: z.enum(['certified', 'haram', 'no-certificate']).optional(),
  page: z.string().transform(val => parseInt(val) || 1).pipe(z.number().min(1)).default(1),
  limit: z.string().transform(val => parseInt(val) || 10).pipe(z.number().min(1).max(100)).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Схемы лотов
export const createLotSchema = z
  .object({
    productId: objectIdSchema,
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
    quantity: z.number().positive('Quantity must be positive'),
    unit: z.string().min(1, 'Unit is required'),
    startingPrice: z.number().positive('Starting price must be positive'),
    currency: z.string().length(3, 'Currency must be 3 characters').toUpperCase(),
    auction: z.object({
      startDate: z.string().datetime('Invalid start date'),
      endDate: z.string().datetime('Invalid end date'),
      type: z.nativeEnum(AuctionType),
      minBidIncrement: z.number().positive('Min bid increment must be positive').optional(),
    }),
    location: z.object({
      city: z.string().min(1, 'City is required'),
      country: z.string().min(1, 'Country is required'),
      street: z.string().min(1, 'Street is required'),
      house: z.string().min(1, 'House is required'),
    }),
  })
  .refine(data => new Date(data.auction.endDate) > new Date(data.auction.startDate), {
    message: 'End date must be after start date',
    path: ['auction', 'endDate'],
  });

export const updateLotSchema = createLotSchema.partial().extend({
  status: z.nativeEnum(LotStatus).optional(),
  winnerId: objectIdSchema.optional(),
});

export const lotFiltersSchema = z.object({
  category: z.string().optional(),
  producerId: objectIdSchema.optional(),
  excludeProducerId: objectIdSchema.optional(),
  minPrice: z.string().transform(val => parseFloat(val) || undefined).pipe(z.number().min(0)).optional(),
  maxPrice: z.string().transform(val => parseFloat(val) || undefined).pipe(z.number().min(0)).optional(),
  location: z.string().optional(),
  status: z.nativeEnum(LotStatus).optional(),
  excludeStatus: z.string().optional(),
  auctionType: z.nativeEnum(AuctionType).optional(),
  page: z.string().transform(val => parseInt(val) || 1).pipe(z.number().min(1)).default(1),
  limit: z.string().transform(val => parseInt(val) || 10).pipe(z.number().min(1).max(100)).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Схемы ставок
export const createBidSchema = z.object({
  lotId: objectIdSchema,
  amount: z.number().positive('Bid amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').toUpperCase(),
  message: z.string().max(500, 'Message too long').optional(),
  automaticBid: z
    .object({
      maxAmount: z.number().positive('Max amount must be positive'),
      increment: z.number().positive('Increment must be positive'),
    })
    .optional(),
});

// Схемы пользователей
export const updateUserProfileSchema = z.object({
  profile: z
    .object({
      firstName: z
        .string()
        .min(1, 'First name is required')
        .max(50, 'First name too long')
        .optional(),
      lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long').optional(),
      company: z.string().max(100, 'Company name too long').optional(),
      phone: z
        .string()
        .regex(/^\+?[\d\s\-\(\)]+$/, { message: 'Invalid phone format' })
        .optional(),
      avatar: z.string().url('Invalid avatar URL').optional(),
      address: addressSchema.optional(),
    })
    .optional(),
  preferences: z
    .object({
      notifications: z.boolean().optional(),
      language: z
        .string()
        .min(2, 'Language code too short')
        .max(5, 'Language code too long')
        .optional(),
      currency: z.string().length(3, 'Currency must be 3 characters').optional(),
    })
    .optional(),
});

// Схемы сертификатов
export const createCertificateSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    issuedBy: z.string().min(1, 'Issuer is required').max(200, 'Issuer name too long'),
    certificateNumber: z
      .string()
      .min(1, 'Certificate number is required')
      .max(100, 'Certificate number too long'),
    issueDate: z.string().datetime('Invalid issue date'),
    expiryDate: z.string().datetime('Invalid expiry date'),
    documents: z.object({
      original: z.string().url('Invalid document URL'),
      thumbnail: z.string().url('Invalid thumbnail URL').optional(),
    }),
  })
  .refine(data => new Date(data.expiryDate) > new Date(data.issueDate), {
    message: 'Expiry date must be after issue date',
    path: ['expiryDate'],
  });

// Схемы пагинации
export const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).pipe(z.number().min(1)).default(1),
  limit: z.string().transform(val => parseInt(val) || 10).pipe(z.number().min(1).max(100)).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Схемы для поиска
export const searchSchema = z
  .object({
    query: z.string().min(1, 'Search query is required').max(200, 'Query too long'),
    category: z.string().optional(),
    filters: z.record(z.string(), z.any()).optional(),
  })
  .merge(paginationSchema);

// Экспорт типов
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFiltersInput = z.infer<typeof productFiltersSchema>;
export type CreateLotInput = z.infer<typeof createLotSchema>;
export type UpdateLotInput = z.infer<typeof updateLotSchema>;
export type LotFiltersInput = z.infer<typeof lotFiltersSchema>;
export type CreateBidInput = z.infer<typeof createBidSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
export type CreateCertificateInput = z.infer<typeof createCertificateSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
