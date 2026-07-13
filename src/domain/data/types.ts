/**
 * Clinical Domain Data Types & Provenance Interfaces
 * AnesthOS-app Domain Layer
 */

export interface ProvenanceFileEntry {
  source: string;
  license: string;
  synthetic: boolean;
  containsPHI: boolean;
  citation: string;
  category: string;
}

export interface ProvenanceManifest {
  $schema?: string;
  manifestVersion: string;
  updatedAt: string;
  defaultLicense: string;
  dataGovernancePolicy: string;
  files: Record<string, ProvenanceFileEntry>;
}

// Sepsis & Critical Care Guidelines
export interface BaseClinicalRule {
  label: string;
  pHActionThreshold?: number | null;
  bicarbAdvice?: string;
  bicarbCautious?: boolean;
  fluidStrategy?: string;
  glucoseTarget?: string;
  referenceCitation: string;
  [key: string]: unknown;
}

export interface SepsisRule extends BaseClinicalRule {
  lactateActionThreshold?: number;
  lactateUrgentThreshold?: number;
  vasopressor?: string;
  screening?: string;
  lactateNote?: string;
  antimicrobials?: string;
}

export interface DkaRule extends BaseClinicalRule {
  insulinDose?: string;
  fluidProtocol?: string;
  potassiumProtocol?: string;
  cerebralEdemaRisk?: string;
  euglycemicDKA?: string;
}

export interface CardiacArrestRule extends BaseClinicalRule {
  targetPaCO2?: string;
  targetPaO2?: string;
  targetTemp?: string;
}

export interface RespiratoryFailureRule extends BaseClinicalRule {
  paCO2COPDtarget?: string;
  nivIndications?: string;
  intubationCriteria?: string;
  asthmaRule?: string;
  copdInhalerNote?: string;
}

export interface RenalRule extends BaseClinicalRule {
  kManagement?: string;
  drugAdjustment?: string;
  framework?: string;
}

export interface ToxicIngestionRule extends BaseClinicalRule {
  osmolarGapThreshold?: number;
  methanolAntidote?: string;
  ethyleneGlycolAntidote?: string;
  salicylateAntidote?: string;
  isopropanolAdvice?: string;
}

export interface SepsisRuleset {
  sepsis: SepsisRule;
  dka: DkaRule;
  arrest: CardiacArrestRule;
  respiratory: RespiratoryFailureRule;
  renal: RenalRule;
  toxic: ToxicIngestionRule;
  general: BaseClinicalRule;
  [key: string]: BaseClinicalRule;
}

// Sugammadex Reversal Guidelines
export interface SugammadexRuleItem {
  t: string;
  b: string;
}

export type SugammadexRuleset = SugammadexRuleItem[];

// NORA Safety Specs
export type NoraUrgency = 'elective' | 'urgent' | 'emergency';

export interface NoraProcedureSpecificDetails {
  summary?: string;
  preferredTechnique?: string;
  drugsToAvoid?: string[];
  drugsPreferred?: string[];
  monitoringEmphasis?: string[];
  procedureConcerns?: string[];
  crisisPlan?: string;
  patientSelection?: string[];
  references?: string;
  [key: string]: unknown;
}

export interface NoraProcedure {
  id: string;
  label: string;
  duration: number;
  urgency: NoraUrgency;
  procedureSpecific?: NoraProcedureSpecificDetails;
}

export interface NoraDrugOption {
  drug: string;
  dose: string;
  notes: string;
  preferred?: boolean;
  alternative?: boolean;
}

export interface NoraMonitoringSpec {
  required: string[];
  additional?: string[];
}

export interface NoraRecoverySpec {
  criteria: string;
  duration: string;
  disposition: string;
  warnings: string;
}

export interface NoraLocationSpec {
  id: string;
  label: string;
  icon: string;
  location: string;
  description: string;
  typicalDuration: string;
  typicalSetting: string;
  procedures: NoraProcedure[];
  techniques: string[];
  monitoring: NoraMonitoringSpec;
  inductionAgents: NoraDrugOption[];
  muscleRelaxants?: NoraDrugOption[];
  drugCautions: string[];
  procedureConcerns: string[];
  equipmentChecklist: string[];
  recovery: NoraRecoverySpec;
  redFlags: string[];
  specialPopulations?: string[];
  references: string;
}

export type NoraLocationsMap = Record<string, NoraLocationSpec>;
