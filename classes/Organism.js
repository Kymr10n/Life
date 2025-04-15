import { Plant } from './Plant.js';

export class Organism {
  constructor(x, y, energy = 50, color = null, genes = null) {
    this.x = x;
    this.y = y;
    this.energy = energy;
    this.color = color || `hsl(${Math.random() * 360}, 70%, 50%)`;
    this.size = 5;
    this.lastDirection = Math.random() * 2 * Math.PI;
  
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

  move(plants, trailGrid) {
    let angle;
    const targetPlant = this.findClosestPlant(plants);
  
    if (targetPlant) {
      // Ziel: Pflanze
      angle = Math.atan2(targetPlant.y - this.y, targetPlant.x - this.x);
      this.lastDirection = angle;
    } else {
      // Suche nach Spur
      const trailDirection = this.findTrailDirection(trailGrid);
      if (trailDirection !== null) {
        angle = trailDirection;
        this.lastDirection = angle;
      } else {
        // Keine Pflanze, keine Spur → alte Richtung beibehalten
        angle = this.lastDirection + (Math.random() - 0.5) * this.genes.randomness;
        this.lastDirection = angle;
      }
    }
  
    // Bewegung
    const dx = Math.cos(angle) * this.genes.speed;
    const dy = Math.sin(angle) * this.genes.speed;
    this.x += dx;
    this.y += dy;
    this.energy -= 0.1;
  
    // Begrenzung
    this.x = Math.max(0, Math.min(800, this.x));
    this.y = Math.max(0, Math.min(600, this.y));
  
    // Spur hinterlassen
    this.leaveTrail(trailGrid);
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

  isCompatibleWith(other) {
    // Beispiel: Ähnliche Farbe (Hue-Differenz < 30)
    const hue1 = parseFloat(this.color.match(/hsl\((\d+)/)?.[1]) || 0;
    const hue2 = parseFloat(other.color.match(/hsl\((\d+)/)?.[1]) || 0;
    const hueDiff = Math.abs(hue1 - hue2);
    return hueDiff < 30 || hueDiff > 330;
  }

  tryToReproduceWith(partner, organisms) {
    const dist = Math.hypot(this.x - partner.x, this.y - partner.y);
  
    if (
      this !== partner &&
      dist < 20 &&
      this.energy >= 60 &&
      partner.energy >= 60 &&
      this.isCompatibleWith(partner)
    ) {
      // Beide geben 30 Energie ab
      this.energy -= 30;
      partner.energy -= 30;
  
      const childGenes = {
        speed: avgMutate(this.genes.speed, partner.genes.speed),
        vision: avgMutate(this.genes.vision, partner.genes.vision),
        randomness: Math.max(0.05, avgMutate(this.genes.randomness, partner.genes.randomness))
      };
  
      const childColor = this.mixColorWith(partner);
      const childX = (this.x + partner.x) / 2 + (Math.random() * 10 - 5);
      const childY = (this.y + partner.y) / 2 + (Math.random() * 10 - 5);
  
      organisms.push(new Organism(childX, childY, 50, childColor, childGenes));
    }
  }
  
  leaveTrail(trailGrid) {
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);
    if (trailGrid[x] && trailGrid[x][y]) {
      const hue = parseFloat(this.color.match(/hsl\((\d+)/)?.[1]) || 0;
      trailGrid[x][y] = { hue, intensity: 1.0 };
    }
  }

  findTrailDirection(trailGrid) {
    const maxTrailVision = 5; // limitiere das Suchfeld hart
    const vision = Math.min(maxTrailVision, Math.floor(this.genes.vision));
    const hue = parseFloat(this.color.match(/hsl\((\d+)/)?.[1]) || 0;
  
    let bestX = null;
    let bestY = null;
    let bestStrength = 0;
  
    for (let dx = -vision; dx <= vision; dx++) {
      for (let dy = -vision; dy <= vision; dy++) {
        const tx = Math.floor(this.x + dx);
        const ty = Math.floor(this.y + dy);
        if (
          trailGrid[tx] &&
          trailGrid[tx][ty] &&
          trailGrid[tx][ty].intensity > 0
        ) {
          const trail = trailGrid[tx][ty];
          const hueDiff = Math.abs(hue - trail.hue);
          const isSameKind = hueDiff < 30 || hueDiff > 330;
  
          if (isSameKind && trail.intensity > bestStrength) {
            bestX = tx;
            bestY = ty;
            bestStrength = trail.intensity;
          }
        }
      }
    }
  
    if (bestX !== null && bestY !== null) {
      return Math.atan2(bestY - this.y, bestX - this.x);
    }
  
    return null;
  }

  mixColorWith(other) {
    // Farbmittelwert (Hue)
    const hue1 = parseFloat(this.color.match(/hsl\((\d+)/)?.[1]) || 0;
    const hue2 = parseFloat(other.color.match(/hsl\((\d+)/)?.[1]) || 0;
    const midHue = (hue1 + hue2) / 2 % 360;
    return `hsl(${midHue}, 70%, 50%)`;
  }  
  
  avgMutate(a, b) {
    const avg = (a + b) / 2;
    return avg * (1 + (Math.random() * 0.2 - 0.1));
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