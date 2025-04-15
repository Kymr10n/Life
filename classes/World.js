import { Organism } from './Organism.js';
import { Plant } from './Plant.js';

export class World {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.organisms = [];
    this.plants = [];
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
        org.move(this.plants); // <-- NEU: Pflanzen mitgeben
        org.tryToEat(this.plants);
        org.maybeReproduce(newOrganisms);
    }

    // Entferne Tote & füge neue hinzu
    this.organisms = this.organisms.filter(o => !o.isDead());
    this.organisms.push(...newOrganisms);

    // Zufällig neue Pflanzen wachsen lassen
    if (Math.random() < 0.05) {
      this.spawnPlant();
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let plant of this.plants) {
      plant.draw(this.ctx);
    }

    for (let org of this.organisms) {
      org.draw(this.ctx);
    }
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}