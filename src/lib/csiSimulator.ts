/**
 * Realistic Wi-Fi Channel State Information (CSI) & RF Signal Simulator
 * Simulates multi-subcarrier amplitude, phase, Doppler shift, Fresnel scattering,
 * and temporal patterns characteristic of human activity.
 */

import { ActivityType, CSIDataFrame, CSISubcarrierSample, SimulatorConfig } from '../types';

export const ACTIVITY_METADATA: Record<
  ActivityType,
  { label: string; description: string; expectedVariance: number; color: string }
> = {
  no_movement: {
    label: 'No Movement',
    description: 'Empty room or completely static environment with baseline noise only.',
    expectedVariance: 0.04,
    color: '#64748b', // slate
  },
  standing: {
    label: 'Standing',
    description: 'Stationary person with micro-movements and subtle chest respiration (0.2–0.3 Hz).',
    expectedVariance: 0.12,
    color: '#06b6d4', // cyan
  },
  walking: {
    label: 'Walking',
    description: 'Periodic Doppler oscillation across subcarriers (1.0–2.0 Hz stride cadence).',
    expectedVariance: 0.78,
    color: '#3b82f6', // blue
  },
  sitting: {
    label: 'Sitting',
    description: 'Vertical transition down followed by stationary baseline.',
    expectedVariance: 0.35,
    color: '#8b5cf6', // violet
  },
  lying_down: {
    label: 'Lying Down',
    description: 'Low RF cross-section profile near floor level, minimal reflection variation.',
    expectedVariance: 0.09,
    color: '#6366f1', // indigo
  },
  hand_movement: {
    label: 'Hand Movement',
    description: 'High-frequency localized limb displacement without torso translation.',
    expectedVariance: 0.48,
    color: '#10b981', // emerald
  },
  multiple_people: {
    label: 'Multiple People',
    description: 'Superimposed multipath reflections causing asynchronous subcarrier decorrelation.',
    expectedVariance: 0.95,
    color: '#f59e0b', // amber
  },
  sudden_movement: {
    label: 'Sudden Movement',
    description: 'Brief intense acceleration spike returning quickly to dynamic activity.',
    expectedVariance: 0.88,
    color: '#f97316', // orange
  },
  fall: {
    label: 'Simulated Fall',
    description: 'Catastrophic high-amplitude RF disturbance followed by prolonged flatline inactivity.',
    expectedVariance: 0.98,
    color: '#ef4444', // red
  },
};

export const DEFAULT_SIMULATOR_CONFIG: SimulatorConfig = {
  activity: 'walking',
  peopleCount: 1,
  movementIntensity: 5,
  noiseLevel: 2,
  signalStrength: -45,
  subcarrierCount: 30,
  samplingRateHz: 20,
  roomSize: 'medium',
  distanceMeters: 5,
  sensitivity: 5,
  fallThreshold: 75,
  isPaused: false,
};

export class CSISimulator {
  private config: SimulatorConfig;
  private sequence = 0;
  private timeElapsed = 0; // seconds
  private lastFallTriggerTime = -100;
  private smoothedAmplitudes: number[] = [];

  constructor(initialConfig?: Partial<SimulatorConfig>) {
    this.config = { ...DEFAULT_SIMULATOR_CONFIG, ...initialConfig };
    this.initSubcarrierState();
  }

  private initSubcarrierState() {
    this.smoothedAmplitudes = Array.from({ length: this.config.subcarrierCount }, (_, i) => {
      // Base static channel frequency response (attenuation curve over subcarriers)
      const center = this.config.subcarrierCount / 2;
      const offset = (i - center) / center;
      return 25 + 5 * Math.cos(offset * Math.PI);
    });
  }

  public updateConfig(newConfig: Partial<SimulatorConfig>) {
    const subcarrierCountChanged =
      newConfig.subcarrierCount && newConfig.subcarrierCount !== this.config.subcarrierCount;
    this.config = { ...this.config, ...newConfig };
    if (subcarrierCountChanged) {
      this.initSubcarrierState();
    }
  }

  public getConfig(): SimulatorConfig {
    return { ...this.config };
  }

  public triggerFallEvent() {
    this.lastFallTriggerTime = this.timeElapsed;
    this.config.activity = 'fall';
  }

