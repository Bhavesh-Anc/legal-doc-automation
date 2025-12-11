// California Child Support Calculator
// Based on California Family Code § 4055 (Guideline Formula)

import { parseCurrency } from './form-validations'

export interface ChildSupportInputs {
  // Parent 1 (Higher earner or paying parent)
  parent1GrossIncome: number
  parent1Deductions: number
  parent1Timeshare: number // Percentage (0-100)

  // Parent 2 (Lower earner or receiving parent)
  parent2GrossIncome: number
  parent2Deductions: number
  parent2Timeshare: number // Percentage (0-100)

  // Children
  numberOfChildren: number

  // Add-on expenses
  childcareCosts: number
  healthInsurancePremium: number
  uninsuredMedicalCosts: number

  // Optional
  otherChildrenSupported?: number // Children from other relationships
}

export interface ChildSupportResult {
  monthlySupport: number
  baseSupport: number
  addOnExpenses: number
  breakdown: {
    parent1NetIncome: number
    parent2NetIncome: number
    totalNetIncome: number
    higherEarnerPercentage: number
    baseCalculation: number
    childcareAddOn: number
    healthInsuranceAddOn: number
    uninsuredMedicalAddOn: number
  }
  warnings: string[]
  payingParent: 'parent1' | 'parent2'
}

/**
 * Calculate net disposable income
 * Simplified calculation - actual CA uses detailed tax tables
 */
function calculateNetDisposableIncome(
  grossIncome: number,
  deductions: number
): number {
  // Approximate federal + state + FICA taxes
  const effectiveTaxRate = calculateEffectiveTaxRate(grossIncome)
  const netAfterTax = grossIncome * (1 - effectiveTaxRate)

  // Subtract mandatory deductions (retirement, union dues, etc.)
  const netDisposable = netAfterTax - deductions

  return Math.max(0, netDisposable)
}

/**
 * Simplified effective tax rate calculator
 * Actual calculation uses detailed tax brackets
 */
function calculateEffectiveTaxRate(grossIncome: number): number {
  const annualIncome = grossIncome * 12

  if (annualIncome <= 20000) return 0.10 // 10% effective rate
  if (annualIncome <= 40000) return 0.15 // 15%
  if (annualIncome <= 80000) return 0.20 // 20%
  if (annualIncome <= 150000) return 0.25 // 25%
  if (annualIncome <= 300000) return 0.30 // 30%
  return 0.35 // 35% for very high earners
}

/**
 * Main California child support calculator
 * Implements simplified version of FC § 4055
 */
