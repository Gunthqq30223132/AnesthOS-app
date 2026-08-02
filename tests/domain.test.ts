import { describe, it, expect } from 'vitest';
import { calculateIBW, ClinicalValidationError } from '../src/domain/calculators/ibw';

describe('Ideal Body Weight (IBW) Calculator Domain Logic', () => {
  it('calculates IBW correctly for male (height 175 cm)', () => {
    const result = calculateIBW({ heightCm: 175, gender: 'male' });
    // 175 cm = 68.8976 inches. Inches over 60 = 8.8976. 50 + 2.3 * 8.8976 = 70.464 -> rounded 70.5
    expect(result.ibwKg).toBe(70.5);
    expect(result.adjustedBodyWeightKg).toBe(70.5);
    expect(result.formula).toBe('Devine Formula (1974)');
    expect(result.provenance.issuingOrganization).toBe('Drug Intelligence & Clinical Pharmacy');
  });

  it('calculates IBW correctly for female (height 160 cm)', () => {
    const result = calculateIBW({ heightCm: 160, gender: 'female' });
    // 160 cm = 62.9921 inches. Inches over 60 = 2.9921. 45.5 + 2.3 * 2.9921 = 52.38 -> rounded 52.4
    expect(result.ibwKg).toBe(52.4);
    expect(result.adjustedBodyWeightKg).toBe(52.4);
  });

  it('calculates Adjusted Body Weight when actual weight exceeds IBW', () => {
    const result = calculateIBW({ heightCm: 175, gender: 'male' }, 100);
    // IBW = 70.5. ABW = 70.5 + 0.4 * (100 - 70.5) = 70.5 + 11.8 = 82.3
    expect(result.adjustedBodyWeightKg).toBe(82.3);
  });

  it('throws ClinicalValidationError for height below Devine threshold (< 152.4 cm)', () => {
    // Devine formula (1974) is only validated for adults ≥ 5 feet (152.4 cm).
    // Previously this silently returned 50 kg (male) — a potentially fatal
    // overestimate for pediatric weight-based dosing.
    expect(() => calculateIBW({ heightCm: 150, gender: 'male' })).toThrow(/HEIGHT_BELOW_DEVINE_THRESHOLD/);
    expect(() => calculateIBW({ heightCm: 150, gender: 'female' })).toThrow(/HEIGHT_BELOW_DEVINE_THRESHOLD/);
  });

  it('throws ClinicalValidationError for neonate height (50 cm)', () => {
    // Critical: 50cm neonate → old code returned IBW = 50 kg, ~17x overestimate.
    expect(() => calculateIBW({ heightCm: 50, gender: 'male' })).toThrow(ClinicalValidationError);
    expect(() => calculateIBW({ heightCm: 50, gender: 'male' })).toThrow(/HEIGHT_BELOW_DEVINE_THRESHOLD/);
  });

  it('throws ClinicalValidationError for pediatric height (100 cm)', () => {
    expect(() => calculateIBW({ heightCm: 100, gender: 'female' })).toThrow(/HEIGHT_BELOW_DEVINE_THRESHOLD/);
  });

  it('accepts height at exact Devine threshold (152.4 cm)', () => {
    // Boundary: exactly 152.4 cm should work (≥ threshold)
    const result = calculateIBW({ heightCm: 152.4, gender: 'male' });
    expect(result.ibwKg).toBe(50.0);
  });

  it('throws ClinicalValidationError when height is zero or negative', () => {
    expect(() => calculateIBW({ heightCm: 0, gender: 'male' })).toThrow(ClinicalValidationError);
    expect(() => calculateIBW({ heightCm: -10, gender: 'male' })).toThrow(/HEIGHT_OUT_OF_RANGE/);
  });

  it('throws ClinicalValidationError when height exceeds 300 cm', () => {
    expect(() => calculateIBW({ heightCm: 350, gender: 'female' })).toThrow(ClinicalValidationError);
  });

  it('throws ClinicalValidationError for invalid height type', () => {
    // @ts-expect-error Testing runtime invalid input
    expect(() => calculateIBW({ heightCm: 'invalid', gender: 'male' })).toThrow(/INVALID_HEIGHT_TYPE/);
  });

  it('throws ClinicalValidationError for invalid gender', () => {
    // @ts-expect-error Testing runtime invalid input
    expect(() => calculateIBW({ heightCm: 170, gender: 'other' })).toThrow(/INVALID_GENDER/);
  });

  it('throws ClinicalValidationError for invalid actual weight', () => {
    expect(() => calculateIBW({ heightCm: 170, gender: 'male' }, -5)).toThrow(/WEIGHT_OUT_OF_RANGE/);
    expect(() => calculateIBW({ heightCm: 170, gender: 'male' }, 600)).toThrow(/WEIGHT_OUT_OF_RANGE/);
  });
});