  /**
   * Generates next discrete CSI frame based on simulated time and physics
   */
  public generateNextFrame(deltaMs: number = 50): CSIDataFrame {
    this.sequence++;
    const dt = (deltaMs || 50) / 1000;
    this.timeElapsed += dt;

    const {
      activity,
      peopleCount,
      movementIntensity,
      noiseLevel,
      signalStrength,
      subcarrierCount,
      distanceMeters,
    } = this.config;

    // Path loss factor based on distance
    const pathLossFactor = Math.max(0.4, 1.0 - (distanceMeters - 2) * 0.05);
    const baseAmp = (Math.abs(signalStrength) * 0.45 + 15) * pathLossFactor;

    // Compute activity-specific dynamics
    let activityVariance = 0;
    let dopplerBase = 0;
    let disturbanceEnergy = 0;

    const t = this.timeElapsed;
    const intensityFactor = movementIntensity / 5;

    // Fall state timing: disturbance lasts ~1.2s, followed by flatline
    const timeSinceFall = t - this.lastFallTriggerTime;
    const isFallInDisturbancePhase = activity === 'fall' && timeSinceFall < 1.4 && timeSinceFall >= 0;
    const isFallInInactivityPhase = activity === 'fall' && timeSinceFall >= 1.4;

    switch (activity) {
      case 'no_movement':
        activityVariance = 0.02;
        dopplerBase = 0.05;
        break;

      case 'standing':
        // 0.25 Hz respiration cycle + tiny postural sway
        activityVariance = 0.1 * intensityFactor;
        dopplerBase = 0.25;
        break;

      case 'walking':
        // 1.4 Hz walking cadence with harmonics
        activityVariance = 0.75 * intensityFactor;
        dopplerBase = 1.4;
        break;

      case 'sitting':
        // Slow transition
        activityVariance = 0.3 * intensityFactor;
        dopplerBase = 0.6;
        break;

      case 'lying_down':
        activityVariance = 0.06;
        dopplerBase = 0.18;
        break;

      case 'hand_movement':
        // High frequency, localized
        activityVariance = 0.5 * intensityFactor;
        dopplerBase = 2.8;
        break;

      case 'multiple_people':
        // Superimposed walking + standing with async frequencies
        activityVariance = 0.85 * Math.min(2.5, 0.8 + peopleCount * 0.35) * intensityFactor;
        dopplerBase = 1.6;
        break;

      case 'sudden_movement':
        // Sharp transient spike with decay
        activityVariance = 0.9 * intensityFactor;
        dopplerBase = 3.5;
        disturbanceEnergy = 18 * Math.exp(-(t % 3) * 2);
        break;

      case 'fall':
        if (isFallInDisturbancePhase) {
          // Intense transient collapse shockwave
          activityVariance = 1.4 * intensityFactor;
          disturbanceEnergy = 28 * Math.sin(timeSinceFall * Math.PI * 3);
          dopplerBase = 4.2;
        } else {
          // Prolonged post-fall immobility (only faint residual respiration)
          activityVariance = 0.03;
          dopplerBase = 0.15;
        }
        break;
    }

    const subcarriers: CSISubcarrierSample[] = [];
    const gaussianNoiseScale = (noiseLevel / 10) * 1.8;

    let sumRaw = 0;
    let sumFiltered = 0;
    let sumSqDiff = 0;

    for (let i = 0; i < subcarrierCount; i++) {
      const k = i - subcarrierCount / 2; // subcarrier offset
      const subcarrierFreqOffset = k * 0.08; // frequency diversity

      // Multi-path reflection modeling
      let dynamicModulation = 0;

      if (activity === 'walking') {
        dynamicModulation =
          Math.sin(2 * Math.PI * dopplerBase * t + subcarrierFreqOffset) * 6.5 * intensityFactor +
          Math.sin(2 * Math.PI * (dopplerBase * 2) * t + k * 0.12) * 2.2;
      } else if (activity === 'standing') {
        dynamicModulation = Math.sin(2 * Math.PI * 0.28 * t + k * 0.04) * 0.9 * intensityFactor;
      } else if (activity === 'hand_movement') {
        // High selective perturbation on subsets of subcarriers
        const subcarrierSensitivity = Math.exp(-Math.pow(k - 2, 2) / 12);
        dynamicModulation =
          Math.sin(2 * Math.PI * dopplerBase * t) * 7.0 * subcarrierSensitivity * intensityFactor;
      } else if (activity === 'multiple_people') {
        // Multi-frequency beating
        dynamicModulation =
          Math.sin(2 * Math.PI * 1.2 * t + k * 0.05) * 4.5 +
          Math.sin(2 * Math.PI * 1.8 * t - k * 0.08) * 3.8 * (peopleCount >= 2 ? 1 : 0.4) +
          Math.cos(2 * Math.PI * 0.7 * t + k * 0.15) * 2.5;
      } else if (activity === 'sitting') {
        const cycle = t % 10;
        if (cycle < 2) {
          dynamicModulation = -Math.sin((cycle / 2) * Math.PI) * 5.0;
        } else {
          dynamicModulation = Math.sin(2 * Math.PI * 0.25 * t) * 0.7;
        }
      } else if (activity === 'lying_down') {
        dynamicModulation = Math.sin(2 * Math.PI * 0.22 * t + k * 0.02) * 0.5;
      } else if (activity === 'sudden_movement') {
        dynamicModulation = disturbanceEnergy * Math.cos(k * 0.15);
      } else if (activity === 'fall') {
        if (isFallInDisturbancePhase) {
          dynamicModulation = disturbanceEnergy * (1.2 + 0.3 * Math.sin(k * 0.4));
        } else {
          // Post-fall quiet stillness
          dynamicModulation = Math.sin(2 * Math.PI * 0.18 * t + k * 0.03) * 0.4;
        }
      }

      // Add Gaussian-like noise
      const u1 = Math.random() || 0.0001;
      const u2 = Math.random() || 0.0001;
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const noise = z0 * gaussianNoiseScale;

      // Base static channel profile + dynamic multipath
      const rawAmp = Math.max(
        2,
        baseAmp + (Math.cos(k * 0.2) * 4) + dynamicModulation + noise
      );

      // Low-pass exponential moving average filter
      const prevSmooth = this.smoothedAmplitudes[i] ?? rawAmp;
      const alpha = 0.22; // filter responsiveness
      const filteredAmp = prevSmooth * (1 - alpha) + rawAmp * alpha;
      this.smoothedAmplitudes[i] = filteredAmp;

      // Phase calculation (simulating carrier phase unwrapping & Doppler rotation)
      const basePhase = (k * 0.12 + t * dopplerBase * 0.4) % (2 * Math.PI);
      const phaseNoise = (Math.random() - 0.5) * 0.15 * (noiseLevel / 5);
      const phase = ((basePhase - Math.PI + phaseNoise + Math.PI * 3) % (2 * Math.PI)) - Math.PI;

      subcarriers.push({
        subcarrierIndex: i,
        amplitude: Number(rawAmp.toFixed(3)),
        phase: Number(phase.toFixed(3)),
        filteredAmplitude: Number(filteredAmp.toFixed(3)),
      });

      sumRaw += rawAmp;
      sumFiltered += filteredAmp;
    }

    const meanRaw = sumRaw / subcarrierCount;
    const meanFiltered = sumFiltered / subcarrierCount;

    for (const sc of subcarriers) {
      sumSqDiff += Math.pow(sc.amplitude - meanRaw, 2);
    }
    const variance = sumSqDiff / subcarrierCount;

    // Subcarrier cross-correlation proxy
    let crossCorrSum = 0;
    for (let i = 0; i < subcarrierCount - 1; i++) {
      const diff1 = subcarriers[i].amplitude - meanRaw;
      const diff2 = subcarriers[i + 1].amplitude - meanRaw;
      crossCorrSum += diff1 * diff2;
    }
    const subcarrierCorrelation = Math.max(
      0.1,
      Math.min(0.99, variance > 0.01 ? crossCorrSum / (variance * subcarrierCount) : 0.85)
    );

    // SNR and Noise floor
    const snr = Math.max(12, Math.min(48, 38 - noiseLevel * 2.2 + (signalStrength + 50) * 0.3));
    const noiseFloor = signalStrength - snr;

    return {
      timestamp: Date.now(),
      sequenceNumber: this.sequence,
      subcarriers,
      rssi: signalStrength,
      snr: Number(snr.toFixed(1)),
      noiseFloor: Number(noiseFloor.toFixed(1)),
      rawMeanAmplitude: Number(meanRaw.toFixed(2)),
      filteredMeanAmplitude: Number(meanFiltered.toFixed(2)),
      variance: Number(variance.toFixed(3)),
      dopplerEnergy: Number((activityVariance * 10).toFixed(2)),
      subcarrierCorrelation: Number(subcarrierCorrelation.toFixed(2)),
    };
  }

  /**
   * Alias for generateNextFrame to maintain backward compatibility
   */
  public generateFrame(deltaMs: number = 50): CSIDataFrame {
    return this.generateNextFrame(deltaMs);
  }
}
