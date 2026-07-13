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

describe('Clinical Domain Data Integrity, Schema & Provenance Stress Tests', () => {
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
      expect(typeof entry.source).toBe('string');
      expect(entry.source.length).toBeGreaterThan(0);
      expect(typeof entry.citation).toBe('string');
      expect(entry.citation.length).toBeGreaterThan(0);
      expect(typeof entry.category).toBe('string');
      expect(entry.category.length).toBeGreaterThan(0);
    });
  });

  describe('Medical Citations Validation', () => {
    it('verifies presence of mandatory medical citations across manifest and datasets', () => {
      const allText = JSON.stringify(provenanceManifest) +
        JSON.stringify(sepsisRules) +
        JSON.stringify(sepsisRulesVi) +
        JSON.stringify(sugammadexRulesVi) +
        JSON.stringify(noraLocations) +
        JSON.stringify(asraGuidelines) +
        JSON.stringify(crisisProtocols) +
        JSON.stringify(drugs);

      // SSC 2026
      expect(allText).toMatch(/Surviving Sepsis Campaign (2026|\(SSC\) 2026)/i);
      // ADA 2026
      expect(allText).toMatch(/ADA (Standards of Care )?2026/i);
      // ILCOR 2020
      expect(allText).toMatch(/ILCOR 2020/i);
      // GINA/GOLD 2025
      expect(allText).toMatch(/GINA\/GOLD 2025|GINA 2025|GOLD 2025/i);
      // NAP4
      expect(allText).toMatch(/NAP4/i);
      // ASRA
      expect(allText).toMatch(/ASRA/i);
      // Stoelting
      expect(allText).toMatch(/Stoelting/i);
    });
  });

  describe('Sepsis Bundle Rules & Localization Stress Test', () => {
    it('contains all 7 core clinical condition keys in EN and VI', () => {
      const conditionKeys = ['sepsis', 'dka', 'arrest', 'respiratory', 'renal', 'toxic', 'general'];
      conditionKeys.forEach((key) => {
        expect(sepsisRules[key], `Missing condition ${key} in sepsis_rules.json`).toBeDefined();
        expect(sepsisRulesVi[key], `Missing condition ${key} in sepsis_rules_vi.json`).toBeDefined();
        expect(sepsisRules[key].label).toBeTruthy();
        expect(sepsisRulesVi[key].label).toBeTruthy();
        expect(sepsisRules[key].referenceCitation).toBeTruthy();
        expect(sepsisRulesVi[key].referenceCitation).toBeTruthy();
      });
    });

    it('defines accurate clinical action thresholds for sepsis', () => {
      expect(sepsisRules.sepsis.lactateActionThreshold).toBe(2);
      expect(sepsisRules.sepsis.lactateUrgentThreshold).toBe(4);
      expect(sepsisRules.sepsis.pHActionThreshold).toBe(7.2);
      expect(sepsisRules.sepsis.referenceCitation).toContain('Surviving Sepsis Campaign');
    });
  });

  describe('Sugammadex Reversal Guidelines Stress Test', () => {
    it('loads 121 clinical rule items in Vietnamese dataset', () => {
      expect(Array.isArray(sugammadexRulesVi)).toBe(true);
      expect(sugammadexRulesVi.length).toBe(121);
    });

    it('validates every single rule item structure without missing fields', () => {
      sugammadexRulesVi.forEach((rule, index) => {
        expect(typeof rule.t, `Rule ${index} title must be non-empty string`).toBe('string');
        expect(rule.t.trim().length, `Rule ${index} title empty`).toBeGreaterThan(0);
        expect(typeof rule.b, `Rule ${index} body must be non-empty string`).toBe('string');
        expect(rule.b.trim().length, `Rule ${index} body empty`).toBeGreaterThan(0);
      });
    });
  });

  describe('NORA Locations Safety Specs Stress Test', () => {
    it('defines 12 NORA location suites with deep property checks', () => {
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
        expect(loc.icon).toBeTruthy();
        expect(loc.location).toBeTruthy();
        expect(loc.description).toBeTruthy();
        expect(Array.isArray(loc.procedures)).toBe(true);
        expect(Array.isArray(loc.equipmentChecklist)).toBe(true);
        expect(Array.isArray(loc.redFlags)).toBe(true);

        loc.procedures.forEach((proc, pIdx) => {
          expect(proc.id, `Loc ${locKey} proc ${pIdx} missing id`).toBeTruthy();
          expect(proc.label, `Loc ${locKey} proc ${pIdx} missing label`).toBeTruthy();
          expect(typeof proc.duration, `Loc ${locKey} proc ${pIdx} duration`).toBe('number');
          expect(proc.duration).toBeGreaterThan(0);
          expect(['elective', 'urgent', 'emergency']).toContain(proc.urgency);
        });
      });
    });
  });

  describe('Pharmacology Master Dataset (Drugs) Stress Test', () => {
    it('validates all drug records for schema compliance', () => {
      expect(Object.keys(drugs).length).toBeGreaterThan(0);
      Object.entries(drugs as Record<string, any>).forEach(([drugKey, drug]) => {
        expect(drug.name, `Drug ${drugKey} missing name`).toBeTruthy();
        expect(drug.class, `Drug ${drugKey} missing class`).toBeTruthy();
        expect(Array.isArray(drug.routes), `Drug ${drugKey} routes must be array`).toBe(true);
        expect(drug.routes.length).toBeGreaterThan(0);

        if (drug.adult?.dose) {
          expect(Array.isArray(drug.adult.dose)).toBe(true);
          expect(drug.adult.dose).toHaveLength(2);
          expect(drug.adult.dose[0]).toBeLessThanOrEqual(drug.adult.dose[1]);
        }
        if (drug.paediatric?.dose) {
          expect(Array.isArray(drug.paediatric.dose)).toBe(true);
          expect(drug.paediatric.dose).toHaveLength(2);
          expect(drug.paediatric.dose[0]).toBeLessThanOrEqual(drug.paediatric.dose[1]);
        }
      });
    });
  });

  describe('Taxonomy & Localization Parity Stress Test', () => {
    it('validates ASRA guidelines structure and metadata signature', () => {
      expect(asraGuidelines).toBeDefined();
      expect((asraGuidelines as any)._metadata).toBeDefined();
      expect((asraGuidelines as any)._metadata.signed_by).toBe('Gun');
    });

    it('validates EN vs VI key parity across localized datasets', () => {
      const checkParity = (enObj: any, viObj: any, name: string) => {
        const enKeys = Object.keys(enObj);
        const viKeys = Object.keys(viObj);
        expect(enKeys.length, `${name} key count mismatch`).toBe(viKeys.length);
        enKeys.forEach((key) => {
          expect(viObj[key], `Missing key '${key}' in VI version of ${name}`).toBeDefined();
        });
      };

      checkParity(sepsisRules, sepsisRulesVi, 'sepsisRules');
      checkParity(chronicMeds, chronicMedsGuidelinesVi, 'chronicMeds');
      checkParity(labTests, labTestsInfoVi, 'labTests');
      checkParity(localAnesthetics, localAnestheticsInfoVi, 'localAnesthetics');
      checkParity(nerveBlocks, nerveBlocksInfoVi, 'nerveBlocks');
      checkParity(rulesAdaptations, rulesAdaptationsVi, 'rulesAdaptations');
    });

    it('loads comorbidities, crisisProtocols, surgeries, and mappings without errors', () => {
      expect(comorbidities).toBeDefined();
      expect(Object.keys(comorbidities).length).toBeGreaterThan(0);

      expect(crisisProtocols).toBeDefined();
      expect(Object.keys(crisisProtocols).length).toBeGreaterThan(0);

      expect(surgeries).toBeDefined();
      expect(Object.keys(surgeries).length).toBeGreaterThan(0);

      expect(flagMapping).toBeDefined();
      expect(rulesCategoryMapping).toBeDefined();
      expect(rulesTriggerLabels).toBeDefined();
    });
  });
});
