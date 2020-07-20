import * as PIXI from "pixi.js";

const app: PIXI.Application = new PIXI.Application({width: 600, height: 400, antialias: false, backgroundColor: 0xb0b0b0, clearBeforeRender: true});
document.body.appendChild(app.view);
const TILE_SIZE: number = 2;
const ROOM_MIN_DIM: number = 16;
const ROOM_MAX_DIM: number = 64;
const ROOM_SPAWN_RADIUS: number = 128;
const ROOM_COUNT: number = 32;

class Vector2 {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

function roundm(n: number, m: number): number {
    return Math.floor((n + m - 1) / 2) * 2;
}

// https://stackoverflow.com/questions/5837572/generate-a-random-point-within-a-circle-uniformly/50746409#50746409
// even though this is well explained, didn't understand it fully
function generatePoinsWithinCircle(center: Vector2, radius: number, n: number): Vector2[] {
    const points = [];
    
    for (let i = 0; i < n; i++) {
        const r = radius * Math.sqrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;
        let x = center.x + r * Math.cos(theta);
        let y = center.y + r * Math.sin(theta);
        x = roundm(x, TILE_SIZE);
        y = roundm(y, TILE_SIZE);
        points.push(new Vector2(x,y));
    }
    
    return points;
}

function randomDimension(min: number, max: number): number {
    let dim = min + Math.random() * (max - min);
    return roundm(dim, TILE_SIZE);
}

function setup() {
    const points = generatePoinsWithinCircle(new Vector2(app.view.width / 2, app.view.height / 2), ROOM_SPAWN_RADIUS, ROOM_COUNT);
    points.forEach(p => {
        let square = new PIXI.Graphics();
        square.lineStyle(1, 0xffffff);
        square.drawRect(p.x, p.y, randomDimension(ROOM_MIN_DIM, ROOM_MAX_DIM), randomDimension(ROOM_MIN_DIM, ROOM_MAX_DIM))
        app.stage.addChild(square);

    });
    app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(_delta: number) {
    
}

setup();