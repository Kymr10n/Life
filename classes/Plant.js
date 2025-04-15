export class Plant {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = 3;
      this.color = "green";
    }
  
    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }  