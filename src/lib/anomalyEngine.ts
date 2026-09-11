/**
 * Channel State Information Anomaly Engine
 * Learns quiet/routine baseline RF channel metrics and flags statistical deviations.
 */

import { AnomalyEvent, AnomalyLevel, BaselineProfile, CSIFeatures } from '../types';

export class AnomalyEngine {
  private baseline: BaselineProfile = {
    learnedAt: Date.now(),
    sampleCount: 100,
    meanAmplitude: 25.0,
    meanVariance: 0.12,
    meanDoppler: 0.8,
    isLearned: true,
  };

  private history: AnomalyEvent[] = [];
  private learningBuffer: CSIFeatures[] = [];
  private isLearning = false;

  public startLearningBaseline() {
    this.isLearning = true;
    this.learningBuffer = [];
  }

  public getIsLearning(): boolean {
    return this.isLearning;
  }

  public getLearningProgress(): number {
    return Math.min(100, (this.learningBuffer.length / 40) * 100);
  }

  public getBaseline(): BaselineProfile {
    return { ...this.baseline };
  }

  public processFeatures(features: CSIFeatures): {
    level: AnomalyLevel;
    distance: number;
    explanation: string;
    event?: AnomalyEvent;
  } {
    if (this.isLearning) {
      this.learningBuffer.push(features);
      if (this.learningBuffer.length >= 40) {
        // Finalize learned baseline
        const n = this.learningBuffer.length;
        const avgAmp = this.learningBuffer.reduce((a, b) => a + b.meanAmplitude, 0) / n;
        const avgVar = this.learningBuffer.reduce((a, b) => a + b.amplitudeVariance, 0) / n;
        const avgDoppler = this.learningBuffer.reduce((a, b) => a + b.dopplerEnergy, 0) / n;

        this.baseline = {
          learnedAt: Date.now(),
          sampleCount: n,
          meanAmplitude: Number(avgAmp.toFixed(2)),
          meanVariance: Number(avgVar.toFixed(3)),
          meanDoppler: Number(avgDoppler.toFixed(2)),
          isLearned: true,
        };
        this.isLearning = false;
        this.learningBuffer = [];
      }
      return {
        level: 'normal',
        distance: 0,
        explanation: 'Learning baseline RF profile...',
      };
    }

    // Compute normalized distance
    const ampDiff = Math.abs(features.meanAmplitude - this.baseline.meanAmplitude) / 4.0;
    const varDiff = Math.abs(features.amplitudeVariance - this.baseline.meanVariance) / 0.35;
    const dopplerDiff = Math.abs(features.dopplerEnergy - this.baseline.meanDoppler) / 2.5;
    const accelDiff = features.accelerationSpike / 2.0;

    const distance = Number(
      Math.sqrt(ampDiff * ampDiff + varDiff * varDiff + dopplerDiff * dopplerDiff + accelDiff * accelDiff).toFixed(2)
    );

    let level: AnomalyLevel = 'normal';
    let explanation = 'Signal within normal parameters.';

    if (distance > 3.2 || features.accelerationSpike > 4.5) {
      level = 'critical_anomaly';
      explanation = `Extreme channel disturbance: distance ${distance}x baseline with acceleration spike ${features.accelerationSpike}.`;
    } else if (distance > 1.6 || features.spectralEntropy > 0.8) {
      level = 'unusual';
      explanation = `Unusual RF multipath variation: distance ${distance}x baseline.`;
    }

    let event: AnomalyEvent | undefined;
    if (level !== 'normal') {
      event = {
        id: `anomaly-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: Date.now(),
        level,
        distanceFromBaseline: distance,
        metric: `ΔAmp: ${ampDiff.toFixed(1)}, ΔVar: ${varDiff.toFixed(1)}, ΔDoppler: ${dopplerDiff.toFixed(1)}`,
        explanation,
      };
      this.history.unshift(event);
      if (this.history.length > 50) this.history.pop();
    }

    return { level, distance, explanation, event };
  }

  public getHistory(): AnomalyEvent[] {
    return [...this.history];
  }

  public clearHistory() {
    this.history = [];
  }
}
