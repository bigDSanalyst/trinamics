/**
 * Parameters of the piezo wake-up model (paper Section 3.1) and the
 * breathing parameter of the electronic model (Section 3.2).
 */
export interface MaterialsParams {
  phiP: number; // BaTiO3 volume fraction phi_p (0.20)
  epsM: number; // matrix permittivity eps_m (3.2)
  epsBT: number; // BaTiO3 permittivity eps_BT (1700)
  d33Eff: number; // empirical d33,eff in C/N (2.0 pC/N)
  forceZ: number; // load F_z in N (1.5 N)
  nodeArea: number; // A_node in m^2 (3.46 mm^2, one a_1 unit cell)
  nodeThickness: number; // h_node in m (4 um)
  thresholdMv: number; // comparator threshold V_th in mV (50 mV)
  breathingDelta: number; // delta_b (+0.18)
}

// Values used in the paper (Sections 3.1 and 3.2).
export const PAPER_DEFAULTS: MaterialsParams = {
  phiP: 0.2,
  epsM: 3.2,
  epsBT: 1700,
  d33Eff: 2.0e-12,
  forceZ: 1.5,
  nodeArea: 3.46e-6,
  nodeThickness: 4.0e-6,
  thresholdMv: 50,
  breathingDelta: 0.18,
};

export interface PhysicsDerived {
  beta: number; // (eps_BT - eps_m) / (eps_BT + 2 eps_m)
  epsEff: number; // Maxwell-Garnett effective permittivity
  g33: number; // g33,eff in mV*m/N
  stressPa: number; // F_z / A_node
  wakeVoltageMv: number; // open-circuit wake voltage in mV
  thresholdRatio: number; // V_wake / V_th
}
