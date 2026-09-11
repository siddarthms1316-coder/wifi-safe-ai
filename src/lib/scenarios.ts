/**
 * Prebuilt Simulation Scenarios & Hackathon Demo Sequencer
 */

import { SimulationScenario } from '../types';

export const PREBUILT_SCENARIOS: SimulationScenario[] = [
  {
    id: 'normal_day',
    name: 'Normal Day Routine',
    description: 'Typical domestic movement: Standing up, walking to kitchen, sitting down, then walking back.',
    totalDurationSeconds: 40,
    steps: [
      {
        durationSeconds: 8,
        activity: 'standing',
        peopleCount: 1,
        title: 'Morning Standing',
        description: 'Subject standing stationary; subtle respiration micro-Doppler.',
      },
      {
        durationSeconds: 12,
        activity: 'walking',
        peopleCount: 1,
        title: 'Walking Across Room',
        description: 'Periodic Doppler oscillation across 30 subcarriers (1.4 Hz cadence).',
      },
      {
        durationSeconds: 12,
        activity: 'sitting',
        peopleCount: 1,
        title: 'Sitting Down',
        description: 'Smooth downward amplitude shift settling into stable stationary state.',
      },
      {
        durationSeconds: 8,
        activity: 'walking',
        peopleCount: 1,
        title: 'Walking to Door',
        description: 'Resumed locomotion with high confidence walking classification.',
      },
    ],
  },
  {
    id: 'fall_event',
    name: 'Emergency Fall Event',
    description: 'Walking locomotion leading to a catastrophic sudden stumble, ground impact, and prolonged immobility.',
    totalDurationSeconds: 45,
    steps: [
      {
        durationSeconds: 10,
        activity: 'walking',
        peopleCount: 1,
        title: 'Normal Walking',
        description: 'Steady walking pace across the sensing zone.',
      },
      {
        durationSeconds: 4,
        activity: 'sudden_movement',
        peopleCount: 1,
        title: 'Loss of Balance',
        description: 'Sharp acceleration spike as footing slips.',
      },
      {
        durationSeconds: 6,
        activity: 'fall',
        peopleCount: 1,
        title: 'Ground Impact (Simulated Fall)',
        description: 'Violent multi-subcarrier amplitude surge (>6x baseline).',
      },
      {
        durationSeconds: 15,
        activity: 'lying_down',
        peopleCount: 1,
        title: 'Post-Fall Immobility',
        description: 'Zero motion detected. Inactivity monitoring verifies lack of recovery.',
      },
      {
        durationSeconds: 10,
        activity: 'lying_down',
        peopleCount: 1,
        title: 'Confirmed Emergency Alert',
        description: 'Fall confidence exceeds 92%. Critical risk score triggered.',
      },
    ],
  },
  {
    id: 'multiple_people',
    name: 'Multiple Occupants & Meeting',
    description: 'Dynamic multi-person arrival causing asynchronous subcarrier decorrelation and crowd estimation.',
    totalDurationSeconds: 40,
    steps: [
      {
        durationSeconds: 8,
        activity: 'standing',
        peopleCount: 1,
        title: 'Single Occupant Inside',
        description: 'Single baseline occupant detected with 92% confidence.',
      },
      {
        durationSeconds: 10,
        activity: 'multiple_people',
        peopleCount: 2,
        title: 'Second Person Enters',
        description: 'Dual human reflections create asynchronous multipath interference.',
      },
      {
        durationSeconds: 12,
        activity: 'multiple_people',
        peopleCount: 3,
        title: 'Third Person Joins',
        description: 'Subcarrier cross-correlation drops below 0.45; Occupancy estimates 3+ people.',
      },
      {
        durationSeconds: 10,
        activity: 'walking',
        peopleCount: 1,
        title: 'Room Clears to 1 Person',
        description: 'Subcarrier coherence restores as occupants depart.',
      },
    ],
  },
  {
    id: 'false_alarm',
    name: 'False Alarm Recovery',
    description: 'Vigorous sudden gesture (dropping keys / quick sit) quickly distinguished from a fall by resumed motion.',
    totalDurationSeconds: 35,
    steps: [
      {
        durationSeconds: 8,
        activity: 'walking',
        peopleCount: 1,
        title: 'Approaching Desk',
        description: 'Normal walking profile.',
      },
      {
        durationSeconds: 4,
        activity: 'sudden_movement',
        peopleCount: 1,
        title: 'Dropping Keys & Reaching',
        description: 'Transient CSI disturbance detected. System enters Potential Fall mode.',
      },
      {
        durationSeconds: 4,
        activity: 'standing',
        peopleCount: 1,
        title: 'Quick Stand Up',
        description: 'Immediate motion recovery observed before inactivity timer expires.',
      },
      {
        durationSeconds: 10,
        activity: 'walking',
        peopleCount: 1,
        title: 'False Alarm Cleared',
        description: 'System automatically disarms alert: normal activity resumes safely.',
      },
      {
        durationSeconds: 9,
        activity: 'sitting',
        peopleCount: 1,
        title: 'Normal Seated Task',
        description: 'Stable seated baseline with zero safety risk.',
      },
    ],
  },
  {
    id: 'long_inactivity',
    name: 'Prolonged Immobility Check',
    description: 'Prolonged quiet period without human motion leading to wellness verification recommendation.',
    totalDurationSeconds: 40,
    steps: [
      {
        durationSeconds: 10,
        activity: 'walking',
        peopleCount: 1,
        title: 'Active Living Room Movement',
        description: 'Locomotion confirmed.',
      },
      {
        durationSeconds: 10,
        activity: 'sitting',
        peopleCount: 1,
        title: 'Seated Stillness',
        description: 'Subject sits down; signal variance drops below 0.08.',
      },
      {
        durationSeconds: 12,
        activity: 'lying_down',
        peopleCount: 1,
        title: 'Extended Motionlessness',
        description: 'Zero Doppler shift detected for extended observation window.',
      },
      {
        durationSeconds: 8,
        activity: 'lying_down',
        peopleCount: 1,
        title: 'Wellness Alert Check',
        description: 'Moderate risk flag raised for welfare check without fall impact.',
      },
    ],
  },
];

