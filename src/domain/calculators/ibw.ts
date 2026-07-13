/**
 * Ideal Body Weight (IBW) Calculator using Devine Formula (1974)
 * Pure, deterministic clinical domain calculator with fail-loud validation.
 *
 * Provenance: Devine BJ. Gentamicin therapy. Drug Intell Clin Pharm. 1974;8:650-655.
 */

export interface ClinicalProvenance {
  guidelineName: string;
  issuingOrganization: string;
  versionOrYear: string;
  citationDOIorPMID?: string;
  lastReviewedDate: string;
}

export class ClinicalValidationError extends Error {
  constructor(public code: string, message: string) {
    super(`[CLINICAL ERROR: ${code}] ${message}`);
    this.name = 'ClinicalValidationError';
  }
}

export const IBW_PROVENANCE: ClinicalProvenance = {
  guidelineName: 'Devine Ideal Body Weight Formula',
  issuingOrganization: 'Drug Intelligence & Clinical Pharmacy',
  versionOrYear: '1974',
  citationDOIorPMID: 'Devine BJ (1974) DICP 8:650-655',
  lastReviewedDate: '2026-01-15',
};

export interface IBWInput {
  heightCm: number;
  gender: 'male' | 'female';
}

export interface IBWResult {
  ibwKg: number;
  adjustedBodyWeightKg: number;
  formula: string;
  provenance: ClinicalProvenance;
}

/**
 * Calculates Ideal Body Weight (IBW) and Adjusted Body Weight (ABW) using Devine formula.
 *
 * @param input Height in cm and gender
 * @param actualWeightKg Optional actual weight in kg for ABW calculation
 * @returns IBWResult containing calculated weights in kg and provenance metadata
 * @throws ClinicalValidationError if parameters are invalid or outside physiological bounds
 */
export function calculateIBW(input: IBWInput, actualWeightKg?: number): IBWResult {
  const { heightCm, gender } = input;

  if (typeof heightCm !== 'number' || isNaN(heightCm)) {
    throw new ClinicalValidationError('INVALID_HEIGHT_TYPE', 'Height must be a valid number');
  }

  if (heightCm <= 0 || heightCm > 300) {
    throw new ClinicalValidationError(
      'HEIGHT_OUT_OF_RANGE',
      `Height ${heightCm} cm is out of valid clinical range (0 - 300 cm)`
    );
  }

  if (gender !== 'male' && gender !== 'female') {
    throw new ClinicalValidationError(
      'INVALID_GENDER',
      `Gender must be 'male' or 'female', received '${gender}'`
    );
  }

  if (actualWeightKg !== undefined) {
    if (typeof actualWeightKg !== 'number' || isNaN(actualWeightKg) || actualWeightKg <= 0 || actualWeightKg > 500) {
      throw new ClinicalValidationError(
        'WEIGHT_OUT_OF_RANGE',
        `Actual weight ${actualWeightKg} kg is out of valid clinical range (0 - 500 kg)`
      );
    }
  }

  const heightInches = heightCm / 2.54;
  const inchesOver5Feet = Math.max(0, heightInches - 60);

  let ibwKg = 0;
  if (gender === 'male') {
    ibwKg = 50 + 2.3 * inchesOver5Feet;
  } else {
    ibwKg = 45.5 + 2.3 * inchesOver5Feet;
  }

  const roundedIBW = Math.round(ibwKg * 10) / 10;

  let adjustedBodyWeightKg = roundedIBW;
  if (actualWeightKg !== undefined && actualWeightKg > roundedIBW) {
    // ABW = IBW + 0.4 * (Actual Weight - IBW)
    const abw = roundedIBW + 0.4 * (actualWeightKg - roundedIBW);
    adjustedBodyWeightKg = Math.round(abw * 10) / 10;
  }

  return {
    ibwKg: roundedIBW,
    adjustedBodyWeightKg,
    formula: 'Devine Formula (1974)',
    provenance: IBW_PROVENANCE,
  };
}
