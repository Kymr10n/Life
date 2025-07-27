import { Plant } from './Plant.js';

// Helper function for genetic mutation
function avgMutate(a, b) {
  const avg = (a + b) / 2;
  return avg * (1 + (Math.random() * 0.2 - 0.1));
}

export class Organism {
  constructor(x, y, energy = 50, color = null, genes = null) {
    this.x = x;
    this.y = y;
    this.energy = energy;
    this.color = color || `hsl(${Math.random() * 360}, 70%, 50%)`;
    this.size = 5;
    this.lastDirection = Math.random() * 2 * Math.PI;
    this.stuckCounter = 0; // Track if organism is stuck
    this.lastX = x;
    this.lastY = y;
    this.directionChangeTimer = 0; // Add timer for periodic direction changes
  
    this.genes = genes || {
      speed: 1.5,
      vision: 40,
      randomness: 0.8 // Increased from 0.4 to promote more exploration
    };
    
    // Safety check: ensure genes are never zero or negative
    this.genes.speed = Math.max(0.5, this.genes.speed);
    this.genes.vision = Math.max(10, this.genes.vision);
    this.genes.randomness = Math.max(0.1, this.genes.randomness);
  }  

  move(plants, trailGrid, organisms) {
    // Check if organism is stuck (hasn't moved much) - make less sensitive
    const distMoved = Math.hypot(this.x - this.lastX, this.y - this.lastY);
    if (distMoved < 0.5) { // Reduced from 1 to 0.5 for better detection
      this.stuckCounter++;
    } else {
      this.stuckCounter = 0;
    }
    this.lastX = this.x;
    this.lastY = this.y;

    // Increment direction change timer
    this.directionChangeTimer++;

    let angle;
    const targetPlant = this.findClosestPlant(plants);
    const isHungry = this.energy < 50; // Survival mode when energy is low
    const isCrowded = organisms ? this.isCrowded(organisms) : false;
    
    // Near-edge detection for better dispersal - make zones smaller and more balanced
    const nearLeftEdge = this.x < 80;
    const nearRightEdge = this.x > 720;
    const nearTopEdge = this.y < 80;
    const nearBottomEdge = this.y > 520;
    const nearAnyEdge = nearLeftEdge || nearRightEdge || nearTopEdge || nearBottomEdge;
  
    // Periodic direction change to prevent long-term convergence
    if (this.directionChangeTimer > 120 && !targetPlant) { // Every 2 seconds at 60fps
      angle = Math.random() * 2 * Math.PI;
      this.lastDirection = angle;
      this.directionChangeTimer = 0;
    } else if (this.stuckCounter > 30) {
      // Instead of always going to center, pick a random direction away from edges
      if (nearLeftEdge) angle = (Math.random() * Math.PI/2) + Math.PI/4; // Head right (0 to 90 degrees)
      else if (nearRightEdge) angle = (Math.random() * Math.PI/2) + (3*Math.PI/4); // Head left (135 to 225 degrees)  
      else if (nearTopEdge) angle = (Math.random() * Math.PI/2) + Math.PI/4; // Head down-right (45 to 135 degrees)
      else if (nearBottomEdge) angle = (Math.random() * Math.PI/2) - Math.PI/4; // Head up-right (-45 to 45 degrees)
      else angle = Math.random() * 2 * Math.PI; // Random direction
      
      this.stuckCounter = 0;
    } else if (isCrowded && !targetPlant) {
      // If crowded and no immediate food, move away from crowd
      // Calculate direction away from crowd center
      let crowdCenterX = 0, crowdCenterY = 0, crowdCount = 0;
      
      for (let other of organisms) {
        if (other !== this) {
          const dist = Math.hypot(this.x - other.x, this.y - other.y);
          if (dist < 50) { // Larger radius for crowd center calculation
            crowdCenterX += other.x;
            crowdCenterY += other.y;
            crowdCount++;
          }
        }
      }
      
      if (crowdCount > 0) {
        crowdCenterX /= crowdCount;
        crowdCenterY /= crowdCount;
        // Move away from crowd center
        angle = Math.atan2(this.y - crowdCenterY, this.x - crowdCenterX);
      } else {
        angle = Math.random() * 2 * Math.PI; // Random dispersal direction
      }
      this.lastDirection = angle;
    } else if (targetPlant) {
      // Always prioritize plants when found, especially when hungry
      angle = Math.atan2(targetPlant.y - this.y, targetPlant.x - this.x);
      this.lastDirection = angle;
    } else if (isHungry) {
      // When hungry and no plants visible, search more aggressively
      // Add bias away from edges when hungry
      if (nearAnyEdge) {
        // Move away from edges when hungry - fix the convergence issue
        let escapeAngle = 0;
        if (nearLeftEdge && nearTopEdge) escapeAngle = Math.PI/4; // Southeast
        else if (nearRightEdge && nearTopEdge) escapeAngle = 3*Math.PI/4; // Southwest
        else if (nearLeftEdge && nearBottomEdge) escapeAngle = -Math.PI/4; // Northeast
        else if (nearRightEdge && nearBottomEdge) escapeAngle = -3*Math.PI/4; // Northwest
        else if (nearLeftEdge) escapeAngle = 0; // East
        else if (nearRightEdge) escapeAngle = Math.PI; // West
        else if (nearTopEdge) escapeAngle = Math.PI/2; // South
        else if (nearBottomEdge) escapeAngle = -Math.PI/2; // North
        
        angle = escapeAngle + (Math.random() - 0.5) * Math.PI/3; // Add some randomness
      } else {
        const searchAngle = this.lastDirection + (Math.random() - 0.5) * Math.PI; // Wider search
        angle = searchAngle;
      }
      this.lastDirection = angle;
    } else {
      // Normal behavior when energy is sufficient - but disable trail following for now
      // const trailDirection = this.findTrailDirection(trailGrid);
      // if (trailDirection !== null) {
      //   angle = trailDirection;
      //   this.lastDirection = angle;
      // } else {
        // More randomness to prevent clustering - add extra dispersal
        let randomness = nearAnyEdge ? 1.5 : this.genes.randomness * 2; 
        
        // Add extra dispersal if organism has been moving in nearly the same direction
        // Check if direction hasn't changed much recently (using direction change timer)
        if (this.directionChangeTimer > 60) { // If no significant direction change for 1 second
          randomness *= 1.5; // Increase randomness
        }
        
        angle = this.lastDirection + (Math.random() - 0.5) * randomness;
        this.lastDirection = angle;
      // }
    }
  
    // Bewegung - move faster when hungry
    const speedMultiplier = isHungry ? 1.3 : 1.0;
    let dx = Math.cos(angle) * this.genes.speed * speedMultiplier;
    let dy = Math.sin(angle) * this.genes.speed * speedMultiplier;
    
    // Safety check: ensure movement is not zero
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
      // If movement is essentially zero, force a random direction
      const randomAngle = Math.random() * 2 * Math.PI;
      dx = Math.cos(randomAngle) * this.genes.speed * speedMultiplier;
      dy = Math.sin(randomAngle) * this.genes.speed * speedMultiplier;
      this.lastDirection = randomAngle;
    }
    
