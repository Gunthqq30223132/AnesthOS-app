import { ProvenanceManifest, SepsisRuleset, SugammadexRuleset, NoraLocationsMap } from '../../domain/data/types';

export interface ClinicalDataset {
  provenanceManifest: ProvenanceManifest;
  sepsisRules: SepsisRuleset;
  sepsisRulesVi: SepsisRuleset;
  sugammadexRulesVi: SugammadexRuleset;
  noraLocations: NoraLocationsMap;
  asraGuidelines: any;
  chronicMeds: any;
  chronicMedsGuidelinesVi: any;
  comorbidities: any;
  crisisProtocols: any;
  drugs: any;
  flagMapping: any;
  labTests: any;
  labTestsInfoVi: any;
  localAnesthetics: any;
  localAnestheticsInfoVi: any;
  nerveBlocks: any;
  nerveBlocksInfoVi: any;
  rulesAdaptations: any;
  rulesAdaptationsVi: any;
  rulesCategoryMapping: any;
  rulesTriggerLabels: any;
  surgeries: any;
}

const DATA_FILES: Record<keyof ClinicalDataset, string> = {
  provenanceManifest: 'provenance_manifest.json',
  sepsisRules: 'sepsis_rules.json',
  sepsisRulesVi: 'sepsis_rules_vi.json',
  sugammadexRulesVi: 'sugammadex_rules_vi.json',
  noraLocations: 'nora_locations.json',
  asraGuidelines: 'asra_guidelines.json',
  chronicMeds: 'chronic_meds.json',
  chronicMedsGuidelinesVi: 'chronic_meds_guidelines_vi.json',
  comorbidities: 'comorbidities.json',
  crisisProtocols: 'crisis_protocols.json',
  drugs: 'drugs.json',
  flagMapping: 'flag_mapping.json',
  labTests: 'lab_tests.json',
  labTestsInfoVi: 'lab_tests_info_vi.json',
  localAnesthetics: 'local_anesthetics.json',
  localAnestheticsInfoVi: 'local_anesthetics_info_vi.json',
  nerveBlocks: 'nerve_blocks.json',
  nerveBlocksInfoVi: 'nerve_blocks_info_vi.json',
  rulesAdaptations: 'rules_adaptations.json',
  rulesAdaptationsVi: 'rules_adaptations_vi.json',
  rulesCategoryMapping: 'rules_category_mapping.json',
  rulesTriggerLabels: 'rules_trigger_labels.json',
  surgeries: 'surgeries.json'
};

export async function loadClinicalData(): Promise<ClinicalDataset> {
  const dataset = {} as ClinicalDataset;
  const keys = Object.keys(DATA_FILES) as Array<keyof ClinicalDataset>;
  
  await Promise.all(
    keys.map(async (key) => {
      const response = await fetch(`/data/${DATA_FILES[key]}`);
      if (!response.ok) {
        throw new Error(`Failed to load dataset: ${DATA_FILES[key]} (HTTP ${response.status})`);
      }
      dataset[key] = await response.json();
    })
  );
  
  return dataset;
}
