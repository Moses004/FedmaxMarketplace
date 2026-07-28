import { z } from 'zod';
import { PropertyType } from '../types';

export const PROPERTY_TYPES: [PropertyType, ...PropertyType[]] = [
  'single-room',
  'self-contained',
  '1-bedroom-flat',
  '2-bedroom-flat',
  '3plus-bedroom-flat',
  'duplex',
  'penthouse',
  'bungalow',
  'townhouse',
  'villa',
  'shared-apartment',
  'office-commercial',
  'room',
  'apartment',
  'studio',
];

export const listingSchema = z.object({
  type: z.enum(PROPERTY_TYPES, {
    message: 'Please select a valid property category.',
  }),
  title: z
    .string()
    .trim()
    .min(1, 'Listing title is required.')
    .min(5, 'Listing title must be at least 5 characters long.')
    .max(120, 'Listing title cannot exceed 120 characters.'),
  location: z
    .string()
    .trim()
    .min(1, 'Property address is required.')
    .min(5, 'Property address must be at least 5 characters (e.g. street, city, country).'),
  price: z
    .number()
    .min(50, 'Monthly rent price must be at least €50.')
    .max(50000, 'Monthly rent price cannot exceed €50,000.'),
  size: z
    .number()
    .min(5, 'Property size must be at least 5 m².')
    .max(5000, 'Property size cannot exceed 5,000 m².'),
  annualDiscountPercentage: z
    .number()
    .min(0, 'Discount percentage cannot be negative.')
    .max(50, 'Discount percentage cannot exceed 50%.')
    .default(10),
  bedrooms: z
    .number()
    .min(0, 'Bedrooms cannot be negative.')
    .max(20, 'Bedrooms cannot exceed 20.'),
  bathrooms: z
    .number()
    .min(0.5, 'Bathrooms must be at least 0.5.')
    .max(20, 'Bathrooms cannot exceed 20.'),
  images: z
    .array(z.string())
    .min(1, 'At least 1 property photo is required to publish a listing.'),
  description: z
    .string()
    .trim()
    .min(1, 'Property description is required.')
    .min(20, 'Property description must be at least 20 characters long.'),
});

export type ListingFormData = z.infer<typeof listingSchema>;

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  stepErrors: {
    step1: boolean;
    step2: boolean;
    step3: boolean;
  };
  firstInvalidStep: number | null;
}

export function validateStep1(data: Partial<ListingFormData>): { isValid: boolean; errors: Record<string, string> } {
  const step1Schema = listingSchema.pick({
    type: true,
    title: true,
    location: true,
    price: true,
    size: true,
    annualDiscountPercentage: true,
  });

  const result = step1Schema.safeParse(data);
  if (result.success) {
    return { isValid: true, errors: {} };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    if (issue.path[0]) {
      errors[issue.path[0].toString()] = issue.message;
    }
  });

  return { isValid: false, errors };
}

export function validateStep2(data: Partial<ListingFormData>): { isValid: boolean; errors: Record<string, string> } {
  const step2Schema = listingSchema.pick({
    bedrooms: true,
    bathrooms: true,
    images: true,
  });

  const result = step2Schema.safeParse(data);
  if (result.success) {
    return { isValid: true, errors: {} };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    if (issue.path[0]) {
      errors[issue.path[0].toString()] = issue.message;
    }
  });

  return { isValid: false, errors };
}

export function validateListingFull(data: Record<string, any>): ValidationResult {
  const result = listingSchema.safeParse(data);

  if (result.success) {
    return {
      isValid: true,
      errors: {},
      stepErrors: { step1: false, step2: false, step3: false },
      firstInvalidStep: null,
    };
  }

  const errors: Record<string, string> = {};
  let step1HasError = false;
  let step2HasError = false;
  let step3HasError = false;

  const step1Fields = ['type', 'title', 'location', 'price', 'size', 'annualDiscountPercentage'];
  const step2Fields = ['bedrooms', 'bathrooms', 'images'];
  const step3Fields = ['description'];

  result.error.issues.forEach((issue) => {
    const fieldName = issue.path[0]?.toString();
    if (fieldName) {
      errors[fieldName] = issue.message;
      if (step1Fields.includes(fieldName)) step1HasError = true;
      if (step2Fields.includes(fieldName)) step2HasError = true;
      if (step3Fields.includes(fieldName)) step3HasError = true;
    }
  });

  let firstInvalidStep: number | null = null;
  if (step1HasError) firstInvalidStep = 1;
  else if (step2HasError) firstInvalidStep = 2;
  else if (step3HasError) firstInvalidStep = 3;

  return {
    isValid: false,
    errors,
    stepErrors: {
      step1: step1HasError,
      step2: step2HasError,
      step3: step3HasError,
    },
    firstInvalidStep,
  };
}
