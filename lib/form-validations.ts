// Form Validation Utilities for Legal Forms

import { z } from 'zod'

/**
 * Currency validation - accepts $1,250.00 or 1250 formats
 */
export const currencySchema = (fieldName: string = 'amount') =>
  z.string()
    .min(1, `${fieldName} is required`)
    .regex(
      /^\$?\d{1,10}(,\d{3})*(\.\d{0,2})?$/,
      'Enter amount like $1,250.00 or 1250'
    )

/**
 * Optional currency validation
 */
export const optionalCurrencySchema = z.string()
  .regex(/^$|^\$?\d{1,10}(,\d{3})*(\.\d{0,2})?$/, 'Enter amount like $1,250.00 or 1250')
  .optional()
  .or(z.literal(''))

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string | undefined): number {
  if (!value) return 0
  return parseFloat(value.replace(/[$,]/g, '')) || 0
}

/**
 * Format number as currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Percentage validation - accepts 50% or 50 formats, range 0-100
 */
export const percentageSchema = (fieldName: string = 'percentage') =>
  z.string()
    .min(1, `${fieldName} is required`)
    .regex(/^\d{1,3}%?$/, 'Enter percentage 0-100')
    .refine(
      (val) => {
        const num = parseInt(val.replace('%', ''))
        return num >= 0 && num <= 100
      },
      'Must be between 0% and 100%'
    )

/**
 * Parse percentage string to number
 */
export function parsePercentage(value: string | undefined): number {
  if (!value) return 0
  return parseInt(value.replace('%', '')) || 0
}

/**
 * California phone number validation
 */
export const phoneSchema = z.string()
  .regex(
    /^(\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
    'Format: (555) 123-4567 or 555-123-4567'
  )

/**
 * Optional phone validation
 */
export const optionalPhoneSchema = z.string()
  .regex(/^$|^(\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/, 'Format: (555) 123-4567')
  .optional()
  .or(z.literal(''))

/**
 * Format phone number as (555) 123-4567
 */
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 0) return ''
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}

/**
 * Email validation (stricter than default)
 */
export const emailSchema = z.string()
  .email('Enter a valid email address')
  .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email format')

/**
 * Optional email validation
 */
export const optionalEmailSchema = z.string()
  .email('Enter a valid email address')
  .optional()
  .or(z.literal(''))

/**
 * Date validation (MM/DD/YYYY format)
 */
export const dateSchema = (fieldName: string = 'date') =>
  z.string()
    .min(1, `${fieldName} is required`)
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Format: MM/DD/YYYY')
    .refine((val) => {
      const date = new Date(val)
      return !isNaN(date.getTime())
    }, 'Enter a valid date')

/**
 * Calculate age from birthdate
 */
export function calculateAge(birthdate: string): number {
  const birth = new Date(birthdate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

/**
 * Birthdate validation (must be under 18 for child support)
 */
export const childBirthdateSchema = z.string()
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Format: MM/DD/YYYY')
  .refine((val) => {
    const age = calculateAge(val)
    return age >= 0 && age < 18
  }, 'Child must be under 18 years old')

/**
 * Past date validation (e.g., marriage date, divorce date)
 */
export const pastDateSchema = (fieldName: string = 'date') =>
  z.string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Format: MM/DD/YYYY')
    .refine((val) => {
      const date = new Date(val)
      return date < new Date()
    }, `${fieldName} must be in the past`)

/**
 * Social Security Number validation (optional, for privacy)
 */
export const ssnSchema = z.string()
  .regex(/^\d{3}-?\d{2}-?\d{4}$/, 'Format: 123-45-6789')
  .optional()

/**
 * Format SSN as XXX-XX-XXXX
 */
export function formatSSN(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 0) return ''
  if (digits.length <= 3) return digits
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`
}

/**
 * California county validation
 */
const CALIFORNIA_COUNTIES = [
  'Alameda', 'Alpine', 'Amador', 'Butte', 'Calaveras', 'Colusa', 'Contra Costa',
  'Del Norte', 'El Dorado', 'Fresno', 'Glenn', 'Humboldt', 'Imperial', 'Inyo',
  'Kern', 'Kings', 'Lake', 'Lassen', 'Los Angeles', 'Madera', 'Marin', 'Mariposa',
  'Mendocino', 'Merced', 'Modoc', 'Mono', 'Monterey', 'Napa', 'Nevada', 'Orange',
  'Placer', 'Plumas', 'Riverside', 'Sacramento', 'San Benito', 'San Bernardino',
  'San Diego', 'San Francisco', 'San Joaquin', 'San Luis Obispo', 'San Mateo',
  'Santa Barbara', 'Santa Clara', 'Santa Cruz', 'Shasta', 'Sierra', 'Siskiyou',
  'Solano', 'Sonoma', 'Stanislaus', 'Sutter', 'Tehama', 'Trinity', 'Tulare',
  'Tuolumne', 'Ventura', 'Yolo', 'Yuba'
]

export const countySchema = z.string()
  .min(1, 'County is required')
  .refine(
    (val) => CALIFORNIA_COUNTIES.includes(val),
    'Must be a valid California county'
  )

export { CALIFORNIA_COUNTIES }

/**
 * Validation helpers for legal forms
 */
export const validationHelpers = {
  /**
   * Check if two percentages add up to 100%
   */
  timeshareEquals100(
    parent1Timeshare: string | undefined,
    parent2Timeshare: string | undefined
  ): boolean {
    const p1 = parsePercentage(parent1Timeshare)
    const p2 = parsePercentage(parent2Timeshare)
    return p1 + p2 === 100
  },

  /**
   * Check if date1 is before date2
   */
  dateIsBefore(date1: string, date2: string): boolean {
    return new Date(date1) < new Date(date2)
  },

  /**
   * Check if amount is reasonable (not negative, not absurdly high)
   */
  amountIsReasonable(amount: string | undefined, max: number = 1000000): boolean {
    const num = parseCurrency(amount)
    return num >= 0 && num <= max
  },

  /**
   * Check if income is reasonable for child support calculations
   */
  incomeIsReasonable(income: string | undefined): boolean {
    const num = parseCurrency(income)
    // CA minimum wage ~$2800/mo, Max reasonable ~$100k/mo
    return num >= 0 && num <= 100000
  },

  /**
   * Validate California residency requirements (6 months)
   */
  meetsResidencyRequirement(moveInDate: string): boolean {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    return new Date(moveInDate) <= sixMonthsAgo
  },
}

/**
 * Form completeness checker
 */
export function checkFormCompleteness(formData: Record<string, any>, requiredFields: string[]): {
  isComplete: boolean
  missingFields: string[]
  progress: number
} {
  const missingFields = requiredFields.filter(field => {
    const value = formData[field]
    return !value || value === '' || value === undefined
  })

  const filledFields = requiredFields.length - missingFields.length
  const progress = Math.round((filledFields / requiredFields.length) * 100)

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    progress
  }
}

/**
 * Common validation error messages
 */
export const validationMessages = {
  required: (field: string) => `${field} is required`,
  invalidFormat: (field: string, format: string) => `${field} must be in ${format} format`,
  invalidRange: (field: string, min: number, max: number) =>
    `${field} must be between ${min} and ${max}`,
  pastDate: (field: string) => `${field} must be a past date`,
  futureDate: (field: string) => `${field} must be a future date`,
  minLength: (field: string, min: number) => `${field} must be at least ${min} characters`,
  maxLength: (field: string, max: number) => `${field} must not exceed ${max} characters`,
}
