/**
 * Core Type Definitions for Wi-Safe AI
 * Privacy-preserving RF Channel State Information (CSI) intelligence platform
 */

export type ActivityType =
  | 'no_movement'
  | 'standing'
  | 'walking'
  | 'sitting'
  | 'lying_down'
  | 'hand_movement'
  | 'multiple_people'
  | 'sudden_movement'
  | 'fall';

export interface ActivityMetadata {
  id: ActivityType;
  label: string;
  category: 'stationary' | 'dynamic' | 'hazard' | 'multi';
  description: string;
  typicalVariance: number;
  dopplerRange: [number, number]; // Hz
}

export interface CSISubcarrierSample {
  subcarrierIndex: number;
  amplitude: number;
  phase: number; // in radians (-PI to PI)
  filteredAmplitude: number;
}

export interface CSIDataFrame {
  timestamp: number; // ms
  sequenceNumber: number;
  subcarriers: CSISubcarrierSample[];
  rssi: number; // dBm
  snr: number; // dB
  noiseFloor: number; // dBm
  rawMeanAmplitude: number;
  filteredMeanAmplitude: number;
  variance: number;
  dopplerEnergy: number;
  subcarrierCorrelation: number;
}

export interface CSIFeatures {
  meanAmplitude: number;
  amplitudeVariance: number;
  amplitudeStdDev: number;
  peakToPeak: number;
  spectralEntropy: number;
  dopplerEnergy: number;
  subcarrierCorrelation: number;
  highFreqEnergyRatio: number;
  stationaryIndex: number; // 0 to 1
  accelerationSpike: number;
}

export interface ActivityPrediction {
  activity: ActivityType;
  activityLabel: string;
  confidence: number; // 0 to 100
  probabilities: Record<ActivityType, number>;
  explanation: string;
  keyFactors: {
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    description: string;
  }[];
  timestamp: number;
}

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface RiskFactor {
  name: string;
  points: number;
  description: string;
}

export interface RiskScore {
  score: number; // 0 - 100
  level: RiskLevel;
  factors: RiskFactor[];
  timestamp: number;
}

export type FallDetectionStage =
  | 'normal'
  | 'disturbance_detected'
  | 'monitoring_inactivity'
  | 'evaluating_recovery'
  | 'confirmed_fall'
  | 'cleared_false_alarm';

export interface FallDetectionState {
  stage: FallDetectionStage;
  stageProgress: number; // 0 to 100%
  inactivityTimer: number; // ms elapsed since disturbance
  inactivityThreshold: number; // ms required (e.g. 3500ms)
  disturbanceMagnitude: number;
  confidence: number;
  explanation: string;
  lastUpdated: number;
}

export type AnomalyLevel = 'normal' | 'unusual' | 'critical_anomaly';

export interface AnomalyEvent {
  id: string;
  timestamp: number;
  level: AnomalyLevel;
  distanceFromBaseline: number;
  metric: string;
  explanation: string;
}

export interface BaselineProfile {
  learnedAt: number;
  sampleCount: number;
  meanAmplitude: number;
  meanVariance: number;
  meanDoppler: number;
  isLearned: boolean;
}

export type SafetyEventType =
  | 'normal_activity'
  | 'abnormal_csi'
  | 'possible_fall'
  | 'confirmed_fall'
  | 'prolonged_inactivity'
  | 'multi_person_alert'
  | 'emergency_trigger';

export interface SafetyEvent {
  id: string;
  timestamp: number;
  type?: SafetyEventType;
  title: string;
  activity?: ActivityType;
  confidence: number;
  riskScore: number;
  riskLevel: RiskLevel;
  explanation: string;
  room: string;
  status: 'active' | 'acknowledged' | 'dismissed' | 'escalated' | 'resolved';
}

export interface SimulatorConfig {
  activity: ActivityType;
  peopleCount: number;
  movementIntensity: number; // 1 to 10
  noiseLevel: number; // 1 to 10 (or dB)
  signalStrength: number; // -85 to -30 dBm
  subcarrierCount: number; // 30 or 52
  samplingRateHz: number; // 10, 20, 50, 100
  roomSize: 'small' | 'medium' | 'large'; // 12m², 25m², 50m²
  distanceMeters: number; // distance between Tx and Rx
  sensitivity: number; // 1 to 10
  fallThreshold: number; // 50 to 95
  isPaused: boolean;
}

export interface OccupancyEstimate {
  estimatedPeople: number;
  count: number;
  confidence: number;
  entropy: number;
  varianceProfile: string;
  crowdLevel: string;
  statusText: string;
  varianceSum?: number;
}

export interface TrainingSample {
  features: CSIFeatures;
  label: ActivityType;
}

export interface ConfusionMatrixRow {
  actual: ActivityType;
  predicted: Record<ActivityType, number>;
}

export interface TrainingResult {
  trainedAt: number;
  sampleCount: number;
  trainRatio: number;
  trainAccuracy: number;
  testAccuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: ConfusionMatrixRow[];
  featureImportance: { feature: string; importance: number }[];
  classDistribution: Record<ActivityType, number>;
}

export interface ScenarioStep {
  durationSeconds: number;
  activity: ActivityType;
  peopleCount: number;
  title: string;
  description: string;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  totalDurationSeconds: number;
  steps: ScenarioStep[];
}

export interface SystemStatus {
  online: boolean;
  activeSource: 'simulated' | 'recorded' | 'hardware_ready';
  streamFps: number;
  framesProcessed: number;
  uptimeSeconds: number;
  memoryUsageMb: number;
  latencyMs: number;
}
