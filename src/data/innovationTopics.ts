import { ActivityType } from '../types';

export interface InnovationTopic {
  id: string;
  priority: 1 | 2 | 3;
  medal: '🥇' | '🥈' | '🥉';
  priorityLabel: 'Priority 1 (Hero Core)' | 'Priority 2 (Deep Intelligence)' | 'Priority 3 (Scale & Trust)';
  feature: string;
  why: string;
  category: 'Edge AI & Baselines' | 'Predictive Forecasting' | 'Autonomous Action' | 'Spatial Privacy';
  summary: string;
  csiMechanics: string;
  hackathonPitch: string;
  keyMetrics: { label: string; value: string }[];
  simulationConfig: {
    activity: ActivityType;
    peopleCount: number;
    simulatedRisk: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    simulatedConfidence: number;
    statusMessage: string;
    liveLog: string[];
  };
}

export const INNOVATION_TOPICS: InnovationTopic[] = [
  // PRIORITY 1 (HERO FEATURES)
  {
    id: 'risk_dna',
    priority: 1,
    medal: '🥇',
    priorityLabel: 'Priority 1 (Hero Core)',
    feature: 'Risk DNA',
    why: 'Personalized/environmental baseline',
    category: 'Edge AI & Baselines',
    summary:
      'Establishes an individual-specific RF signature capturing unique walking gait speed, body mass dispersion, and room multipath resonance. Eliminates arbitrary one-size-fits-all detection thresholds.',
    csiMechanics:
      'Builds a 30-subcarrier Gaussian covariance matrix calibrated to the specific human occupant. Deviations in cadence, step asymmetry, or torso drag are recognized immediately as biomechanical divergence.',
    hackathonPitch:
      'Judges love personalization. Rather than an arbitrary fall threshold, Risk DNA adapts to elderly residents who walk slowly or use walking canes, cutting false alarms by 94%.',
    keyMetrics: [
      { label: 'Gait Profile Accuracy', value: '98.6%' },
      { label: 'Baseline Calibration Time', value: '45 sec' },
      { label: 'False Alarm Reduction', value: '94%' },
    ],
    simulationConfig: {
      activity: 'walking',
      peopleCount: 1,
      simulatedRisk: 14,
      riskLevel: 'LOW',
      simulatedConfidence: 96.4,
      statusMessage: 'Risk DNA profile active. Occupant gait matches calibrated baseline signature.',
      liveLog: [
        'Calibrating 30 subcarrier Gaussian covariance matrix...',
        'Biomechanical torso reflection coefficient: 0.84 (Normal)',
        'Occupant gait cadence: 1.12 steps/sec (Consistent with baseline)',
        'Environmental multipath wall reflections subtracted from active signal.',
      ],
    },
  },
  {
    id: 'unknown_threat',
    priority: 1,
    medal: '🥇',
    priorityLabel: 'Priority 1 (Hero Core)',
    feature: 'Unknown Threat Detection',
    why: "Doesn't require every threat to be pre-trained",
    category: 'Edge AI & Baselines',
    summary:
      'Unsupervised Out-of-Distribution (OOD) autoencoder that flags dangerous physical anomalies even if the system has never seen that specific accident type during supervised training.',
    csiMechanics:
      'A variational autoencoder reconstructs expected CSI amplitude vectors. When reconstruction error across subcarriers spikes past 3.2σ with high entropy, an unknown threat anomaly is flagged.',
    hackathonPitch:
      'Standard ML fails when an accident does not match training data (e.g., fainting against a bookshelf or sudden seizure). Wi-Safe AI flags unknown hazardous states through pure statistical entropy.',
    keyMetrics: [
      { label: 'Zero-Day Threat F1', value: '0.94' },
      { label: 'OOD Reconstruction Error', value: '4.8σ' },
      { label: 'Model Footprint', value: '48 KB (Runs on ESP32)' },
    ],
    simulationConfig: {
      activity: 'fall',
      peopleCount: 1,
      simulatedRisk: 88,
      riskLevel: 'CRITICAL',
      simulatedConfidence: 93.1,
      statusMessage: 'Unknown Threat Detected: Unprecedented CSI phase distortion exceeding 4.2σ.',
      liveLog: [
        'Subcarrier reconstruction loss spiked: L2 norm = 0.84 (normal < 0.15)',
        'Out-of-Distribution autoencoder triggered non-standard motion state.',
        'High-velocity downward shift followed by prolonged zero-frequency stillness.',
        'Flagged as unclassified critical safety hazard. Automated escalation active.',
      ],
    },
  },
  {
    id: 'presense',
    priority: 1,
    medal: '🥇',
    priorityLabel: 'Priority 1 (Hero Core)',
    feature: 'PreSense',
    why: 'Predicts before incident',
    category: 'Predictive Forecasting',
    summary:
      'Anticipatory forecasting engine that detects micro-instabilities, sudden stumbling deceleration, and balance loss 2 to 4 seconds BEFORE physical impact occurs.',
    csiMechanics:
      'Maintains a 100-frame sliding temporal buffer measuring micro-Doppler frequency asymmetry and instantaneous center-of-mass trajectory tilt in the Fresnel reflection zone.',
    hackathonPitch:
      'Most systems only sound the alarm AFTER someone is already injured on the floor. PreSense delivers preemptive intervention, buying precious seconds for automated airbag inflation or rapid checks.',
    keyMetrics: [
      { label: 'Pre-Impact Warning Window', value: '2.4s to 3.8s' },
      { label: 'Stumble Detection Accuracy', value: '91.2%' },
      { label: 'Latency to Trigger', value: '42ms' },
    ],
    simulationConfig: {
      activity: 'fall',
      peopleCount: 1,
      simulatedRisk: 78,
      riskLevel: 'HIGH',
      simulatedConfidence: 91.5,
      statusMessage: 'PreSense Warning: Precursor stumble dynamics detected 2.8s prior to full impact.',
      liveLog: [
        'Sliding temporal buffer detected 38% sudden gait deceleration.',
        'Micro-Doppler asymmetry detected between subcarriers 8-16.',
        'Balance loss probability escalated to 86.4%.',
        'PreSense alert broadcasted to environmental actuators.',
      ],
    },
  },
  {
    id: 'causal_risk',
    priority: 1,
    medal: '🥇',
    priorityLabel: 'Priority 1 (Hero Core)',
    feature: 'Causal Risk Engine',
    why: 'Explains why risk is increasing',
    category: 'Edge AI & Baselines',
    summary:
      'Deconstructs risk into transparent causal components rather than an opaque black-box score. Shows exactly what proportion of danger comes from speed, stillness, or posture.',
    csiMechanics:
      'Computes real-time Shapley values across extracted physical dimensions: subcarrier variance (40%), stationary stillness duration (35%), Doppler shift (15%), and environmental noise (10%).',
    hackathonPitch:
      'Healthcare professionals and emergency responders refuse black-box AI. Wi-Safe AI provides full causal explainability so caregivers know exactly why the system raised an alert.',
    keyMetrics: [
      { label: 'Attribution Fidelity', value: '99.1%' },
      { label: 'Decomposed Factors', value: '5 Physical Vectors' },
      { label: 'Explainability Latency', value: '< 15ms' },
    ],
    simulationConfig: {
      activity: 'fall',
      peopleCount: 1,
      simulatedRisk: 84,
      riskLevel: 'CRITICAL',
      simulatedConfidence: 95.8,
      statusMessage: 'Causal Breakdown: 48% Post-impact stillness, 32% Transient Doppler shock, 20% Baseline shift.',
      liveLog: [
        'Computing real-time Shapley attribution on 30 OFDM subcarriers...',
        'Factor 1 (Post-Impact Inactivity): +42 pts (Primary driver)',
        'Factor 2 (Rapid High-Frequency Shock): +28 pts',
        'Factor 3 (Gait Asymmetry): +14 pts',
        'Causal explanation rendered to emergency dashboard.',
      ],
    },
  },
  {
    id: 'what_if_engine',
    priority: 1,
    medal: '🥇',
    priorityLabel: 'Priority 1 (Hero Core)',
    feature: 'What-If Engine',
    why: 'Simulates possible futures',
    category: 'Predictive Forecasting',
    summary:
      'Projects multiple future physical trajectories forward in time using physics-informed Markov simulations, evaluating whether an occupant is recovering, stabilizing, or deteriorating.',
    csiMechanics:
      'Samples 50 simulated Markov paths using Kalman-filtered velocity vectors across Fresnel reflection channels to estimate the probability distribution over the next 10 seconds.',
    hackathonPitch:
      'Demonstrates true predictive intelligence. The system does not just see what happened—it simulates what is about to happen next, preventing premature false dispatches.',
    keyMetrics: [
      { label: 'Simulated Trajectories', value: '50 paths / sec' },
      { label: 'Horizon Prediction', value: '10.0 seconds' },
      { label: 'Trajectory Convergence', value: '96.3%' },
    ],
    simulationConfig: {
      activity: 'sitting',
      peopleCount: 1,
      simulatedRisk: 34,
      riskLevel: 'MODERATE',
      simulatedConfidence: 89.7,
      statusMessage: 'What-If Projection: 78% probability of recovery to seated rest within 4 seconds.',
      liveLog: [
        'Branch 1: Self-recovery to seated position (78% probability).',
        'Branch 2: Slump to floor requiring assistance (18% probability).',
        'Branch 3: Transient artifact / pet interference (4% probability).',
        'Decision Engine: Holding automated 911 dispatch pending 4s stabilization.',
      ],
    },
  },
  {
    id: 'counter_risk_engine',
    priority: 1,
    medal: '🥇',
    priorityLabel: 'Priority 1 (Hero Core)',
    feature: 'Counter-Risk Engine',
    why: 'Finds preventive action',
    category: 'Autonomous Action',
    summary:
      'Prescribes autonomous corrective actions to de-escalate danger before tragedy strikes, integrating with smart-home protocols and ambient alert systems.',
    csiMechanics:
      'Maps classified hazard states into an automated rule-action graph: activating pathway illumination, triggering synthesized audio welfare inquiries, or contacting on-site staff.',
    hackathonPitch:
      'Transforms Wi-Safe AI from a passive monitor into an active protector. It does not just alert when harm occurs; it closes the loop by dispatching preventative mitigation.',
    keyMetrics: [
      { label: 'Preventive Actions Mapped', value: '12 Automations' },
      { label: 'Smart Home Latency', value: '< 80ms' },
      { label: 'Intervention Success Rate', value: '88.5%' },
    ],
    simulationConfig: {
      activity: 'walking',
      peopleCount: 1,
      simulatedRisk: 42,
      riskLevel: 'MODERATE',
      simulatedConfidence: 94.1,
      statusMessage: 'Counter-Risk Action: Ambient nightlight boosted to 80% to illuminate hallway path.',
      liveLog: [
        'Detected erratic late-night pacing in darkened hallway Fresnel zone.',
        'Counter-Risk Matrix matched Rule #04: Poor lighting hazard.',
        'Dispatched Matter/Zigbee command: Hallway luminaire set to 4000K warm white.',
        'Audio chime activated at low decibel to confirm occupant awareness.',
      ],
    },
  },

  // PRIORITY 2 (TACTICAL INTELLIGENCE)
  {
    id: 'ghost_trail',
    priority: 2,
    medal: '🥈',
    priorityLabel: 'Priority 2 (Deep Intelligence)',
    feature: 'GhostTrail',
    why: 'Invisible movement reconstruction',
    category: 'Spatial Privacy',
    summary:
      'Reconstructs real-time 2D/3D spatial motion paths and room transitions through walls without optical cameras or wearable tags.',
    csiMechanics:
      'Uses Angle-of-Arrival (AoA) phase differences across receiver antennas and Time-of-Flight (ToF) multipath delay spreads to calculate occupant centroid coordinates (x, y).',
    hackathonPitch:
      'Provides the spatial intelligence of full camera surveillance without capturing a single pixel of personal imagery. Perfect for private spaces like bedrooms and bathrooms.',
    keyMetrics: [
      { label: 'Spatial Resolution', value: '± 28 cm' },
      { label: 'Wall Penetration', value: 'Drywall, Glass, Wood' },
      { label: 'Update Rate', value: '50 Hz' },
    ],
    simulationConfig: {
      activity: 'walking',
      peopleCount: 1,
      simulatedRisk: 12,
      riskLevel: 'LOW',
      simulatedConfidence: 97.2,
      statusMessage: 'GhostTrail Tracking: Path coordinates (2.4m, 1.8m) -> (3.1m, 2.2m).',
      liveLog: [
        'Receiver Array phase differential: Delta-Phi = 1.42 rad.',
        'Multipath ToF centroid mapped to Zone A doorway.',
        'Spatial trail plotted across 16 historical coordinate waypoints.',
        'Zero camera images generated. Zero optical privacy compromises.',
      ],
    },
  },
  {
    id: 'risk_propagation',
    priority: 2,
    medal: '🥈',
    priorityLabel: 'Priority 2 (Deep Intelligence)',
    feature: 'Risk Propagation',
    why: 'Predicts how danger spreads',
    category: 'Predictive Forecasting',
    summary:
      'Models how hazards cascade between interconnected rooms—tracking risk transfer when an unstable occupant moves toward slippery tile, stairwells, or exits.',
    csiMechanics:
      'Represents the home as an interconnected Markov spatial graph. Nodes represent RF zones; transition matrices calculate probability of escalation when crossing thresholds.',
    hackathonPitch:
      'Falls do not happen in isolation. Understanding how an unsteady gait in the hallway increases fall probability in the bathroom enables proactive protection.',
    keyMetrics: [
      { label: 'Zone Prediction Horizon', value: '2 steps ahead' },
      { label: 'Graph Nodes Supported', value: 'Up to 32 RF Zones' },
      { label: 'Escalation Accuracy', value: '92.4%' },
    ],
    simulationConfig: {
      activity: 'walking',
      peopleCount: 1,
      simulatedRisk: 55,
      riskLevel: 'MODERATE',
      simulatedConfidence: 91.8,
      statusMessage: 'Risk Propagation: Occupant transitioning toward high-risk zone (Wet Tile / Bathroom).',
      liveLog: [
        'Spatial transition detected from Living Area to Bathroom threshold.',
        'Zone hazard coefficient increased from 0.2 to 0.7.',
        'Combined risk score weighted up to MODERATE (55/100).',
        'Pre-alert primed for bathroom receiver node.',
      ],
    },
  },
  {
    id: 'intervention_optimizer',
    priority: 2,
    medal: '🥈',
    priorityLabel: 'Priority 2 (Deep Intelligence)',
    feature: 'Intervention Optimizer',
    why: 'Chooses appropriate response',
    category: 'Autonomous Action',
    summary:
      'Balances urgency against false-alarm penalties using multi-tier escalation policies. Selects between gentle voice checks, caregiver SMS, and high-priority 911 dispatch.',
    csiMechanics:
      'Evaluates a cost-utility matrix weighing confidence, stillness duration, and occupant history to minimize caregiver burnout while ensuring zero missed real emergencies.',
    hackathonPitch:
      'False emergency calls overwhelm paramedics and irritate families. The Intervention Optimizer ensures the response precisely matches the severity of the RF event.',
    keyMetrics: [
      { label: 'Nuisance Alarm Drop', value: '91%' },
      { label: 'Escalation Stages', value: '3 Graduated Levels' },
      { label: 'Decision Latency', value: '< 200ms' },
    ],
    simulationConfig: {
      activity: 'fall',
      peopleCount: 1,
      simulatedRisk: 92,
      riskLevel: 'CRITICAL',
      simulatedConfidence: 97.4,
      statusMessage: 'Intervention Optimizer: Level 3 Emergency Dispatch authorized after 10s non-response.',
      liveLog: [
        'Stage 1 (0s): Gentle synthesized audio ping initiated.',
        'Stage 2 (5s): No movement detected. SMS dispatched to primary caregiver.',
        'Stage 3 (10s): Non-response verified. Dispatching simulated 911 telemetry payload.',
        'All stages logged in tamper-evident audit timeline.',
      ],
    },
  },
  {
    id: 'incident_replay',
    priority: 2,
    medal: '🥈',
    priorityLabel: 'Priority 2 (Deep Intelligence)',
    feature: 'Incident Replay',
    why: 'Learns from past events',
    category: 'Edge AI & Baselines',
    summary:
      'Provides high-fidelity RF waveform scrubbing and black-box playback of the seconds leading up to an incident, allowing clinicians to review mechanics without intrusive video.',
    csiMechanics:
      'Stores a circular ring buffer of raw 50Hz subcarrier vectors in flash memory. When triggered, locks 30 seconds of pre- and post-incident data for post-mortem analysis.',
    hackathonPitch:
      'Doctors always ask "how did the patient fall?" With Incident Replay, doctors can see the exact acceleration, rotational torque, and impact time without violating patient dignity.',
    keyMetrics: [
      { label: 'Buffer Resolution', value: '50 frames / sec' },
      { label: 'Pre-Event Window', value: '15 seconds' },
      { label: 'Data Encryption', value: 'AES-256 GCM' },
    ],
    simulationConfig: {
      activity: 'fall',
      peopleCount: 1,
      simulatedRisk: 86,
      riskLevel: 'CRITICAL',
      simulatedConfidence: 96.0,
      statusMessage: 'Incident Replay: 1,500 CSI frames archived for clinical review and post-fall audit.',
      liveLog: [
        'Circular FIFO buffer frozen at T+0 impact point.',
        'Preserved 750 frames pre-event and 750 frames post-event.',
        'Computed impact energy: 412 Joules equivalent RF displacement.',
        'Incident package encrypted and tagged with SHA-256 hash.',
      ],
    },
  },
  {
    id: 'trust_score',
    priority: 2,
    medal: '🥈',
    priorityLabel: 'Priority 2 (Deep Intelligence)',
    feature: 'Trust Score',
    why: 'Communicates uncertainty',
    category: 'Edge AI & Baselines',
    summary:
      'Quantifies systemic confidence by factoring in signal-to-noise ratio, RF channel fading, and environmental interference (e.g. microwave ovens, metal doors).',
    csiMechanics:
      'Computes Bayesian uncertainty over subcarrier variance. If SNR drops below 18dB or packet drops occur, the Trust Score drops, alerting caregivers to check coverage.',
    hackathonPitch:
      'Responsible AI knows what it does NOT know. Instead of blindly predicting with false confidence in noisy RF environments, Wi-Safe AI transparently communicates reliability.',
    keyMetrics: [
      { label: 'Uncertainty Estimation', value: 'Bayesian Monte Carlo' },
      { label: 'Min Reliable SNR', value: '18 dB' },
      { label: 'Transparency Index', value: '100% Real-Time' },
    ],
    simulationConfig: {
      activity: 'standing',
      peopleCount: 1,
      simulatedRisk: 18,
      riskLevel: 'LOW',
      simulatedConfidence: 94.6,
      statusMessage: 'Trust Score: 98.2% Channel Integrity (SNR 34dB, 0 packet loss, Clean 5GHz spectrum).',
      liveLog: [
        'Channel SNR evaluated across 30 subcarriers: 34.2 dB (Excellent).',
        'Fresnel clearance ratio: 92% (No metallic occlusion).',
        'System Trust Score established at 98.2 / 100.',
        'AI classification confidence bounds validated.',
      ],
    },
  },
  {
    id: 'privacy_bubble',
    priority: 2,
    medal: '🥈',
    priorityLabel: 'Priority 2 (Deep Intelligence)',
    feature: 'Privacy Bubble',
    why: 'No identity recognition',
    category: 'Spatial Privacy',
    summary:
      'Enforces zero identity leakage by design. The raw RF waves carry no facial pixels, clothing details, or identifiable biometric traits, ensuring total privacy compliance.',
    csiMechanics:
      'Channel State Information operates exclusively on multipath amplitude and phase modulation. Signals pass through irreversible feature extractors that discard physical identity.',
    hackathonPitch:
      'Cameras are strictly forbidden in bedrooms, nursing home bathrooms, and private quarters due to HIPAA and GDPR. Wi-Safe AI operates where optical cameras can never legally go.',
    keyMetrics: [
      { label: 'Image Pixels Stored', value: '0 (Strictly None)' },
      { label: 'Audio Recorded', value: '0 dB (No Mic)' },
      { label: 'HIPAA & GDPR Compliance', value: '100% Privacy by Design' },
    ],
    simulationConfig: {
      activity: 'sitting',
      peopleCount: 1,
      simulatedRisk: 8,
      riskLevel: 'LOW',
      simulatedConfidence: 98.1,
      statusMessage: 'Privacy Bubble Active: Zero pixels, zero microphones. Complete HIPAA & GDPR compliance.',
      liveLog: [
        'Verifying sensory inputs: No optical camera sensors detected or mounted.',
        'Verifying acoustic inputs: No microphone hardware present in signal chain.',
        'RF Channel State Information sanitized into non-invertible spatial variance.',
        'Full privacy guaranteed in private bedrooms and restrooms.',
      ],
    },
  },

  // PRIORITY 3 (FOUNDATION & SCALE)
  {
    id: 'silent_sos',
    priority: 3,
    medal: '🥉',
    priorityLabel: 'Priority 3 (Scale & Trust)',
    feature: 'Silent SOS',
    why: 'Practical emergency response',
    category: 'Autonomous Action',
    summary:
      'Enables occupants to summon emergency aid hands-free using intentional rhythmic RF perturbations (e.g. rhythmic floor taps or hand waving) without pushing buttons or speaking.',
    csiMechanics:
      'Recognizes deliberate 1.5Hz to 2.5Hz periodic Doppler signatures generated by intentional foot tapping or waving, distinguishing intentional gestures from ambient motion.',
    hackathonPitch:
      'When an elderly person or stroke victim falls, they often cannot reach a wall button, wear their pendant, or call out aloud. Silent SOS lets them signal for help with a simple tap.',
    keyMetrics: [
      { label: 'SOS Gesture Recognition', value: '96.2%' },
      { label: 'False Trigger Rejection', value: '99.7%' },
      { label: 'Response Time', value: '< 1.5 sec' },
    ],
    simulationConfig: {
      activity: 'standing',
      peopleCount: 1,
      simulatedRisk: 75,
      riskLevel: 'HIGH',
      simulatedConfidence: 95.2,
      statusMessage: 'Silent SOS Triggered: Intentional 2.0Hz rhythmic foot tap emergency signal decoded.',
      liveLog: [
        'Detected rhythmic 2.0Hz Doppler fluctuation on subcarriers 10-18.',
        'Pattern matched intentional distress gesture (Morse / tap sequence).',
        'Distress signal confirmed after 3 consecutive rhythmic cycles.',
        'Silent SOS escalation triggered: On-duty nurse alerted immediately.',
      ],
    },
  },
  {
    id: 'digital_twin',
    priority: 3,
    medal: '🥉',
    priorityLabel: 'Priority 3 (Scale & Trust)',
    feature: 'Digital Twin',
    why: 'Strong visualization',
    category: 'Spatial Privacy',
    summary:
      'Constructs a dynamic virtual 3D room replica mapping Fresnel diffraction zones, multipath ray-traced bounces, and spatial occupancy in real time.',
    csiMechanics:
      'Calculates RF Fresnel ellipsoids and ray-tracing bounces between Tx and Rx antennas, rendering dynamic 3D wave perturbations as occupants move through the zone.',
    hackathonPitch:
      'Provides judges and operators with intuitive, high-impact spatial clarity. Instead of reading raw telemetry tables, they see the exact wireless physics in a live virtual room.',
    keyMetrics: [
      { label: 'Ray-Tracing Reflections', value: '32 Paths Simulated' },
      { label: 'Fresnel Zones Rendered', value: 'Primary & Secondary' },
      { label: '3D Render Framerate', value: '60 FPS' },
    ],
    simulationConfig: {
      activity: 'walking',
      peopleCount: 1,
      simulatedRisk: 15,
      riskLevel: 'LOW',
      simulatedConfidence: 96.8,
      statusMessage: 'Digital Twin Synchronized: 3D Fresnel zone and multipath ray-trace active at 60 FPS.',
      liveLog: [
        'Fresnel first zone radius calculated: r1 = 0.42m at 5.18 GHz.',
        'Ray-tracing engine computed 32 primary wall and ceiling reflections.',
        'Occupant diffraction shadow rendered in real-time coordinate space.',
        'Virtual room twin synchronized with physical transmitter telemetry.',
      ],
    },
  },
  {
    id: 'zero_calibration',
    priority: 3,
    medal: '🥉',
    priorityLabel: 'Priority 3 (Scale & Trust)',
    feature: 'Zero-Calibration',
    why: 'Scalability',
    category: 'Edge AI & Baselines',
    summary:
      'Enables plug-and-play installation in any residential or commercial room in under 60 seconds with self-supervised ambient noise learning.',
    csiMechanics:
      'Self-supervised domain adaptation algorithms automatically observe background static multipath reflections and converge on ambient baselines without human calibration steps.',
    hackathonPitch:
      'Systems requiring hours of manual calibration or site surveys never scale commercially. Zero-Calibration means a user can plug Wi-Safe AI into any wall socket and it just works.',
    keyMetrics: [
      { label: 'Setup Time', value: '< 60 seconds' },
      { label: 'Manual Site Survey', value: '0 minutes needed' },
      { label: 'Commercial Deployability', value: 'Instant Plug-and-Play' },
    ],
    simulationConfig: {
      activity: 'no_movement',
      peopleCount: 0,
      simulatedRisk: 4,
      riskLevel: 'LOW',
      simulatedConfidence: 99.4,
      statusMessage: 'Zero-Calibration Complete: Room geometry adapted in 38s without manual configuration.',
      liveLog: [
        'Device booted on 5GHz Wi-Fi channel 36.',
        'Scanning static multipath reflections: 30 OFDM subcarriers mapped.',
        'Self-supervised noise floor converged in 38.2 seconds.',
        'Zero-calibration complete. Full safety monitoring active.',
      ],
    },
  },
];
