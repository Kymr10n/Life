const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");

const ORGANISM_COUNT = 20;
const ORGANISM_SIZE = 5;

class Organism {
  constructor(x, y, energy = 50, color = null) {
    this.x = x;
    this.y = y;
    this.energy = energy;
    this.color = color || `hsl(${Math.random() * 360}, 70%, 50%)`;
  }

  move() {
    const dx = Math.random() * 10 - 5;
    const dy = Math.random() * 10 - 5;
    this.x += dx;
    this.y += dy;
    this.energy -= 0.5;

    // Begrenzung am Rand
    this.x = Math.max(0, Math.min(canvas.width, this.x));
    this.y = Math.max(0, Math.min(canvas.height, this.y));
  }

  maybeReproduce(organisms) {
    if (this.energy >= 100) {
      this.energy /= 2; // Energie halbieren bei Reproduktion
      const childX = this.x + Math.random() * 20 - 10;
      const childY = this.y + Math.random() * 20 - 10;

      // Mutation: kleine Variation in Farbe (Hue-Wert leicht verschieben)
      const childColor = mutateColor(this.color);

      organisms.push(new Organism(childX, childY, this.energy, childColor));
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, ORGANISM_SIZE, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.fillText(Math.floor(this.energy), this.x, this.y - ORGANISM_SIZE - 4);
  }

  isDead() {
    return this.energy <= 0;
  }
}

// Hilfsfunktion für Farbanpassung (Mutation)
function mutateColor(hsl) {
  const hue = parseFloat(hsl.match(/hsl\((\d+)/)?.[1]) || 0;
  const newHue = (hue + (Math.random() * 40 - 20) + 360) % 360;
  return `hsl(${newHue}, 70%, 50%)`;
}

let organisms = [];

function init() {
  for (let i = 0; i < ORGANISM_COUNT; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    organisms.push(new Organism(x, y));
  }
}

function update() {
  // Kopie des Arrays, da wir während der Iteration das Original verändern
  const newOrganisms = [];

  for (let org of organisms) {
    org.move();
    org.maybeReproduce(newOrganisms);
  }

  // Entferne tote Organismen, füge neue hinzu
  organisms = organisms.filter(o => !o.isDead());
  organisms.push(...newOrganisms);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  organisms.forEach(org => org.draw());
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

init();
loop();