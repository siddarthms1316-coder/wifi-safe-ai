export type DataSourceMode =
  | 'LIVE_CSI'
  | 'LIVE_DEVICE_TELEMETRY'
  | 'RECORDED_CSI'
  | 'SIMULATION';

// Backwards compatibility alias
export type CSIStreamMode = DataSourceMode | 'LIVE' | 'RECORDED' | 'SIMULATION';

export type AvatarActivity =
  | 'standing'
  | 'walking'
  | 'sitting'
  | 'lying'
  | 'hand_movement'
  | 'fall';

export interface DeviceTelemetryData {
  deviceId: string;
  deviceName: string;
  timestamp: number;
  accel: {
    x: number;
    y: number;
    z: number;
  };
  gyro?: {
    x: number;
    y: number;
    z: number;
  };
  orientation?: {
    alpha: number; // 0-360 compass
    beta: number;  // -180 to 180 pitch
    gamma: number; // -90 to 90 roll
  };
  movementIntensity: number; // 0 to 100%
  motionState: 'STATIONARY' | 'SLIGHT_MOTION' | 'ACTIVE' | 'SUDDEN_MOTION' | 'POSSIBLE_FALL';
  samplingRateHz?: number;
  totalPackets?: number;
  packetRate?: number;
}

export interface CSIRawPacket {
  timestamp: number;
  subcarriers: number[];
  amplitude: number[];
  phase: number[];
  frequency: number;
  deviceId: string;
  snr?: number;
  rssi?: number;
}

export interface RoomCoordinates {
  x: number; // 0 to 1 normalized or in meters (0 to 5m)
  y: number;
}

export interface RoomConfig {
  widthMeters: number;
  lengthMeters: number;
  txPosition: RoomCoordinates;
  rxPosition: RoomCoordinates;
  humanPosition: RoomCoordinates;
  showFresnelZones: boolean;
  showMultipathRays: boolean;
  showDigitalGrid: boolean;
}

export interface PairedDevice {
  id: string;
  name: string;
  role: 'PHONE_TELEMETRY' | 'CSI_TRANSMITTER' | 'CSI_RECEIVER' | 'MONITOR';
  pairingCode: string;
  connectedAt: string;
  snr: number;
  status: 'ONLINE' | 'STANDBY' | 'DISCONNECTED';
  lastPingMs?: number;
  packetsReceived?: number;
}

export interface RecordedDataset {
  id: string;
  title: string;
  durationSec: number;
  packetCount: number;
  description: string;
  hardwareSource: string;
  baselineSnr: number;
  primaryActivity: AvatarActivity;
  frames: CSIRawPacket[];
}

export type FallSequenceStage =
  | 'normal_movement'
  | 'sudden_csi_disturbance'
  | 'potential_fall'
  | 'post_event_inactivity'
  | 'ai_verification'
  | 'safety_alert';

export interface RiskBreakdown {
  csiDisturbance: number;
  inactivityScore: number;
  anomalyScore: number;
  confidenceFactor: number;
  totalScore: number;
  riskCategory: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface VirtualRoomEvent {
  id: string;
  timestamp: string;
  title: string;
  type: 'info' | 'activity' | 'warning' | 'alert' | 'connection';
  details: string;
  sourceBadge?: DataSourceMode;
}
