export class Stats {
    constructor() {
      this.history = [];
    }
  
    update(organisms) {
      if (organisms.length === 0) return;
  
      let total = { speed: 0, vision: 0, randomness: 0 };
  
      for (let o of organisms) {
        total.speed += o.genes.speed;
        total.vision += o.genes.vision;
        total.randomness += o.genes.randomness;
      }
  
      this.history.push({
        speed: total.speed / organisms.length,
        vision: total.vision / organisms.length,
        randomness: total.randomness / organisms.length
      });
  
      if (this.history.length > 200) this.history.shift(); // nur die letzten 200 Ticks
    }
  
    drawChart() {
      const canvas = document.getElementById("chart");
      const ctx = canvas.getContext("2d");
  
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      const colors = { speed: "red", vision: "blue", randomness: "green" };
  
      const keys = ["speed", "vision", "randomness"];
  
      keys.forEach((key, i) => {
        ctx.beginPath();
        ctx.strokeStyle = colors[key];
        this.history.forEach((val, x) => {
          const y = canvas.height - val[key] * 10; // skaliert
          if (x === 0) ctx.moveTo(x * 4, y);
          else ctx.lineTo(x * 4, y);
        });
        ctx.stroke();
      });
    }
  }  