import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const onboardingTestSchema = z.object({
  full_name: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  date_of_birth: z.string().min(1, 'Please enter a valid date of birth'),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Please select your gender' }),
  }),
  phone: z.string().optional(),
  preferred_currency: z.string().default('BDT'),
  account_name: z.string().trim().min(1, 'Account name is required'),
  account_type: z.enum(['cash', 'bank', 'mobile_financial_service', 'savings']),
  opening_balance: z.number().min(0, 'Starting balance cannot be negative'),
  opening_balance_date: z.string().min(1),
});

describe('Onboarding Architecture & State Validation', () => {
  it('validates a complete and correct onboarding payload', () => {
    const payload = {
      full_name: 'Abdullah Al Mamun',
      date_of_birth: '1995-06-15',
      gender: 'male' as const,
      phone: '+8801700000000',
      preferred_currency: 'BDT',
      account_name: 'Physical Cash',
      account_type: 'cash' as const,
      opening_balance: 5000,
      opening_balance_date: '2026-09-07',
    };

    const result = onboardingTestSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('rejects incomplete personal profile (short name, missing dob, invalid gender)', () => {
    const invalidName = onboardingTestSchema.safeParse({
      full_name: 'A',
      date_of_birth: '1995-06-15',
      gender: 'male',
      account_name: 'Cash',
      account_type: 'cash',
      opening_balance: 0,
      opening_balance_date: '2026-09-07',
    });
    expect(invalidName.success).toBe(false);

    const invalidGender = onboardingTestSchema.safeParse({
      full_name: 'Valid Name',
      date_of_birth: '1995-06-15',
      gender: 'unknown_gender',
      account_name: 'Cash',
      account_type: 'cash',
      opening_balance: 0,
      opening_balance_date: '2026-09-07',
    });
    expect(invalidGender.success).toBe(false);

    const missingDob = onboardingTestSchema.safeParse({
      full_name: 'Valid Name',
      date_of_birth: '',
      gender: 'female',
      account_name: 'Cash',
      account_type: 'cash',
      opening_balance: 0,
      opening_balance_date: '2026-09-07',
    });
    expect(missingDob.success).toBe(false);
  });

  it('rejects negative starting balance', () => {
    const negativeBalance = onboardingTestSchema.safeParse({
      full_name: 'Valid Name',
      date_of_birth: '1990-01-01',
      gender: 'male',
      account_name: 'Cash',
      account_type: 'cash',
      opening_balance: -50,
      opening_balance_date: '2026-09-07',
    });
    expect(negativeBalance.success).toBe(false);
  });

  it('identifies completed status correctly for existing and newly completed users', () => {
    const isCompleted = (profile: { onboarding_status?: string | null; onboarding_completed?: boolean }) => {
      return profile.onboarding_status === 'completed' || profile.onboarding_completed === true;
    };

    // Existing user with legacy boolean true
    expect(isCompleted({ onboarding_completed: true, onboarding_status: 'not_started' })).toBe(true);

    // Newly completed user with new status column
    expect(isCompleted({ onboarding_completed: true, onboarding_status: 'completed' })).toBe(true);

    // Brand-new registered user
    expect(isCompleted({ onboarding_completed: false, onboarding_status: 'not_started' })).toBe(false);

    // In-progress user
    expect(isCompleted({ onboarding_completed: false, onboarding_status: 'in_progress' })).toBe(false);
  });
});
