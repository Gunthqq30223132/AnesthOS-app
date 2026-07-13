import provenanceManifestData from './provenance_manifest.json';
import sepsisRulesData from './sepsis_rules.json';
import sepsisRulesViData from './sepsis_rules_vi.json';
import sugammadexRulesViData from './sugammadex_rules_vi.json';
import noraLocationsData from './nora_locations.json';
import asraGuidelinesData from './asra_guidelines.json';
import chronicMedsData from './chronic_meds.json';
import chronicMedsGuidelinesViData from './chronic_meds_guidelines_vi.json';
import comorbiditiesData from './comorbidities.json';
import crisisProtocolsData from './crisis_protocols.json';
import drugsData from './drugs.json';
import flagMappingData from './flag_mapping.json';
import labTestsData from './lab_tests.json';
import labTestsInfoViData from './lab_tests_info_vi.json';
import localAnestheticsData from './local_anesthetics.json';
import localAnestheticsInfoViData from './local_anesthetics_info_vi.json';
import nerveBlocksData from './nerve_blocks.json';
import nerveBlocksInfoViData from './nerve_blocks_info_vi.json';
import rulesAdaptationsData from './rules_adaptations.json';
import rulesAdaptationsViData from './rules_adaptations_vi.json';
import rulesCategoryMappingData from './rules_category_mapping.json';
import rulesTriggerLabelsData from './rules_trigger_labels.json';
import surgeriesData from './surgeries.json';

import type {
  ProvenanceManifest,
  SepsisRuleset,
  SugammadexRuleset,
  NoraLocationsMap,
} from './types';

export const DOMAIN_DATA_VERSION = '1.0.0';
export const CLINICAL_DATA_SPEC_REVISION = '2026-P0';

export * from './types';

export const provenanceManifest = provenanceManifestData as ProvenanceManifest;
export const sepsisRules = sepsisRulesData as SepsisRuleset;
export const sepsisRulesVi = sepsisRulesViData as SepsisRuleset;
export const sugammadexRulesVi = sugammadexRulesViData as SugammadexRuleset;
export const noraLocations = noraLocationsData as NoraLocationsMap;
export const asraGuidelines = asraGuidelinesData;
export const chronicMeds = chronicMedsData;
export const chronicMedsGuidelinesVi = chronicMedsGuidelinesViData;
export const comorbidities = comorbiditiesData;
export const crisisProtocols = crisisProtocolsData;
export const drugs = drugsData;
export const flagMapping = flagMappingData;
export const labTests = labTestsData;
export const labTestsInfoVi = labTestsInfoViData;
export const localAnesthetics = localAnestheticsData;
export const localAnestheticsInfoVi = localAnestheticsInfoViData;
export const nerveBlocks = nerveBlocksData;
export const nerveBlocksInfoVi = nerveBlocksInfoViData;
export const rulesAdaptations = rulesAdaptationsData;
export const rulesAdaptationsVi = rulesAdaptationsViData;
export const rulesCategoryMapping = rulesCategoryMappingData;
export const rulesTriggerLabels = rulesTriggerLabelsData;
export const surgeries = surgeriesData;
