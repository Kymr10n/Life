import { World } from './classes/World.js';

const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");

const world = new World(canvas, ctx);
world.init();
world.loop();