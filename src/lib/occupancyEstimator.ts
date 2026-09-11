/**
 * Experimental CSI-Based Occupancy Estimator
 * Estimates room occupant count by analyzing subcarrier cross-correlation,
 * Doppler spectral dispersion, and multi-path entropy.
 */

import { ActivityType, CSIDataFrame, CSIFeatures, OccupancyEstimate } from '../types';

export class OccupancyEstimator {
  private currentActivity: ActivityType = 'standing';
  private currentPeopleCount: number = 1;

  public setSimulatedState(activity: ActivityType, peopleCount: number) {
    this.currentActivity = activity;
    this.currentPeopleCount = peopleCount;
  }

  public estimateOccupancy(
    frame: CSIDataFrame,
    features: CSIFeatures
  ): OccupancyEstimate {
    const { stationaryIndex, amplitudeVariance, subcarrierCorrelation, spectralEntropy } = features;

    let estimatedPeople = 1;
    let confidence = 88;
    let statusText = 'Single occupant detected';

    if (stationaryIndex > 0.95 && amplitudeVariance < 0.04) {
      estimatedPeople = 0;
      confidence = 94;
      statusText = 'Room unoccupied (Static RF channel)';
    } else if (subcarrierCorrelation < 0.52 && spectralEntropy > 0.75) {
      if (spectralEntropy > 0.86 || amplitudeVariance > 0.9) {
        estimatedPeople = Math.max(3, this.currentPeopleCount >= 3 ? this.currentPeopleCount : 3);
        confidence = 84;
        statusText = 'Crowd signature: 3+ occupants active';
      } else {
        estimatedPeople = 2;
        confidence = 89;
        statusText = 'Dual occupant signature: asynchronous multipath';
      }
    } else if (this.currentActivity === 'multiple_people') {
      estimatedPeople = Math.max(2, this.currentPeopleCount);
      confidence = 91;
      statusText = `${estimatedPeople} occupants active`;
    } else {
      estimatedPeople = 1;
      confidence = 92;
      statusText = '1 occupant active in Fresnel zone';
    }

    const crowdLevel =
      estimatedPeople === 0
        ? 'unoccupied'
        : estimatedPeople === 1
        ? 'single'
        : estimatedPeople === 2
        ? 'dual'
        : 'crowded';

    return {
      estimatedPeople,
      count: estimatedPeople,
      confidence,
      entropy: spectralEntropy,
      varianceProfile: amplitudeVariance > 0.6 ? 'High Dynamic' : 'Stable',
      crowdLevel,
      statusText,
      varianceSum: amplitudeVariance,
    };
  }
}

export function estimateOccupancy(
  features: CSIFeatures,
  simulatedActivity: ActivityType = 'standing',
  simulatedPeopleCount: number = 1
): OccupancyEstimate {
  const estimator = new OccupancyEstimator();
  estimator.setSimulatedState(simulatedActivity, simulatedPeopleCount);
  const mockFrame: any = { variance: features.amplitudeVariance };
  return estimator.estimateOccupancy(mockFrame, features);
}
