/**
 * Signal Preprocessing & Temporal Feature Extraction Engine
 * Transforms high-frequency raw CSI time-series into compact statistical & spectral feature vectors
 * suitable for lightweight machine learning classification and anomaly detection.
 */

import { CSIDataFrame, CSIFeatures } from '../types';

export class FeatureExtractor {
  private windowSize: number;
  private frameBuffer: CSIDataFrame[] = [];

  constructor(options: number | { windowSize?: number; samplingRateHz?: number } = 25) {
    if (typeof options === 'number') {
      this.windowSize = options;
    } else {
      this.windowSize = options.windowSize || 25;
    }
  }

  public setWindowSize(size: number) {
    this.windowSize = size;
  }

  public pushFrame(frame: CSIDataFrame): CSIFeatures {
    return this.addFrame(frame);
  }

  public addFrame(frame: CSIDataFrame): CSIFeatures {
    this.frameBuffer.push(frame);
    if (this.frameBuffer.length > this.windowSize) {
      this.frameBuffer.shift();
    }
    return this.extractFeatures();
  }

  public clearBuffer() {
    this.frameBuffer = [];
  }

  public getBufferLength(): number {
    return this.frameBuffer.length;
  }

  public extractFeatures(customBuffer?: CSIDataFrame[]): CSIFeatures {
    const buffer = customBuffer || this.frameBuffer;
    if (buffer.length === 0) {
      return {
        meanAmplitude: 25,
        amplitudeVariance: 0.05,
        amplitudeStdDev: 0.22,
        peakToPeak: 0.5,
        spectralEntropy: 0.3,
        dopplerEnergy: 0.2,
        subcarrierCorrelation: 0.9,
        highFreqEnergyRatio: 0.05,
        stationaryIndex: 0.95,
        accelerationSpike: 0.1,
      };
    }

    const amplitudes = buffer.map((f) => f.filteredMeanAmplitude);
    const n = amplitudes.length;

    // 1. Mean
    const sum = amplitudes.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    // 2. Variance & Std Dev
    const variance = amplitudes.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // 3. Peak-to-Peak
    let min = Infinity;
    let max = -Infinity;
    for (const val of amplitudes) {
      if (val < min) min = val;
      if (val > max) max = val;
    }
    const peakToPeak = max - min;

    // 4. Acceleration Spike & High-frequency energy (discrete 1st & 2nd derivatives)
    let maxDelta = 0;
    let highFreqEnergy = 0;
    let totalEnergy = 0;

    for (let i = 1; i < n; i++) {
      const diff = Math.abs(amplitudes[i] - amplitudes[i - 1]);
      if (diff > maxDelta) maxDelta = diff;
      highFreqEnergy += diff * diff;
      totalEnergy += amplitudes[i] * amplitudes[i];
    }
    const highFreqEnergyRatio = totalEnergy > 0 ? highFreqEnergy / totalEnergy : 0.02;

    // 5. Doppler energy (from frame metrics average)
    const avgDoppler = buffer.reduce((acc, f) => acc + f.dopplerEnergy, 0) / n;

    // 6. Subcarrier Correlation average
    const avgSubcarrierCorr = buffer.reduce((acc, f) => acc + f.subcarrierCorrelation, 0) / n;

    // 7. Stationary index (fraction of frames with low variance)
    const stillThreshold = 0.18;
    const stillCount = buffer.filter((f) => f.variance < stillThreshold).length;
    const stationaryIndex = stillCount / n;

    // 8. Spectral entropy approximation based on normalized variance distribution across subcarriers
    const lastFrame = buffer[buffer.length - 1];
    let entropy = 0.5;
    if (lastFrame && lastFrame.subcarriers.length > 0) {
      const subAmps = lastFrame.subcarriers.map((sc) => sc.amplitude);
      const subSum = subAmps.reduce((a, b) => a + b, 0);
      if (subSum > 0) {
        const probs = subAmps.map((a) => a / subSum);
        entropy = -probs.reduce((acc, p) => (p > 0 ? acc + p * Math.log2(p) : acc), 0) / Math.log2(subAmps.length);
      }
    }

    return {
      meanAmplitude: Number(mean.toFixed(2)),
      amplitudeVariance: Number(variance.toFixed(3)),
      amplitudeStdDev: Number(stdDev.toFixed(3)),
      peakToPeak: Number(peakToPeak.toFixed(2)),
      spectralEntropy: Number(Math.max(0.01, Math.min(0.99, entropy)).toFixed(3)),
      dopplerEnergy: Number(avgDoppler.toFixed(2)),
      subcarrierCorrelation: Number(avgSubcarrierCorr.toFixed(2)),
      highFreqEnergyRatio: Number(highFreqEnergyRatio.toFixed(3)),
      stationaryIndex: Number(stationaryIndex.toFixed(2)),
      accelerationSpike: Number(maxDelta.toFixed(2)),
    };
  }
}
