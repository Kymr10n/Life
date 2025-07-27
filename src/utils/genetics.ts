import { Genes } from '../types/index.js';

/**
 * Mutate and average genes from two parents
 */
export function avgMutate(a: number, b: number): number {
  const avg = (a + b) / 2;
  return avg * (1 + (Math.random() * 0.2 - 0.1));
}

/**
 * Create child genes from two parents
 */
export function crossoverGenes(parent1: Genes, parent2: Genes): Genes {
  return {
    speed: Math.max(0.5, avgMutate(parent1.speed, parent2.speed)),
    vision: Math.max(10, avgMutate(parent1.vision, parent2.vision)),
    randomness: Math.max(0.05, avgMutate(parent1.randomness, parent2.randomness))
  };
}

/**
 * Mutate genes slightly
 */
export function mutateGenes(genes: Genes, mutationRate: number = 0.1): Genes {
  return {
    speed: Math.max(0.5, genes.speed * (1 + (Math.random() - 0.5) * mutationRate)),
    vision: Math.max(10, genes.vision * (1 + (Math.random() - 0.5) * mutationRate)),
    randomness: Math.max(0.05, genes.randomness + (Math.random() - 0.5) * mutationRate)
  };
}

/**
 * Generate random genes for initial population
 */
export function generateRandomGenes(): Genes {
  return {
    speed: 1.0 + Math.random() * 1.5,
    vision: 20 + Math.random() * 40,
    randomness: 0.3 + Math.random() * 0.7
  };
}

/**
 * Check if two colors are compatible (similar hue)
 */
export function isColorCompatible(color1: string, color2: string): boolean {
  const hue1 = parseFloat(color1.match(/hsl\((\d+)/)?.[1] || '0');
  const hue2 = parseFloat(color2.match(/hsl\((\d+)/)?.[1] || '0');
  const hueDiff = Math.abs(hue1 - hue2);
  return hueDiff < 30 || hueDiff > 330;
}

/**
 * Mix two colors to create offspring color
 */
export function mixColors(color1: string, color2: string): string {
  const hue1 = parseFloat(color1.match(/hsl\((\d+)/)?.[1] || '0');
  const hue2 = parseFloat(color2.match(/hsl\((\d+)/)?.[1] || '0');
  const midHue = (hue1 + hue2) / 2 % 360;
  return `hsl(${midHue}, 70%, 50%)`;
}

/**
 * Mutate a color slightly
 */
export function mutateColor(color: string): string {
  const hue = parseFloat(color.match(/hsl\((\d+)/)?.[1] || '0');
  const newHue = (hue + (Math.random() * 40 - 20) + 360) % 360;
  return `hsl(${newHue}, 70%, 50%)`;
}
