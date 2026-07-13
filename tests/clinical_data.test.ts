import { describe, it, expect } from 'vitest';
import {
  DOMAIN_DATA_VERSION,
  CLINICAL_DATA_SPEC_REVISION,
  provenanceManifest,
  sepsisRules,
  sepsisRulesVi,
  sugammadexRulesVi,
  noraLocations,
  asraGuidelines,
  chronicMeds,
  chronicMedsGuidelinesVi,
  comorbidities,
  crisisProtocols,
  drugs,
  flagMapping,
  labTests,
  labTestsInfoVi,
  localAnesthetics,
  localAnestheticsInfoVi,
  nerveBlocks,
  nerveBlocksInfoVi,
  rulesAdaptations,
  rulesAdaptationsVi,
  rulesCategoryMapping,
  rulesTriggerLabels,
  surgeries,
} from '../src/domain/data';

describe('Clinical Domain Data Integrity & Provenance', () => {
  it('exports correct domain version and specification constants', () => {
    expect(DOMAIN_DATA_VERSION).toBe('1.0.0');
    expect(CLINICAL_DATA_SPEC_REVISION).toBe('2026-P0');
  });

  it('loads provenance manifest with valid structure and governance policies', () => {
    expect(provenanceManifest).toBeDefined();
    expect(provenanceManifest.manifestVersion).toBe('1.0.0');
    expect(provenanceManifest.defaultLicense).toBe('CC-BY-NC-4.0');
    expect(provenanceManifest.dataGovernancePolicy).toBe('SYNTHETIC_MOCK_NO_PHI');
    expect(provenanceManifest.files).toBeDefined();
  });

  it('validates provenance entries for all 22 migrated datasets', () => {
    const expectedFiles = [
      'sepsis_rules.json',
      'sepsis_rules_vi.json',
      'sugammadex_rules_vi.json',
      'nora_locations.json',
      'asra_guidelines.json',
      'chronic_meds.json',
      'chronic_meds_guidelines_vi.json',
      'comorbidities.json',
      'crisis_protocols.json',
      'drugs.json',
      'flag_mapping.json',
      'lab_tests.json',
      'lab_tests_info_vi.json',
      'local_anesthetics.json',
      'local_anesthetics_info_vi.json',
      'nerve_blocks.json',
      'nerve_blocks_info_vi.json',
      'rules_adaptations.json',
      'rules_adaptations_vi.json',
      'rules_category_mapping.json',
      'rules_trigger_labels.json',
      'surgeries.json',
    ];

    expect(Object.keys(provenanceManifest.files)).toHaveLength(22);

    expectedFiles.forEach((filename) => {
      const entry = provenanceManifest.files[filename];
      expect(entry, `Missing provenance entry for ${filename}`).toBeDefined();
      expect(entry.license).toBe('CC-BY-NC-4.0');
      expect(entry.synthetic).toBe(true);
      expect(entry.containsPHI).toBe(false);
      expect(entry.source).toBeTruthy();
      expect(entry.citation).toBeTruthy();
    });
  });

  describe('Sepsis Bundle Rules & Localization', () => {
    it('contains all 7 core clinical condition keys', () => {
      const conditionKeys = ['sepsis', 'dka', 'arrest', 'respiratory', 'renal', 'toxic', 'general'];
      conditionKeys.forEach((key) => {
        expect(sepsisRules[key], `Missing condition ${key} in sepsis_rules.json`).toBeDefined();
        expect(sepsisRulesVi[key], `Missing condition ${key} in sepsis_rules_vi.json`).toBeDefined();
      });
    });

    it('defines accurate clinical action thresholds for sepsis', () => {
      expect(sepsisRules.sepsis.lactateActionThreshold).toBe(2);
      expect(sepsisRules.sepsis.lactateUrgentThreshold).toBe(4);
      expect(sepsisRules.sepsis.pHActionThreshold).toBe(7.2);
      expect(sepsisRules.sepsis.referenceCitation).toContain('Surviving Sepsis Campaign');
    });
  });

  describe('Sugammadex Reversal Guidelines', () => {
    it('loads 121 clinical rule items in Vietnamese dataset', () => {
      expect(Array.isArray(sugammadexRulesVi)).toBe(true);
      expect(sugammadexRulesVi.length).toBe(121);
    });

    it('contains valid title and body strings for dosing and crisis rules', () => {
      sugammadexRulesVi.slice(0, 10).forEach((rule) => {
        expect(rule.t).toBeTruthy();
        expect(rule.b).toBeTruthy();
      });
    });
  });

  describe('NORA Locations Safety Specs', () => {
    it('defines 12 NORA location suites', () => {
      const locationKeys = [
        'ect',
        'cardiac_cath',
        'vascular_ir',
        'gi_endoscopy',
        'tee_lab',
        'mri_suite',
        'ct_radiology',
        'bronchoscopy',
        'icu_procedures',
        'dental',
        'pain_clinic',
        'neonatal_paeds',
      ];

      locationKeys.forEach((locKey) => {
        const loc = noraLocations[locKey];
        expect(loc, `Missing NORA location ${locKey}`).toBeDefined();
        expect(loc.id).toBe(locKey);
        expect(loc.label).toBeTruthy();
        expect(Array.isArray(loc.procedures)).toBe(true);
        expect(Array.isArray(loc.equipmentChecklist)).toBe(true);
        expect(Array.isArray(loc.redFlags)).toBe(true);
      });
    });
  });

  describe('Other Clinical Domain Datasets Integrity', () => {
    it('loads ASRA guidelines correctly', () => {
      expect(asraGuidelines).toBeDefined();
      expect(Object.keys(asraGuidelines).length).toBeGreaterThan(0);
    });

    it('loads chronic medication datasets', () => {
      expect(chronicMeds).toBeDefined();
      expect(chronicMedsGuidelinesVi).toBeDefined();
    });

    it('loads comorbidities taxonomy', () => {
      expect(comorbidities).toBeDefined();
    });

    it('loads crisis protocols', () => {
      expect(crisisProtocols).toBeDefined();
    });

    it('loads pharmacology master dataset (drugs)', () => {
      expect(drugs).toBeDefined();
    });

    it('loads risk flag mapping and category hierarchy', () => {
      expect(flagMapping).toBeDefined();
      expect(rulesCategoryMapping).toBeDefined();
      expect(rulesTriggerLabels).toBeDefined();
    });

    it('loads lab test reference values (EN & VI)', () => {
      expect(labTests).toBeDefined();
      expect(labTestsInfoVi).toBeDefined();
    });

    it('loads local anesthetic dosing limits (EN & VI)', () => {
      expect(localAnesthetics).toBeDefined();
      expect(localAnestheticsInfoVi).toBeDefined();
    });

    it('loads nerve block guidelines (EN & VI)', () => {
      expect(nerveBlocks).toBeDefined();
      expect(nerveBlocksInfoVi).toBeDefined();
    });

    it('loads clinical rule adaptations (EN & VI)', () => {
      expect(rulesAdaptations).toBeDefined();
      expect(rulesAdaptationsVi).toBeDefined();
    });

    it('loads surgical procedure taxonomy', () => {
      expect(surgeries).toBeDefined();
    });
  });
});
