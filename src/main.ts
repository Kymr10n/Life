import { World } from './engine/World.js';
import { SimulationStats } from './types/index.js';

class LifeSimulation {
  private world: World;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isRunning: boolean = false;
  private animationId: number | null = null;

  // UI elements
  private populationElement: HTMLElement | null = null;
  private plantsElement: HTMLElement | null = null;
  private avgEnergyElement: HTMLElement | null = null;
  private avgSpeedElement: HTMLElement | null = null;
  private avgVisionElement: HTMLElement | null = null;
  private avgRandomnessElement: HTMLElement | null = null;
  private maxAgeElement: HTMLElement | null = null;
  private frameCountElement: HTMLElement | null = null;

  constructor() {
    this.canvas = document.getElementById('simulationCanvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas element with id "simulationCanvas" not found');
    }

    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = context;

    // Initialize world
    this.world = new World(this.canvas.width, this.canvas.height);

    // Set up event listeners
    this.setupEventListeners();
    this.setupUI();

    console.log('Life Simulation initialized');
  }

  private setupEventListeners(): void {
    // World events
    this.world.on('statsUpdate', (stats: SimulationStats) => {
      this.updateStatsDisplay(stats);
    });

    this.world.on('organismBorn', (organism) => {
      console.log(`Organism born: ${organism.id}`);
    });

    this.world.on('organismDied', (organismId) => {
      console.log(`Organism died: ${organismId}`);
    });

    // Canvas click to add organism
    this.canvas.addEventListener('click', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.world.addOrganism(x, y);
    });

    // Canvas right-click to add plant
    this.canvas.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.world.addPlant(x, y);
    });
  }

  private setupUI(): void {
    // Get UI elements
    this.populationElement = document.getElementById('population');
    this.plantsElement = document.getElementById('plants');
    this.avgEnergyElement = document.getElementById('avgEnergy');
    this.avgSpeedElement = document.getElementById('avgSpeed');
    this.avgVisionElement = document.getElementById('avgVision');
    this.avgRandomnessElement = document.getElementById('avgRandomness');
    this.maxAgeElement = document.getElementById('maxAge');
    this.frameCountElement = document.getElementById('frameCount');

    // Set up control buttons
    const startButton = document.getElementById('startBtn');
    const pauseButton = document.getElementById('pauseBtn');
    const resetButton = document.getElementById('resetBtn');

    if (startButton) {
      startButton.addEventListener('click', () => this.start());
    }
    if (pauseButton) {
      pauseButton.addEventListener('click', () => this.pause());
    }
    if (resetButton) {
      resetButton.addEventListener('click', () => this.reset());
    }

    // Create control buttons if they don't exist
    this.createControlsIfNeeded();
  }

  private createControlsIfNeeded(): void {
    let controlsContainer = document.getElementById('controls');
    
    if (!controlsContainer) {
      controlsContainer = document.createElement('div');
      controlsContainer.id = 'controls';
      controlsContainer.style.cssText = `
        margin: 10px 0;
        display: flex;
        gap: 10px;
        align-items: center;
      `;
      
      // Insert after canvas
      this.canvas.parentNode?.insertBefore(controlsContainer, this.canvas.nextSibling);
      
      // Create buttons
      const startBtn = document.createElement('button');
      startBtn.id = 'startBtn';
      startBtn.textContent = 'Start';
      startBtn.onclick = () => this.start();
      
      const pauseBtn = document.createElement('button');
      pauseBtn.id = 'pauseBtn';
      pauseBtn.textContent = 'Pause';
      pauseBtn.onclick = () => this.pause();
      
      const resetBtn = document.createElement('button');
      resetBtn.id = 'resetBtn';
      resetBtn.textContent = 'Reset';
      resetBtn.onclick = () => this.reset();

      const instructions = document.createElement('span');
      instructions.textContent = 'Click to add organism, right-click to add plant';
      instructions.style.marginLeft = '20px';
      instructions.style.fontSize = '12px';
      instructions.style.color = '#666';
      
      controlsContainer.appendChild(startBtn);
      controlsContainer.appendChild(pauseBtn);
      controlsContainer.appendChild(resetBtn);
      controlsContainer.appendChild(instructions);
    }

    // Create stats display if needed
    this.createStatsDisplayIfNeeded();
  }

  private createStatsDisplayIfNeeded(): void {
    let statsContainer = document.getElementById('stats');
    
    if (!statsContainer) {
      statsContainer = document.createElement('div');
      statsContainer.id = 'stats';
      statsContainer.style.cssText = `
        margin: 10px 0;
        padding: 10px;
        background: #f5f5f5;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
      `;
      
      // Insert after controls
      const controls = document.getElementById('controls');
      controls?.parentNode?.insertBefore(statsContainer, controls.nextSibling);
      
      // Create stat elements
      const stats = [
        { id: 'frameCount', label: 'Frame' },
        { id: 'population', label: 'Population' },
        { id: 'plants', label: 'Plants' },
        { id: 'avgEnergy', label: 'Avg Energy' },
        { id: 'avgSpeed', label: 'Avg Speed' },
        { id: 'avgVision', label: 'Avg Vision' },
        { id: 'avgRandomness', label: 'Avg Randomness' },
        { id: 'maxAge', label: 'Max Age' }
      ];
      
      stats.forEach(stat => {
        const div = document.createElement('div');
        div.innerHTML = `<strong>${stat.label}:</strong> <span id="${stat.id}">0</span>`;
        statsContainer!.appendChild(div);
      });

      // Update references
      this.populationElement = document.getElementById('population');
      this.plantsElement = document.getElementById('plants');
      this.avgEnergyElement = document.getElementById('avgEnergy');
      this.avgSpeedElement = document.getElementById('avgSpeed');
      this.avgVisionElement = document.getElementById('avgVision');
      this.avgRandomnessElement = document.getElementById('avgRandomness');
      this.maxAgeElement = document.getElementById('maxAge');
      this.frameCountElement = document.getElementById('frameCount');
    }
  }

  private updateStatsDisplay(stats: SimulationStats): void {
    if (this.populationElement) this.populationElement.textContent = stats.organismCount.toString();
    if (this.plantsElement) this.plantsElement.textContent = stats.plantCount.toString();
    if (this.avgEnergyElement) this.avgEnergyElement.textContent = stats.avgEnergy.toFixed(1);
    if (this.avgSpeedElement) this.avgSpeedElement.textContent = stats.avgSpeed.toFixed(2);
    if (this.avgVisionElement) this.avgVisionElement.textContent = stats.avgVision.toFixed(1);
    if (this.avgRandomnessElement) this.avgRandomnessElement.textContent = stats.avgRandomness.toFixed(2);
    if (this.maxAgeElement) this.maxAgeElement.textContent = stats.maxAge.toString();
    if (this.frameCountElement) this.frameCountElement.textContent = stats.frameCount.toString();
  }

  private gameLoop = (currentTime: number): void => {
    if (!this.isRunning) return;

    // Update world
    const updated = this.world.update(currentTime);
    
    // Draw only if world was updated
    if (updated) {
      this.world.draw(this.ctx);
    }

    // Schedule next frame
    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  public start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.animationId = requestAnimationFrame(this.gameLoop);
      console.log('Simulation started');
    }
  }

  public pause(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    console.log('Simulation paused');
  }

  public reset(): void {
    this.pause();
    this.world = new World(this.canvas.width, this.canvas.height);
    this.setupEventListeners();
    this.world.draw(this.ctx);
    console.log('Simulation reset');
  }

  public getPerformanceMetrics() {
    return this.world.getPerformanceMetrics();
  }
}

// Initialize simulation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    const simulation = new LifeSimulation();
    
    // Auto-start simulation
    simulation.start();
    
    // Make simulation available globally for debugging
    (window as any).simulation = simulation;
    
    console.log('Life simulation ready! Click to add organisms, right-click to add plants.');
  } catch (error) {
    console.error('Failed to initialize simulation:', error);
  }
});

export { LifeSimulation };
