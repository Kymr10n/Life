import { OrganismData, Genes, TrailData } from '../types/index.js';
import { Plant } from './Plant.js';
import { 
  generateId, 
  distance, 
  clamp, 
  normalizeAngle, 
  random 
} from '../utils/math.js';
import { 
  crossoverGenes, 
  isColorCompatible, 
  mixColors, 
  generateRandomGenes 
} from '../utils/genetics.js';

export class Organism implements OrganismData {
  public readonly id: string;
  public x: number;
  public y: number;
  public energy: number;
  public color: string;
  public size: number;
  public genes: Genes;
  public lastDirection: number;
  public age: number;

  // Movement state
  private stuckCounter: number = 0;
  private lastX: number;
  private lastY: number;
  private directionChangeTimer: number = 0;

  constructor(
    x: number, 
    y: number, 
    energy: number = 50, 
    color?: string, 
    genes?: Genes
  ) {
    this.id = generateId();
    this.x = x;
    this.y = y;
    this.energy = energy;
    this.color = color || `hsl(${Math.random() * 360}, 70%, 50%)`;
    this.size = 5;
    this.lastDirection = Math.random() * 2 * Math.PI;
    this.lastX = x;
    this.lastY = y;
    this.age = 0;

    this.genes = genes || generateRandomGenes();
    
    // Safety check: ensure genes are never zero or negative
    this.genes.speed = Math.max(0.5, this.genes.speed);
    this.genes.vision = Math.max(10, this.genes.vision);
    this.genes.randomness = Math.max(0.1, this.genes.randomness);
  }

  /**
   * Move the organism based on environmental factors
   */
  move(
    plants: Plant[], 
    trailGrid: TrailData[][], 
    organisms: Organism[], 
    worldWidth: number, 
    worldHeight: number
  ): void {
    // Update age and movement tracking
    this.age++;
    
    // Check if organism is stuck
    const distMoved = distance(this.x, this.y, this.lastX, this.lastY);
    if (distMoved < 0.5) {
      this.stuckCounter++;
    } else {
      this.stuckCounter = 0;
    }
    this.lastX = this.x;
    this.lastY = this.y;
    this.directionChangeTimer++;

    let angle: number;
    const targetPlant = this.findClosestPlant(plants);
    const isHungry = this.energy < 50;
    const isCrowded = this.isCrowded(organisms);
    
    // Near-edge detection for better dispersal
    const nearLeftEdge = this.x < 80;
    const nearRightEdge = this.x > worldWidth - 80;
    const nearTopEdge = this.y < 80;
    const nearBottomEdge = this.y > worldHeight - 80;
    const nearAnyEdge = nearLeftEdge || nearRightEdge || nearTopEdge || nearBottomEdge;

    // Decide movement direction based on priorities
    angle = this.decideDirection(
      targetPlant, 
      isHungry, 
      isCrowded, 
      nearAnyEdge, 
      nearLeftEdge, 
      nearRightEdge, 
      nearTopEdge, 
      nearBottomEdge,
      organisms
    );

    // Calculate movement
    const speedMultiplier = isHungry ? 1.3 : 1.0;
    let dx = Math.cos(angle) * this.genes.speed * speedMultiplier;
    let dy = Math.sin(angle) * this.genes.speed * speedMultiplier;
    
    // Safety check: ensure movement is not zero
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
      const randomAngle = Math.random() * 2 * Math.PI;
      dx = Math.cos(randomAngle) * this.genes.speed * speedMultiplier;
      dy = Math.sin(randomAngle) * this.genes.speed * speedMultiplier;
      this.lastDirection = randomAngle;
    }
    
    // Apply movement with boundary handling
    this.applyMovement(dx, dy, worldWidth, worldHeight);
    
    // Energy consumption
    this.energy -= 0.1;
    
    // Failsafe for stuck organisms
    if (this.stuckCounter > 100) {
      this.lastDirection = Math.random() * 2 * Math.PI;
      this.stuckCounter = 0;
    }

