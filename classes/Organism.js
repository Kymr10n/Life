import { Plant } from './Plant.js';

export class Organism {
  constructor(x, y, energy = 50, color = null, genes = null) {
    this.x = x;
    this.y = y;
    this.energy = energy;
    this.color = color || `hsl(${Math.random() * 360}, 70%, 50%)`;
    this.size = 5;
  
    this.genes = genes || {
      speed: 1.5,
      vision: 40,
      randomness: 0.4
    };
  }  

  move() {
    const dx = Math.random() * 10 - 5;
    const dy = Math.random() * 10 - 5;
    this.x += dx;
    this.y += dy;
    this.energy -= 0.1;

    // Grenzen
    this.x = Math.max(0, Math.min(800, this.x));
    this.y = Math.max(0, Math.min(600, this.y));
  }

  move(plants) {
    let target = this.findClosestPlant(plants);
    let angle;
  
    if (target) {
      angle = Math.atan2(target.y - this.y, target.x - this.x);
    } else {
      // Zufällige Richtung
      angle = Math.random() * 2 * Math.PI;
    }
  
    // Zufällige Abweichung je nach Gen
    angle += (Math.random() - 0.5) * this.genes.randomness;
  
    const dx = Math.cos(angle) * this.genes.speed;
    const dy = Math.sin(angle) * this.genes.speed;
  
    this.x += dx;
    this.y += dy;
    this.energy -= 0.1;
  
    // Grenzen
    this.x = Math.max(0, Math.min(800, this.x));
    this.y = Math.max(0, Math.min(600, this.y));
  }

  findClosestPlant(plants) {
    let closest = null;
    let closestDist = this.genes.vision;
  
    for (let plant of plants) {
      const dx = this.x - plant.x;
      const dy = this.y - plant.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
  
      if (dist < closestDist) {
        closest = plant;
        closestDist = dist;
      }
    }
    return closest;
  }

  maybeReproduce(organisms) {
    if (this.energy >= 100) {
      this.energy /= 2;
  
      const childGenes = {
        speed: this.genes.speed * (1 + (Math.random() * 0.2 - 0.1)),
        vision: this.genes.vision * (1 + (Math.random() * 0.2 - 0.1)),
        randomness: Math.max(0.05, this.genes.randomness + (Math.random() * 0.2 - 0.1)),
      };
  
      const childX = this.x + Math.random() * 20 - 10;
      const childY = this.y + Math.random() * 20 - 10;
      const childColor = this.mutateColor();
  
      organisms.push(new Organism(childX, childY, this.energy, childColor, childGenes));
    }
  }

  tryToEat(plants) {
    for (let i = plants.length - 1; i >= 0; i--) {
      const plant = plants[i];
      const dx = this.x - plant.x;
      const dy = this.y - plant.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.size + plant.size) {
        this.energy = Math.min(100, this.energy + 20);
        plants.splice(i, 1);
        break;
      }
    }
  }

  mutateColor() {
    const hue = parseFloat(this.color.match(/hsl\((\d+)/)?.[1]) || 0;
    const newHue = (hue + (Math.random() * 40 - 20) + 360) % 360;
    return `hsl(${newHue}, 70%, 50%)`;
  }

  isDead() {
    return this.energy <= 0;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.fillText(Math.floor(this.energy), this.x, this.y - this.size - 4);
  }
}