    // Proposed new position
    let newX = this.x + dx;
    let newY = this.y + dy;
    
    // Much better boundary handling - proper reflection with randomness to prevent stuck
    if (newX < 10) {
      newX = 10;
      this.lastDirection = Math.PI - this.lastDirection + (Math.random() - 0.5) * 0.5; // Add randomness to reflection
    } else if (newX > 790) {
      newX = 790;
      this.lastDirection = Math.PI - this.lastDirection + (Math.random() - 0.5) * 0.5; // Add randomness to reflection
    }
    
    if (newY < 10) {
      newY = 10;
      this.lastDirection = -this.lastDirection + (Math.random() - 0.5) * 0.5; // Add randomness to reflection
    } else if (newY > 590) {
      newY = 590;
      this.lastDirection = -this.lastDirection + (Math.random() - 0.5) * 0.5; // Add randomness to reflection
    }
    
    this.x = newX;
    this.y = newY;
    this.energy -= 0.1;
    
    // Failsafe: If organism hasn't moved for a very long time, force random movement
    if (this.stuckCounter > 100) {
      this.lastDirection = Math.random() * 2 * Math.PI;
      this.stuckCounter = 0;
      console.log("Organism forced unstuck at", this.x, this.y);
    }
  
    // Only leave trail when not in survival mode to save energy
    if (!isHungry) {
      this.leaveTrail(trailGrid);
    }
  }

  findClosestPlant(plants) {
    let closest = null;
    // Expand vision when hungry to find food more effectively
    const isHungry = this.energy < 50;
    const visionRange = isHungry ? this.genes.vision * 1.5 : this.genes.vision;
    let closestDist = visionRange;
  
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

  // Check if organism is in a crowded area (too many neighbors)
  isCrowded(organisms) {
    const crowdRadius = 30;
    let neighborCount = 0;
    
    for (let other of organisms) {
      if (other !== this) {
        const dist = Math.hypot(this.x - other.x, this.y - other.y);
        if (dist < crowdRadius) {
          neighborCount++;
        }
      }
    }
    
    return neighborCount > 3; // Crowded if more than 3 neighbors nearby
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
      this.energy >= 50 && // Only reproduce when energy is above survival threshold
      partner.energy >= 50 && // Both partners need sufficient energy
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
    if (x >= 0 && x < 800 && y >= 0 && y < 600 && trailGrid[x] && trailGrid[x][y]) {
      const hue = parseFloat(this.color.match(/hsl\((\d+)/)?.[1]) || 0;
      trailGrid[x][y] = { hue, intensity: 1.0 };
    }
  }

  findTrailDirection(trailGrid) {
    // Only follow trails if no plants are nearby and we're not near edges
    if (this.x < 50 || this.x > 750 || this.y < 50 || this.y > 550) {
      return null; // Don't follow trails near edges
    }
    
    const maxTrailVision = 8; // Reduce search radius for better performance
    const vision = Math.min(maxTrailVision, Math.floor(this.genes.vision / 5)); // Scale down vision for trails
    const hue = parseFloat(this.color.match(/hsl\((\d+)/)?.[1]) || 0;
  
    let bestX = null;
    let bestY = null;
    let bestStrength = 0;
  
    // Sample fewer points for better performance
    const step = Math.max(1, Math.floor(vision / 3));
    
    for (let dx = -vision; dx <= vision; dx += step) {
      for (let dy = -vision; dy <= vision; dy += step) {
        const tx = Math.floor(this.x + dx);
        const ty = Math.floor(this.y + dy);
        if (
          tx >= 0 && tx < 800 && ty >= 0 && ty < 600 &&
          trailGrid[tx] &&
          trailGrid[tx][ty] &&
          trailGrid[tx][ty].intensity > 0.3 // Only consider stronger trails
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
  
    // Only follow trail if it's significantly strong
    if (bestX !== null && bestY !== null && bestStrength > 0.5) {
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
    const isHungry = this.energy < 50;
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Add visual indicator for hungry organisms
    if (isHungry) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 2, 0, Math.PI * 2);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.fillStyle = "#000";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.fillText(Math.floor(this.energy), this.x, this.y - this.size - 4);
  }
}