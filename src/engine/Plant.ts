import { PlantData } from '../types/index.js';
import { generateId } from '../utils/math.js';

export class Plant implements PlantData {
  public readonly id: string;
  public x: number;
  public y: number;
  public size: number;
  public color: string;

  constructor(x: number, y: number) {
    this.id = generateId();
    this.x = x;
    this.y = y;
    this.size = 3;
    this.color = 'green';
  }

  /**
   * Draw the plant on canvas
   */
  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  /**
   * Get plant data for serialization
   */
  toData(): PlantData {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      size: this.size,
      color: this.color
    };
  }
}
