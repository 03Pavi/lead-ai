import { z } from "zod";

// --- Authentication Schemas ---
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

// --- Lead / Prospect Schema ---
export const leadSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  address: z.string(),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  openingHours: z.string().optional().nullable(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  rating: z.number().optional().nullable(),
  reviewCount: z.number().optional().nullable(),
  distance: z.number().optional().nullable(),
});

// --- Collections & Folders Schemas ---
export const createCollectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  folderId: z.string().optional(),
});

export const createFolderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const collectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  folderId: z.string().optional(),
  leads: z.array(leadSchema),
  isArchived: z.boolean(),
  createdAt: z.string(),
});

export const folderSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  collectionIds: z.array(z.string()),
  createdAt: z.string(),
});

// --- Search Request Schema ---
export const searchRequestSchema = z.object({
  query: z.string().min(1, "Search query cannot be empty"),
  filters: z.object({
    category: z.string().optional(),
    city: z.string().optional(),
    radius: z.number().optional(),
    distance: z.number().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    websiteAvailable: z.boolean().nullable().optional(),
    phoneAvailable: z.boolean().nullable().optional(),
    openingNow: z.boolean().optional(),
    sortBy: z.enum(["relevance", "distance", "name"]).optional(),
  }).optional(),
});

// --- Types ---
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type LeadInput = z.infer<typeof leadSchema>;
export type CollectionInput = z.infer<typeof collectionSchema>;
export type FolderInput = z.infer<typeof folderSchema>;
export type SearchRequestInput = z.infer<typeof searchRequestSchema>;