    // Leave trail when not hungry
    if (!isHungry) {
      this.leaveTrail(trailGrid);
    }
  }

  private decideDirection(
    targetPlant: Plant | null,
    isHungry: boolean,
    isCrowded: boolean,
    nearAnyEdge: boolean,
    nearLeftEdge: boolean,
    nearRightEdge: boolean,
    nearTopEdge: boolean,
    nearBottomEdge: boolean,
    organisms: Organism[]
  ): number {
    // Periodic direction change to prevent long-term convergence
    if (this.directionChangeTimer > 120 && !targetPlant) {
      this.directionChangeTimer = 0;
      this.lastDirection = Math.random() * 2 * Math.PI;
      return this.lastDirection;
    }

    // Stuck recovery
    if (this.stuckCounter > 30) {
      this.stuckCounter = 0;
      return this.getEdgeEscapeAngle(nearLeftEdge, nearRightEdge, nearTopEdge, nearBottomEdge);
    }

    // Crowd dispersal
    if (isCrowded && !targetPlant) {
      const crowdCenter = this.calculateCrowdCenter(organisms);
      if (crowdCenter) {
        this.lastDirection = Math.atan2(this.y - crowdCenter.y, this.x - crowdCenter.x);
        return this.lastDirection;
      }
    }

    // Food seeking (highest priority)
    if (targetPlant) {
      this.lastDirection = Math.atan2(targetPlant.y - this.y, targetPlant.x - this.x);
      return this.lastDirection;
    }

    // Hungry behavior
    if (isHungry) {
      return this.getHungrySearchAngle(nearAnyEdge, nearLeftEdge, nearRightEdge, nearTopEdge, nearBottomEdge);
    }

    // Normal wandering
    return this.getWanderingAngle(nearAnyEdge);
  }

  private getEdgeEscapeAngle(nearLeft: boolean, nearRight: boolean, nearTop: boolean, nearBottom: boolean): number {
    if (nearLeft) return random(Math.PI/4, 3*Math.PI/4);
    if (nearRight) return random(5*Math.PI/4, 7*Math.PI/4);
    if (nearTop) return random(Math.PI/4, 3*Math.PI/4);
    if (nearBottom) return random(-Math.PI/4, Math.PI/4);
    return Math.random() * 2 * Math.PI;
  }

  private calculateCrowdCenter(organisms: Organism[]): {x: number, y: number} | null {
    let crowdCenterX = 0, crowdCenterY = 0, crowdCount = 0;
    
    for (const other of organisms) {
      if (other !== this) {
        const dist = distance(this.x, this.y, other.x, other.y);
        if (dist < 50) {
          crowdCenterX += other.x;
          crowdCenterY += other.y;
          crowdCount++;
        }
      }
    }
    
    if (crowdCount > 0) {
      return {
        x: crowdCenterX / crowdCount,
        y: crowdCenterY / crowdCount
      };
    }
    return null;
  }

  private getHungrySearchAngle(nearAnyEdge: boolean, nearLeft: boolean, nearRight: boolean, nearTop: boolean, nearBottom: boolean): number {
    if (nearAnyEdge) {
      let escapeAngle = 0;
      if (nearLeft && nearTop) escapeAngle = Math.PI/4;
      else if (nearRight && nearTop) escapeAngle = 3*Math.PI/4;
      else if (nearLeft && nearBottom) escapeAngle = -Math.PI/4;
      else if (nearRight && nearBottom) escapeAngle = -3*Math.PI/4;
      else if (nearLeft) escapeAngle = 0;
      else if (nearRight) escapeAngle = Math.PI;
      else if (nearTop) escapeAngle = Math.PI/2;
      else if (nearBottom) escapeAngle = -Math.PI/2;
      
      this.lastDirection = escapeAngle + random(-Math.PI/3, Math.PI/3);
    } else {
      this.lastDirection = this.lastDirection + random(-Math.PI, Math.PI);
    }
    return this.lastDirection;
  }

  private getWanderingAngle(nearAnyEdge: boolean): number {
    let randomness = nearAnyEdge ? 1.5 : this.genes.randomness * 2;
    
    if (this.directionChangeTimer > 60) {
      randomness *= 1.5;
    }
    
    this.lastDirection = this.lastDirection + random(-randomness, randomness);
    return this.lastDirection;
  }

  private applyMovement(dx: number, dy: number, worldWidth: number, worldHeight: number): void {
    let newX = this.x + dx;
    let newY = this.y + dy;
    
    // Boundary handling with reflection
    if (newX < 10) {
      newX = 10;
      this.lastDirection = normalizeAngle(Math.PI - this.lastDirection + random(-0.5, 0.5));
    } else if (newX > worldWidth - 10) {
      newX = worldWidth - 10;
      this.lastDirection = normalizeAngle(Math.PI - this.lastDirection + random(-0.5, 0.5));
    }
    
    if (newY < 10) {
      newY = 10;
      this.lastDirection = normalizeAngle(-this.lastDirection + random(-0.5, 0.5));
    } else if (newY > worldHeight - 10) {
      newY = worldHeight - 10;
      this.lastDirection = normalizeAngle(-this.lastDirection + random(-0.5, 0.5));
    }
    
    this.x = newX;
    this.y = newY;
  }

  /**
   * Find the closest plant within vision range
   */
  findClosestPlant(plants: Plant[]): Plant | null {
    let closest: Plant | null = null;
    const isHungry = this.energy < 50;
    const visionRange = isHungry ? this.genes.vision * 1.5 : this.genes.vision;
    let closestDist = visionRange;

    for (const plant of plants) {
      const dist = distance(this.x, this.y, plant.x, plant.y);
      if (dist < closestDist) {
        closest = plant;
        closestDist = dist;
      }
    }
    return closest;
  }

  /**
   * Check if organism is in a crowded area
   */
  isCrowded(organisms: Organism[]): boolean {
    const crowdRadius = 30;
    let neighborCount = 0;
    
    for (const other of organisms) {
      if (other !== this) {
        const dist = distance(this.x, this.y, other.x, other.y);
        if (dist < crowdRadius) {
          neighborCount++;
        }
      }
    }
    
    return neighborCount > 3;
  }

  /**
   * Check if this organism is compatible with another for reproduction
   */
  isCompatibleWith(other: Organism): boolean {
    return isColorCompatible(this.color, other.color);
  }

  /**
   * Try to reproduce with another organism
   */
  tryToReproduceWith(partner: Organism): Organism | null {
    const dist = distance(this.x, this.y, partner.x, partner.y);

    if (
      this !== partner &&
      dist < 20 &&
      this.energy >= 60 &&
      partner.energy >= 60 &&
      this.energy >= 50 &&
      partner.energy >= 50 &&
      this.isCompatibleWith(partner)
    ) {
      // Both parents give energy
      this.energy -= 30;
      partner.energy -= 30;

      const childGenes = crossoverGenes(this.genes, partner.genes);
      const childColor = mixColors(this.color, partner.color);
      const childX = (this.x + partner.x) / 2 + random(-5, 5);
      const childY = (this.y + partner.y) / 2 + random(-5, 5);

      return new Organism(childX, childY, 50, childColor, childGenes);
    }
    return null;
  }

  /**
   * Try to eat a plant
   */
  tryToEat(plants: Plant[]): Plant | null {
    for (let i = plants.length - 1; i >= 0; i--) {
      const plant = plants[i];
      const dist = distance(this.x, this.y, plant.x, plant.y);
      if (dist < this.size + plant.size) {
        this.energy = Math.min(100, this.energy + 20);
        return plants.splice(i, 1)[0];
      }
    }
    return null;
  }

  /**
   * Leave a trail in the trail grid
   */
  leaveTrail(trailGrid: TrailData[][]): void {
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);
    if (x >= 0 && x < trailGrid.length && y >= 0 && y < trailGrid[0].length) {
      const hue = parseFloat(this.color.match(/hsl\((\d+)/)?.[1] || '0');
      trailGrid[x][y] = { hue, intensity: 1.0 };
    }
  }

  /**
   * Check if organism is dead
   */
  isDead(): boolean {
    return this.energy <= 0;
  }

  /**
   * Draw the organism on canvas
   */
  draw(ctx: CanvasRenderingContext2D): void {
    const isHungry = this.energy < 50;
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Add visual indicator for hungry organisms
    if (isHungry) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw energy text
    ctx.fillStyle = '#000';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(Math.floor(this.energy).toString(), this.x, this.y - this.size - 4);
  }

  /**
   * Get organism data for serialization
   */
  toData(): OrganismData {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      energy: this.energy,
      color: this.color,
      size: this.size,
      genes: { ...this.genes },
      lastDirection: this.lastDirection,
      age: this.age
    };
  }
}