/**
 * 75-second comprehensive scripted Hackathon Demo sequence
 */
export const HACKATHON_MASTER_DEMO: SimulationScenario = {
  id: 'hackathon_master_demo',
  name: 'Official Hackathon Demonstration',
  description: 'Full end-to-end showcase: RF calibration → Entry → Walking → Sitting → Fall Event → XAI Explanation → Emergency Simulation → Event Logging.',
  totalDurationSeconds: 70,
  steps: [
    {
      durationSeconds: 6,
      activity: 'no_movement',
      peopleCount: 0,
      title: 'Step 1: Calibration & Empty Room',
      description: 'System establishes baseline RF channel. 0 occupants detected, 95% stationary index.',
    },
    {
      durationSeconds: 8,
      activity: 'standing',
      peopleCount: 1,
      title: 'Step 2: Occupant Enters Fresnel Zone',
      description: 'Single human reflection detected. Micro-Doppler respiration detected at 0.25 Hz.',
    },
    {
      durationSeconds: 12,
      activity: 'walking',
      peopleCount: 1,
      title: 'Step 3: Human Activity Recognition (Walking)',
      description: 'Periodic Doppler oscillation across 30 subcarriers. AI classifies Walking (94.2% confidence).',
    },
    {
      durationSeconds: 8,
      activity: 'sitting',
      peopleCount: 1,
      title: 'Step 4: Transition to Seated Position',
      description: 'Vertical downward amplitude attenuation followed by stable channel variance.',
    },
    {
      durationSeconds: 4,
      activity: 'sudden_movement',
      peopleCount: 1,
      title: 'Step 5: Sudden Stumble / Slipping',
      description: 'High acceleration spike. Multi-stage fall detector enters "Disturbance Detected" state.',
    },
    {
      durationSeconds: 7,
      activity: 'fall',
      peopleCount: 1,
      title: 'Step 6: Impact & Collapse (Potential Fall)',
      description: 'Violent multi-subcarrier amplitude spike. Confidence rises to 68%.',
    },
    {
      durationSeconds: 15,
      activity: 'fall',
      peopleCount: 1,
      title: 'Step 7: Post-Event Inactivity & Confirmed Fall',
      description: 'Inactivity timer completes without recovery. Fall confidence hits 94% — Emergency Alert triggers!',
    },
    {
      durationSeconds: 10,
      activity: 'lying_down',
      peopleCount: 1,
      title: 'Step 8: Safety Analytics & Audit Log Updated',
      description: 'Event registered with full XAI factor attribution. Room A status set to Awaiting Response.',
    },
  ],
};
