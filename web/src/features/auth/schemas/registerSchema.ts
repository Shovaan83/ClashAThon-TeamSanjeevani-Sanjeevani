import { z } from 'zod';

// ─── Step 1: Email ────────────────────────────────────────────────────────────

export const emailStepSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});
export type EmailStepData = z.infer<typeof emailStepSchema>;

// ─── Step 2: OTP ─────────────────────────────────────────────────────────────

export const otpStepSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});
export type OtpStepData = z.infer<typeof otpStepSchema>;

// ─── Shared field builders ────────────────────────────────────────────────────

const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Must contain at least one number');

const phoneField = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^\+?[0-9\s\-().]{7,20}$/, 'Please enter a valid phone number');

// ─── Step 3: Patient Profile ──────────────────────────────────────────────────

export const patientProfileSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    name: z
      .string()
      .min(1, 'Full name is required')
      .min(2, 'Name must be at least 2 characters'),
    phone: phoneField,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type PatientProfileData = z.infer<typeof patientProfileSchema>;

// ─── Step 3: Pharmacy Profile ─────────────────────────────────────────────────

export const pharmacyProfileSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    pharmacyName: z
      .string()
      .min(1, 'Pharmacy name is required')
      .min(2, 'Pharmacy name must be at least 2 characters'),
    phone: phoneField,
    location: z.object({
      lat: z.number(),
      lng: z.number(),
      address: z.string().optional(),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type PharmacyProfileData = z.infer<typeof pharmacyProfileSchema>;

// ─── Login (unchanged) ────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormData = z.infer<typeof loginSchema>;