export function calculateChildSupport(inputs: ChildSupportInputs): ChildSupportResult {
  const warnings: string[] = []

  // Calculate net disposable income for both parents
  const parent1Net = calculateNetDisposableIncome(
    inputs.parent1GrossIncome,
    inputs.parent1Deductions
  )

  const parent2Net = calculateNetDisposableIncome(
    inputs.parent2GrossIncome,
    inputs.parent2Deductions
  )

  // Total combined net disposable income
  const totalNet = parent1Net + parent2Net

  // Determine which parent is the higher earner
  const higherEarnerIsParent1 = parent1Net > parent2Net
  const higherEarnerNet = higherEarnerIsParent1 ? parent1Net : parent2Net
  const lowerEarnerNet = higherEarnerIsParent1 ? parent2Net : parent1Net
  const higherEarnerTimeshare = higherEarnerIsParent1
    ? inputs.parent1Timeshare / 100
    : inputs.parent2Timeshare / 100

  // Calculate higher earner's share of total income
  const higherEarnerPercentage = totalNet > 0 ? higherEarnerNet / totalNet : 0.5

  // Apply K-factor (approximate for timeshare adjustment)
  // Actual formula is more complex: CS = K[HN - (H% × TN)]
  // Simplified: CS = TN × H% × (1 - H%) × K
  const kFactor = 1 + higherEarnerTimeshare // Simplified K-factor

  // Base support calculation (simplified formula)
  // Actual CA formula: CS = K[HN - (H% × TN)]
  const baseSupport = calculateBaseSupport(
    higherEarnerNet,
    lowerEarnerNet,
    higherEarnerTimeshare,
    inputs.numberOfChildren
  )

  // Add mandatory add-ons (FC § 4062)
  const childcareAddOn = inputs.childcareCosts
  const healthInsuranceAddOn = inputs.healthInsurancePremium
  const uninsuredMedicalAddOn = inputs.uninsuredMedicalCosts

  const totalAddOns = childcareAddOn + healthInsuranceAddOn + uninsuredMedicalAddOn

  // Total monthly support
  const monthlySupport = Math.max(0, Math.round(baseSupport + totalAddOns))

  // Generate warnings
  if (monthlySupport > higherEarnerNet * 0.5) {
    warnings.push('⚠️ Support exceeds 50% of paying parent\'s net income - court may question this')
  }

  if (monthlySupport < 50 && higherEarnerNet > 1000) {
    warnings.push('⚠️ Support amount seems unusually low - verify your income figures')
  }

  if (totalNet === 0) {
    warnings.push('⚠️ No income reported for either parent - unable to calculate support')
  }

  if (inputs.parent1Timeshare + inputs.parent2Timeshare !== 100) {
    warnings.push('⚠️ Timeshare percentages must add up to 100%')
  }

  if (monthlySupport > 10000) {
    warnings.push('ℹ️ High support amount - ensure income figures are correct')
  }

  // Return result
  return {
    monthlySupport,
    baseSupport: Math.round(baseSupport),
    addOnExpenses: Math.round(totalAddOns),
    breakdown: {
      parent1NetIncome: Math.round(parent1Net),
      parent2NetIncome: Math.round(parent2Net),
      totalNetIncome: Math.round(totalNet),
      higherEarnerPercentage: Math.round(higherEarnerPercentage * 100),
      baseCalculation: Math.round(baseSupport),
      childcareAddOn: Math.round(childcareAddOn),
      healthInsuranceAddOn: Math.round(healthInsuranceAddOn),
      uninsuredMedicalAddOn: Math.round(uninsuredMedicalAddOn),
    },
    warnings,
    payingParent: higherEarnerIsParent1 ? 'parent1' : 'parent2',
  }
}

/**
 * Calculate base child support amount
 * Simplified version of CA guideline formula
 */
function calculateBaseSupport(
  higherEarnerNet: number,
  lowerEarnerNet: number,
  higherEarnerTimeshare: number,
  numberOfChildren: number
): number {
  const totalNet = higherEarnerNet + lowerEarnerNet

  if (totalNet === 0) return 0

  // H% = Higher earner's time with children
  const H_percent = higherEarnerTimeshare

  // Actual CA formula: CS = K[HN - (H% × TN)]
  // K = 1 + H% (approximately, actual K is more complex)
  const K = 1 + H_percent

  // Simplified: CS = K × (HN - H% × TN)
  const baseAmount = K * (higherEarnerNet - (H_percent * totalNet))

  // Apply percentage based on number of children
  // CA uses: 1 child = 25%, 2 = 40%, 3 = 50%, 4+ = varies
  const childMultiplier = getChildMultiplier(numberOfChildren)

  return Math.max(0, baseAmount * childMultiplier)
}

/**
 * Get income percentage multiplier based on number of children
 * Based on CA Family Code § 4055(b)(3)
 */
function getChildMultiplier(numberOfChildren: number): number {
  if (numberOfChildren === 1) return 0.25 // 25% of income difference
  if (numberOfChildren === 2) return 0.40 // 40%
  if (numberOfChildren === 3) return 0.50 // 50%
  if (numberOfChildren === 4) return 0.55 // 55%
  if (numberOfChildren >= 5) return 0.60 // 60%
  return 0.25 // Default to 1 child
}

/**
 * Calculate proportional split of expenses
 * Used for childcare, uninsured medical, etc.
 */
export function calculateProportionalSplit(
  parent1Income: number,
  parent2Income: number,
  totalExpense: number
): {
  parent1Share: number
  parent2Share: number
  parent1Percentage: number
  parent2Percentage: number
} {
  const totalIncome = parent1Income + parent2Income

  if (totalIncome === 0) {
    return {
      parent1Share: totalExpense / 2,
      parent2Share: totalExpense / 2,
      parent1Percentage: 50,
      parent2Percentage: 50,
    }
  }

  const parent1Percentage = (parent1Income / totalIncome) * 100
  const parent2Percentage = (parent2Income / totalIncome) * 100

  return {
    parent1Share: Math.round((totalExpense * parent1Income) / totalIncome),
    parent2Share: Math.round((totalExpense * parent2Income) / totalIncome),
    parent1Percentage: Math.round(parent1Percentage),
    parent2Percentage: Math.round(parent2Percentage),
  }
}

