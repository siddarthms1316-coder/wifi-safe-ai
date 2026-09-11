/**
 * Dedicated Multi-Stage Fall Detection Logic
 * Differentiates violent human collapse from normal sudden gestures
 * by enforcing post-disturbance inactivity verification and recovery checks.
 */

import { ActivityType, CSIFeatures, FallDetectionStage, FallDetectionState, RiskScore } from '../types';

export class FallDetector {
  private stage: FallDetectionStage = 'normal';
  private disturbanceTime = 0;
  private disturbanceMagnitude = 0;
  private inactivityThresholdMs = 3200; // time required to confirm immobility
  private fallSensitivity = 7; // 1 to 10
  private lastAlertTriggeredTime = 0;
  private onFallConfirmed?: (confidence: number, explanation: string) => void;

  constructor(onFallConfirmed?: (confidence: number, explanation: string) => void) {
    this.onFallConfirmed = onFallConfirmed;
  }

  public setSensitivity(sensitivity: number) {
    this.fallSensitivity = Math.max(1, Math.min(10, sensitivity));
    // Higher sensitivity = slightly lower disturbance threshold & shorter inactivity wait
    this.inactivityThresholdMs = Math.max(2200, 4200 - this.fallSensitivity * 200);
  }

  public reset() {
    this.stage = 'normal';
    this.disturbanceTime = 0;
    this.disturbanceMagnitude = 0;
  }

  public processFrame(
    features: CSIFeatures,
    currentActivity: ActivityType,
    now: number
  ): FallDetectionState {
    const spikeThreshold = Math.max(2.4, 6.0 - this.fallSensitivity * 0.4);
    const isSpike = features.accelerationSpike >= spikeThreshold || currentActivity === 'fall';

    // State machine transitions
    switch (this.stage) {
      case 'normal':
      case 'cleared_false_alarm':
        if (isSpike) {
          this.stage = 'disturbance_detected';
          this.disturbanceTime = now;
          this.disturbanceMagnitude = features.accelerationSpike;
        }
        break;

      case 'disturbance_detected':
        // Move into monitoring subsequent inactivity
        this.stage = 'monitoring_inactivity';
        break;

      case 'monitoring_inactivity': {
        const elapsed = now - this.disturbanceTime;

        // Check if movement resumed immediately (e.g. standing, walking, quick sit -> false alarm)
        if (features.dopplerEnergy > 4.5 && features.stationaryIndex < 0.35 && elapsed < 2000) {
          this.stage = 'cleared_false_alarm';
          break;
        }

        // If inactivity period reached and subject remains still
        if (elapsed >= this.inactivityThresholdMs) {
          this.stage = 'evaluating_recovery';
        }
        break;
      }

      case 'evaluating_recovery': {
        // If subject is still motionless (high stationary index, low variance)
        if (features.stationaryIndex >= 0.65 || currentActivity === 'fall') {
          this.stage = 'confirmed_fall';
          const conf = Math.min(96, Math.max(88, 75 + this.disturbanceMagnitude * 3));
          const exp =
            'Fall alert triggered because a high-intensity CSI disturbance was followed by an extended low-movement period.';
          if (now - this.lastAlertTriggeredTime > 8000 && this.onFallConfirmed) {
            this.lastAlertTriggeredTime = now;
            this.onFallConfirmed(conf, exp);
          }
        } else {
          this.stage = 'cleared_false_alarm';
        }
        break;
      }

      case 'confirmed_fall':
        // If subject gets back up or user resets
        if (features.dopplerEnergy > 5.5 && features.stationaryIndex < 0.3) {
          this.stage = 'cleared_false_alarm';
        }
        break;
    }

    const elapsed = this.disturbanceTime > 0 ? now - this.disturbanceTime : 0;
    const progress =
      this.stage === 'monitoring_inactivity'
        ? Math.min(100, (elapsed / this.inactivityThresholdMs) * 100)
        : this.stage === 'confirmed_fall'
        ? 100
        : 0;

    let confidence = 20;
    let explanation = 'Baseline RF signal stable. No abnormal acceleration or impact detected.';

    if (this.stage === 'disturbance_detected') {
      confidence = 45;
      explanation = `Transient CSI amplitude excursion (${this.disturbanceMagnitude.toFixed(1)}x) detected. Evaluating follow-up movement.`;
    } else if (this.stage === 'monitoring_inactivity') {
      confidence = 68;
      explanation = `Potential fall event under observation: monitoring for ${Math.round(
        (this.inactivityThresholdMs - elapsed) / 1000
      )}s of sustained post-event stillness.`;
    } else if (this.stage === 'confirmed_fall') {
      confidence = 94;
      explanation =
        'Confirmed simulated fall: High-intensity CSI disturbance was followed by prolonged lack of mobility.';
    } else if (this.stage === 'cleared_false_alarm') {
      confidence = 15;
      explanation = 'Normal sudden movement: Post-disturbance motion resumed. Event cleared without alert.';
    }

    return {
      stage: this.stage,
      stageProgress: Number(progress.toFixed(0)),
      inactivityTimer: elapsed,
      inactivityThreshold: this.inactivityThresholdMs,
      disturbanceMagnitude: Number(this.disturbanceMagnitude.toFixed(2)),
      confidence,
      explanation,
      lastUpdated: now,
    };
  }

