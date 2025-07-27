export interface Genes {
  speed: number;
  vision: number;
  randomness: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface OrganismData {
  id: string;
  x: number;
  y: number;
  energy: number;
  color: string;
  size: number;
  genes: Genes;
  lastDirection: number;
  age: number;
}

export interface PlantData {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
}

export interface TrailData {
  hue: number | null;
  intensity: number;
}

export interface SimulationStats {
  frameCount: number;
  organismCount: number;
  plantCount: number;
  avgEnergy: number;
  avgSpeed: number;
  avgVision: number;
  avgRandomness: number;
  maxAge: number;
}

export interface WorldConfig {
  width: number;
  height: number;
  initialOrganisms: number;
  initialPlants: number;
  plantSpawnRate: number;
  energyDecayRate: number;
  reproductionEnergyThreshold: number;
  reproductionCost: number;
  foodEnergyGain: number;
}

export type SimulationEvent = 
  | { type: 'ORGANISM_BORN'; organism: OrganismData }
  | { type: 'ORGANISM_DIED'; organism: OrganismData }
  | { type: 'ORGANISM_REPRODUCED'; parents: [OrganismData, OrganismData]; child: OrganismData }
  | { type: 'PLANT_EATEN'; plant: PlantData; organism: OrganismData }
  | { type: 'STATISTICS_UPDATED'; stats: SimulationStats };
