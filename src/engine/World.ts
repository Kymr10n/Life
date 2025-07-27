import { OrganismData, PlantData, SimulationStats, TrailData } from '../types/index.js';
import { clamp, random } from '../utils/math.js';
import { Organism } from './Organism.js';
import { Plant } from './Plant.js';

export interface WorldEvents {
  statsUpdate: (stats: SimulationStats) => void;
  organismBorn: (organism: OrganismData) => void;
  organismDied: (organismId: string) => void;
  plantEaten: (plantId: string) => void;
  plantGrown: (plant: PlantData) => void;
}

export class World {
  public readonly width: number;
  public readonly height: number;
  public organisms: Organism[] = [];
  public plants: Plant[] = [];
  public trailGrid: TrailData[][];
  private frameCount: number = 0;
  private lastTime: number = 0;
  private targetFPS: number = 60;
  private frameInterval: number;
  private eventListeners: Partial<WorldEvents> = {};

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.frameInterval = 1000 / this.targetFPS;
    
    // Initialize trail grid (10x10 blocks for performance)
    const gridWidth = Math.floor(width / 10);
    const gridHeight = Math.floor(height / 10);
    this.trailGrid = Array(gridWidth).fill(null).map(() => 
      Array(gridHeight).fill(null).map(() => ({ hue: 0, intensity: 0 }))
    );