  /**
   * Calculates transparent risk score (0 - 100) with explainable factor breakdown
   */
  public calculateRiskScore(
    fallState: FallDetectionState,
    features: CSIFeatures,
    activity: ActivityType,
    anomalyDistance: number
  ): RiskScore {
    const factors: RiskScore['factors'] = [];
    let score = 5; // base baseline

    // Factor 1: Sudden disturbance
    if (fallState.stage === 'confirmed_fall') {
      const pts = 35;
      score += pts;
      factors.push({
        name: 'Sudden Disturbance',
        points: pts,
        description: 'Violent multi-subcarrier amplitude surge (+35)',
      });
    } else if (fallState.stage === 'monitoring_inactivity') {
      const pts = 22;
      score += pts;
      factors.push({
        name: 'Potential Disturbance',
        points: pts,
        description: 'Unusual acceleration transient observed (+22)',
      });
    } else if (features.accelerationSpike > 3.0) {
      const pts = 12;
      score += pts;
      factors.push({
        name: 'Acceleration Spike',
        points: pts,
        description: 'Elevated transient motion rate (+12)',
      });
    }

    // Factor 2: Post-event inactivity
    if (fallState.stage === 'confirmed_fall') {
      const pts = 30;
      score += pts;
      factors.push({
        name: 'Post-Event Inactivity',
        points: pts,
        description: 'Subsequent immobility exceeds safety window (+30)',
      });
    } else if (fallState.stage === 'monitoring_inactivity') {
      const pts = 18;
      score += pts;
      factors.push({
        name: 'Developing Inactivity',
        points: pts,
        description: 'Subject motionless post-transient (+18)',
      });
    }

    // Factor 3: Anomaly score
    if (anomalyDistance > 2.5) {
      const pts = 15;
      score += pts;
      factors.push({
        name: 'RF Anomaly Score',
        points: pts,
        description: `Channel response deviates significantly from baseline (+${pts})`,
      });
    } else if (anomalyDistance > 1.2) {
      const pts = 8;
      score += pts;
      factors.push({
        name: 'Mild RF Deviation',
        points: pts,
        description: `Subtle divergence from learned room baseline (+${pts})`,
      });
    }

    // Factor 4: Classifier confidence
    if (activity === 'fall') {
      const pts = 7;
      score += pts;
      factors.push({
        name: 'Classifier Confidence',
        points: pts,
        description: 'AI model predicts fall signature (+7)',
      });
    } else if (activity === 'lying_down' && fallState.inactivityTimer > 10000) {
      const pts = 6;
      score += pts;
      factors.push({
        name: 'Prolonged Floor Profile',
        points: pts,
        description: 'Low RF cross-section stationary profile (+6)',
      });
    }

    score = Math.max(0, Math.min(100, score));

    let level: RiskScore['level'] = 'LOW';
    if (score >= 81) level = 'CRITICAL';
    else if (score >= 61) level = 'HIGH';
    else if (score >= 31) level = 'MODERATE';

    return {
      score,
      level,
      factors,
      timestamp: Date.now(),
    };
  }
}
