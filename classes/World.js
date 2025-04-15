import { Stats } from './Stats.js';
import { Organism } from './Organism.js';
import { Plant } from './Plant.js';

export class World {
    constructor(canvas, ctx) {
      this.canvas = canvas;
      this.ctx = ctx;
      this.organisms = [];
      this.plants = [];
      this.stats = new Stats();
  
      this.selected = null;
  
      // Click Event
      this.canvas.addEventListener("click", (e) => this.onClick(e));
      this.trailGrid = this.createEmptyTrailGrid();
    }

    createEmptyTrailGrid() {
      const width = Math.floor(this.canvas.width);
      const height = Math.floor(this.canvas.height);
      const grid = [];
    
      for (let x = 0; x < width; x++) {
        grid[x] = [];
        for (let y = 0; y < height; y++) {
          grid[x][y] = { hue: null, intensity: 0 };
        }
      }
      return grid;
    }

    fadeTrails() {
      for (let x = 0; x < this.canvas.width; x++) {
        for (let y = 0; y < this.canvas.height; y++) {
          if (this.trailGrid[x][y].intensity > 0) {
            this.trailGrid[x][y].intensity *= 0.95; // langsames Verblassen
          }
        }
      }
    }
  
    onClick(e) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
  
      this.selected = this.organisms.find(o => {
        const dx = x - o.x;
        const dy = y - o.y;
        return Math.sqrt(dx * dx + dy * dy) < o.size + 3;
      });
  
      const infobox = document.getElementById("infobox");
      const genes = document.getElementById("genes");
  
      if (this.selected) {
        genes.innerHTML = Object.entries(this.selected.genes)
          .map(([k, v]) => `<b>${k}:</b> ${v.toFixed(2)}`)
          .join("<br>");
        infobox.style.display = "block";
      } else {
        infobox.style.display = "none";
      }
    }

  init() {
    for (let i = 0; i < 20; i++) {
      this.spawnOrganism();
    }
    for (let i = 0; i < 100; i++) {
      this.spawnPlant();
    }
  }

  spawnOrganism() {
    const x = Math.random() * this.canvas.width;
    const y = Math.random() * this.canvas.height;
    this.organisms.push(new Organism(x, y));
  }

  spawnPlant() {
    const x = Math.random() * this.canvas.width;
    const y = Math.random() * this.canvas.height;
    this.plants.push(new Plant(x, y));
  }

  update() {
    const newOrganisms = [];

    for (let org of this.organisms) {
      org.move(this.plants, this.trailGrid); // <-- trailGrid mitgeben
      org.tryToEat(this.plants);
    }

    this.organisms = this.organisms.filter(o => !o.isDead());
    this.organisms.push(...newOrganisms);

    for (let i = 0; i < this.organisms.length; i++) {
      for (let j = i + 1; j < this.organisms.length; j++) {
        this.organisms[i].tryToReproduceWith(this.organisms[j], newOrganisms);
      }
    }

    if (Math.random() < 0.08) {
      this.spawnPlant();
    }

    this.stats.update(this.organisms);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let plant of this.plants) {
      plant.draw(this.ctx);
    }

    for (let org of this.organisms) {
      org.draw(this.ctx);

      // Zeige Gene als Overlay
      this.ctx.font = "8px Arial";
      this.ctx.fillStyle = "#333";
      this.ctx.fillText(`S:${org.genes.speed.toFixed(1)} V:${org.genes.vision.toFixed(0)}`, org.x, org.y + 12);
    }

    this.stats.drawChart();
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}