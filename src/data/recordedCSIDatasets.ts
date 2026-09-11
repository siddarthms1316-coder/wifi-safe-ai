import { CSIRawPacket, RecordedDataset } from '../types/virtualRoom';

// Utility to generate realistic OFDM 30-subcarrier frames
function generateDatasetFrames(
  count: number,
  baseTime: number,
  profile: 'walking' | 'fall' | 'sitting' | 'empty'
): CSIRawPacket[] {
  const frames: CSIRawPacket[] = [];
  const baseFreq = 5180; // 5GHz Channel 36

  for (let i = 0; i < count; i++) {
    const timestamp = baseTime + i * 20; // 50 Hz (20ms interval)
    const t = i / 50; // time in seconds

    const amplitude: number[] = [];
    const phase: number[] = [];
    const subcarriers = Array.from({ length: 30 }, (_, idx) => idx);

    for (let k = 0; k < 30; k++) {
      const subcarrierFreqOffset = (k - 15) * 0.3125; // 312.5 kHz subcarrier spacing
      const staticMultipath = 22 + Math.sin(k * 0.4) * 5 + Math.cos(k * 0.7) * 3;

      let dynamicPerturbation = 0;
      let phaseShift = ((k * 0.2) % (2 * Math.PI)) - Math.PI;

      if (profile === 'empty') {
        // Only ambient thermal noise & oscillator drift
        dynamicPerturbation = (Math.random() - 0.5) * 0.8;
        phaseShift += (Math.random() - 0.5) * 0.08;
      } else if (profile === 'walking') {
        // Gait cadence ~1.2 Hz Doppler oscillation across subcarriers
        const gaitCycle = Math.sin(2 * Math.PI * 1.2 * t + k * 0.15);
        dynamicPerturbation = gaitCycle * (6 + Math.sin(k * 0.5) * 2) + (Math.random() - 0.5) * 1.2;
        phaseShift += Math.sin(2 * Math.PI * 1.2 * t) * 0.8;
      } else if (profile === 'sitting') {
        // Transition around t=3s to t=5s
        if (t >= 2.5 && t <= 5.5) {
          const trans = Math.sin(((t - 2.5) / 3) * Math.PI);
          dynamicPerturbation = trans * 9 + (Math.random() - 0.5) * 1.5;
          phaseShift += trans * 1.2;
        } else {
          // Low stillness micro-respiration
          dynamicPerturbation = Math.sin(2 * Math.PI * 0.25 * t) * 1.5 + (Math.random() - 0.5) * 0.6;
        }
      } else if (profile === 'fall') {
        // Walking up to 4s, sharp shock at 4.2s to 4.8s, dead stillness after 5s
        if (t < 4.0) {
          dynamicPerturbation = Math.sin(2 * Math.PI * 1.1 * t + k * 0.2) * 5 + (Math.random() - 0.5);
        } else if (t >= 4.0 && t <= 4.8) {
          // Fall impact: severe multipath disruption & multi-subcarrier phase desynchronization
          const shock = Math.exp(-Math.pow((t - 4.35) / 0.35, 2));
          dynamicPerturbation = shock * (28 + Math.sin(k * 0.8) * 8) + (Math.random() - 0.5) * 4;
          phaseShift = (Math.random() - 0.5) * Math.PI * 1.8;
        } else {
          // Post-fall ground stillness (abnormal zero-frequency flatline)
          dynamicPerturbation = (Math.random() - 0.5) * 0.4;
          phaseShift = 0.1 * Math.sin(k * 0.3);
        }
      }

      const finalAmp = Math.max(2, Math.round((staticMultipath + dynamicPerturbation) * 10) / 10);
      amplitude.push(finalAmp);
      phase.push(Math.round(phaseShift * 100) / 100);
    }

    frames.push({
      timestamp,
      subcarriers,
      amplitude,
      phase,
      frequency: baseFreq,
      deviceId: 'EXP-ESP32-LAB-01',
      snr: profile === 'fall' ? 29.4 : 33.8,
      rssi: -48,
    });
  }

  return frames;
}

const now = Date.now() - 3600000; // 1 hour ago baseline

export const RECORDED_CSI_DATASETS: RecordedDataset[] = [
  {
    id: 'rec_fall_01',
    title: 'Sudden Tripping Fall & Inactivity (High Doppler Shock)',
    durationSec: 10,
    packetCount: 500,
    description:
      'Ground-truth empirical capture of an adult stumbling forward and impacting the floor, followed by complete physical stillness.',
    hardwareSource: 'ESP32-S3 Dual Antenna CSI (5GHz, Ch36, 50Hz)',
    baselineSnr: 32.5,
    primaryActivity: 'fall',
    frames: generateDatasetFrames(500, now, 'fall'),
  },
  {
    id: 'rec_walk_01',
    title: 'Continuous Room Walking (Normal 1.2Hz Biomechanical Cadence)',
    durationSec: 10,
    packetCount: 500,
    description:
      'Regular continuous pacing between Fresnel zone 1 and 2 with periodic limb and torso Doppler oscillations.',
    hardwareSource: 'ESP32-S3 Dual Antenna CSI (5GHz, Ch36, 50Hz)',
    baselineSnr: 34.2,
    primaryActivity: 'walking',
    frames: generateDatasetFrames(500, now + 120000, 'walking'),
  },
  {
    id: 'rec_sit_01',
    title: 'Stand-to-Sit Transition & Seated Micro-Respiration',
    durationSec: 10,
    packetCount: 500,
    description:
      'Controlled descent into armchair with deceleration and subsequent chest displacement subcarrier tracking.',
    hardwareSource: 'ESP32-S3 Dual Antenna CSI (5GHz, Ch36, 50Hz)',
    baselineSnr: 35.1,
    primaryActivity: 'sitting',
    frames: generateDatasetFrames(500, now + 240000, 'sitting'),
  },
  {
    id: 'rec_empty_01',
    title: 'Empty Room Baseline (Static Multipath & Thermal Drift)',
    durationSec: 10,
    packetCount: 500,
    description:
      'Zero human occupancy capturing environmental multipath wall reflections and ambient RF oscillator variance.',
    hardwareSource: 'ESP32-S3 Dual Antenna CSI (5GHz, Ch36, 50Hz)',
    baselineSnr: 36.8,
    primaryActivity: 'standing',
    frames: generateDatasetFrames(500, now + 360000, 'empty'),
  },
];
