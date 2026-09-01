import { describe, it, expect } from 'vitest';
import {
  vEmail,
  vPassword,
  vPositiveAmount,
  signUpSchema,
} from '../../lib/validation/schemas';

describe('Validation Common Functions & Schemas', () => {
  it('validates email correctly using vEmail', () => {
    expect(vEmail().safeParse('test@example.com').success).toBe(true);
    expect(vEmail().safeParse('invalid-email').success).toBe(false);
  });

  it('validates password requirements using vPassword', () => {
    expect(vPassword().safeParse('Pass1234').success).toBe(true);
    expect(vPassword().safeParse('short').success).toBe(false);
    expect(vPassword().safeParse('nouppercase123').success).toBe(false);
  });

  it('validates positive amounts using vPositiveAmount', () => {
    expect(vPositiveAmount().safeParse(500).success).toBe(true);
    expect(vPositiveAmount().safeParse(0).success).toBe(false);
    expect(vPositiveAmount().safeParse(-10).success).toBe(false);
  });

  it('enforces password matching refinement in signUpSchema', () => {
    const valid = signUpSchema.safeParse({
      full_name: 'Test User',
      email: 'test@example.com',
      password: 'Password1',
      confirm_password: 'Password1',
      agreed: true,
    });
    expect(valid.success).toBe(true);

    const mismatch = signUpSchema.safeParse({
      full_name: 'Test User',
      email: 'test@example.com',
      password: 'Password1',
      confirm_password: 'DifferentPassword1',
      agreed: true,
    });
    expect(mismatch.success).toBe(false);
  });
});