/**
 * Estimate support amount from simplified inputs
 * Quick calculator for users who don't have detailed info
 */
export function estimateChildSupport(
  payingParentIncome: number,
  receivingParentIncome: number,
  numberOfChildren: number,
  payingParentTimeshare: number = 20 // Default: every other weekend
): number {
  // Use default deductions (approximate 20% for taxes)
  const parent1Deductions = payingParentIncome * 0.20
  const parent2Deductions = receivingParentIncome * 0.20

  const result = calculateChildSupport({
    parent1GrossIncome: payingParentIncome,
    parent1Deductions,
    parent1Timeshare: payingParentTimeshare,
    parent2GrossIncome: receivingParentIncome,
    parent2Deductions,
    parent2Timeshare: 100 - payingParentTimeshare,
    numberOfChildren,
    childcareCosts: 0,
    healthInsurancePremium: 0,
    uninsuredMedicalCosts: 0,
  })

  return result.monthlySupport
}

/**
 * Validate child support inputs
 */
export function validateSupportInputs(inputs: ChildSupportInputs): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (inputs.parent1GrossIncome < 0) {
    errors.push('Parent 1 income cannot be negative')
  }

  if (inputs.parent2GrossIncome < 0) {
    errors.push('Parent 2 income cannot be negative')
  }

  if (inputs.parent1GrossIncome === 0 && inputs.parent2GrossIncome === 0) {
    errors.push('At least one parent must have income')
  }

  if (inputs.numberOfChildren < 1 || inputs.numberOfChildren > 20) {
    errors.push('Number of children must be between 1 and 20')
  }

  if (inputs.parent1Timeshare < 0 || inputs.parent1Timeshare > 100) {
    errors.push('Parent 1 timeshare must be between 0% and 100%')
  }

  if (inputs.parent2Timeshare < 0 || inputs.parent2Timeshare > 100) {
    errors.push('Parent 2 timeshare must be between 0% and 100%')
  }

  if (inputs.parent1Timeshare + inputs.parent2Timeshare !== 100) {
    errors.push('Timeshare percentages must add up to exactly 100%')
  }

  if (inputs.childcareCosts < 0) {
    errors.push('Childcare costs cannot be negative')
  }

  if (inputs.healthInsurancePremium < 0) {
    errors.push('Health insurance premium cannot be negative')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Format support calculation for display
 */
export function formatSupportCalculation(result: ChildSupportResult): string {
  const lines: string[] = []

  lines.push('=== CALIFORNIA CHILD SUPPORT CALCULATION ===')
  lines.push('')
  lines.push(`Parent 1 Net Income: $${result.breakdown.parent1NetIncome}/mo`)
  lines.push(`Parent 2 Net Income: $${result.breakdown.parent2NetIncome}/mo`)
  lines.push(`Total Net Income: $${result.breakdown.totalNetIncome}/mo`)
  lines.push('')
  lines.push(`Base Support Amount: $${result.baseSupport}/mo`)
  if (result.breakdown.childcareAddOn > 0) {
    lines.push(`  + Childcare: $${result.breakdown.childcareAddOn}/mo`)
  }
  if (result.breakdown.healthInsuranceAddOn > 0) {
    lines.push(`  + Health Insurance: $${result.breakdown.healthInsuranceAddOn}/mo`)
  }
  if (result.breakdown.uninsuredMedicalAddOn > 0) {
    lines.push(`  + Uninsured Medical: $${result.breakdown.uninsuredMedicalAddOn}/mo`)
  }
  lines.push('─'.repeat(40))
  lines.push(`TOTAL MONTHLY SUPPORT: $${result.monthlySupport}/mo`)
  lines.push('')

  if (result.warnings.length > 0) {
    lines.push('WARNINGS:')
    result.warnings.forEach(warning => lines.push(`  ${warning}`))
  }

  return lines.join('\n')
}