    this.initialize();
  }

  /**
   * Initialize the world with starting organisms and plants
   */
  private initialize(): void {
    // Create initial organisms
    for (let i = 0; i < 20; i++) {
      const x = random(50, this.width - 50);
      const y = random(50, this.height - 50);
      this.organisms.push(new Organism(x, y));
    }

    // Create initial plants
    for (let i = 0; i < 30; i++) {
      this.addRandomPlant();
    }
  }

  /**
   * Add event listener
   */
  on<K extends keyof WorldEvents>(event: K, listener: WorldEvents[K]): void {
    this.eventListeners[event] = listener;
  }

  /**
   * Remove event listener
   */
  off<K extends keyof WorldEvents>(event: K): void {
    delete this.eventListeners[event];
  }

  /**
   * Emit event to listeners
   */
  private emit<K extends keyof WorldEvents>(event: K, ...args: Parameters<WorldEvents[K]>): void {
    const listener = this.eventListeners[event];
    if (listener) {
      (listener as any)(...args);
    }
  }

  /**
   * Main update loop
   */
  update(currentTime: number): boolean {
    // Frame rate limiting
    if (currentTime - this.lastTime < this.frameInterval) {
      return false;
    }
    this.lastTime = currentTime;
    this.frameCount++;

    // Update trail decay
    this.updateTrails();

    // Update organisms
    this.updateOrganisms();

    // Handle reproduction
    this.handleReproduction();

    // Update plants
    this.updatePlants();

    // Emit stats update
    this.emitStats();

    return true;
  }

  /**
   * Update trail decay
   */
  private updateTrails(): void {
    const decayRate = 0.02;
    for (let x = 0; x < this.trailGrid.length; x++) {
      for (let y = 0; y < this.trailGrid[x].length; y++) {
        const trail = this.trailGrid[x][y];
        if (trail.intensity > 0) {
          trail.intensity = Math.max(0, trail.intensity - decayRate);
        }
      }
    }
  }

  /**
   * Update all organisms
   */
  private updateOrganisms(): void {
    // Move all organisms
    for (const organism of this.organisms) {
      organism.move(this.plants, this.trailGrid, this.organisms, this.width, this.height);
      
      // Try to eat plants
      const eatenPlant = organism.tryToEat(this.plants);
      if (eatenPlant) {
        this.emit('plantEaten', eatenPlant.id);
      }
    }

    // Remove dead organisms
    const initialCount = this.organisms.length;
    this.organisms = this.organisms.filter(organism => {
      if (organism.isDead()) {
        this.emit('organismDied', organism.id);
        return false;
      }
      return true;
    });

    // Check for extinction
    if (this.organisms.length === 0) {
      console.log('Population extinct, restarting...');
      this.restartSimulation();
    }
  }

  /**
   * Handle organism reproduction
   */
  private handleReproduction(): void {
    const newOrganisms: Organism[] = [];
    
    for (let i = 0; i < this.organisms.length; i++) {
      const organism = this.organisms[i];
      
      // Skip if not ready to reproduce
      if (organism.energy < 60) continue;
      
      // Find potential partners
      for (let j = i + 1; j < this.organisms.length; j++) {
        const partner = this.organisms[j];
        
        if (partner.energy < 60) continue;
        
        const child = organism.tryToReproduceWith(partner);
        if (child) {
          // Ensure child is within bounds
          child.x = clamp(child.x, 10, this.width - 10);
          child.y = clamp(child.y, 10, this.height - 10);
          
          newOrganisms.push(child);
          this.emit('organismBorn', child.toData());
          break; // Each organism can only reproduce once per frame
        }
      }
    }
    
    this.organisms.push(...newOrganisms);
  }

  /**
   * Update plants (growth and spawning)
   */
  private updatePlants(): void {
    // Randomly spawn new plants
    if (this.plants.length < 50 && Math.random() < 0.1) {
      const newPlant = this.addRandomPlant();
      if (newPlant) {
        this.emit('plantGrown', newPlant.toData());
      }
    }
  }

  /**
   * Add a random plant to the world
   */
  private addRandomPlant(): Plant | null {
    const maxAttempts = 10;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const x = random(30, this.width - 30);
      const y = random(30, this.height - 30);
      
      // Check if position is clear of organisms
      let tooClose = false;
      for (const organism of this.organisms) {
        if (Math.abs(organism.x - x) < 20 && Math.abs(organism.y - y) < 20) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose) {
        const plant = new Plant(x, y);
        this.plants.push(plant);
        return plant;
      }
      
      attempts++;
    }
    
    return null;
  }

  /**
   * Restart the simulation
   */
  private restartSimulation(): void {
    this.organisms = [];
    this.plants = [];
    this.frameCount = 0;
    
    // Clear trails
    for (let x = 0; x < this.trailGrid.length; x++) {
      for (let y = 0; y < this.trailGrid[x].length; y++) {
        this.trailGrid[x][y] = { hue: 0, intensity: 0 };
      }
    }
    
    this.initialize();
  }

  /**
   * Emit current simulation statistics
   */
  private emitStats(): void {
    if (this.frameCount % 30 === 0) { // Update stats every 30 frames
      const stats: SimulationStats = {
        frameCount: this.frameCount,
        organismCount: this.organisms.length,
        plantCount: this.plants.length,
        avgEnergy: this.organisms.reduce((sum, org) => sum + org.energy, 0) / this.organisms.length || 0,
        avgSpeed: this.organisms.reduce((sum, org) => sum + org.genes.speed, 0) / this.organisms.length || 0,
        avgVision: this.organisms.reduce((sum, org) => sum + org.genes.vision, 0) / this.organisms.length || 0,
        avgRandomness: this.organisms.reduce((sum, org) => sum + org.genes.randomness, 0) / this.organisms.length || 0,
        maxAge: Math.max(...this.organisms.map(org => org.age), 0)
      };
      
      this.emit('statsUpdate', stats);
    }
  }

  /**
   * Draw the world on canvas
   */
  draw(ctx: CanvasRenderingContext2D): void {
    // Clear canvas
    ctx.fillStyle = '#f0f8ff';
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw trails
    this.drawTrails(ctx);

    // Draw plants
    for (const plant of this.plants) {
      plant.draw(ctx);
    }

    // Draw organisms
    for (const organism of this.organisms) {
      organism.draw(ctx);
    }

    // Draw border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, this.width, this.height);
  }

  /**
   * Draw trail system
   */
  private drawTrails(ctx: CanvasRenderingContext2D): void {
    const blockSize = 10;
    
    for (let x = 0; x < this.trailGrid.length; x++) {
      for (let y = 0; y < this.trailGrid[x].length; y++) {
        const trail = this.trailGrid[x][y];
        if (trail.intensity > 0.1) {
          const alpha = trail.intensity * 0.3;
          ctx.fillStyle = `hsla(${trail.hue}, 70%, 60%, ${alpha})`;
          ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
        }
      }
    }
  }

  /**
   * Get current world state for serialization
   */
  getState(): {
    frameCount: number;
    organisms: OrganismData[];
    plants: PlantData[];
    stats: SimulationStats;
  } {
    return {
      frameCount: this.frameCount,
      organisms: this.organisms.map(org => org.toData()),
      plants: this.plants.map(plant => plant.toData()),
      stats: {
        frameCount: this.frameCount,
        organismCount: this.organisms.length,
        plantCount: this.plants.length,
        avgEnergy: this.organisms.reduce((sum, org) => sum + org.energy, 0) / this.organisms.length || 0,
        avgSpeed: this.organisms.reduce((sum, org) => sum + org.genes.speed, 0) / this.organisms.length || 0,
        avgVision: this.organisms.reduce((sum, org) => sum + org.genes.vision, 0) / this.organisms.length || 0,
        avgRandomness: this.organisms.reduce((sum, org) => sum + org.genes.randomness, 0) / this.organisms.length || 0,
        maxAge: Math.max(...this.organisms.map(org => org.age), 0)
      }
    };
  }

  /**
   * Add organism to the world
   */
  addOrganism(x: number, y: number, energy?: number): void {
    const organism = new Organism(
      clamp(x, 10, this.width - 10),
      clamp(y, 10, this.height - 10),
      energy
    );
    this.organisms.push(organism);
    this.emit('organismBorn', organism.toData());
  }

  /**
   * Add plant to the world
   */
  addPlant(x: number, y: number): void {
    const plant = new Plant(
      clamp(x, 10, this.width - 10),
      clamp(y, 10, this.height - 10)
    );
    this.plants.push(plant);
    this.emit('plantGrown', plant.toData());
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    fps: number;
    frameCount: number;
    organismCount: number;
    plantCount: number;
  } {
    return {
      fps: 1000 / this.frameInterval,
      frameCount: this.frameCount,
      organismCount: this.organisms.length,
      plantCount: this.plants.length
    };
  }
}
