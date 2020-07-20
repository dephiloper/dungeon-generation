import * as PIXI from "pixi.js";

const app: PIXI.Application = new PIXI.Application({width: 600, height: 400, antialias: false, backgroundColor: 0xb0b0b0, clearBeforeRender: true});
document.body.appendChild(app.view);

const TILE_SIZE: number = 4;
const ROOM_MIN_DIM: number = 16;
const ROOM_MAX_DIM: number = 64;
const ROOM_SPAWN_RADIUS: number = 92;
const ROOM_COUNT: number = 32;

class Vector2 {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add(o: Vector2) {
        return new Vector2(this.x + o.x, this.y + o.y);
    }

    sub(o: Vector2) {
        return new Vector2(this.x - o.x, this.y - o.y);
    }

    distSq(o: Vector2) {
        return Math.pow(o.x - this.x, 2) + Math.pow(o.y - this.y, 2);
    }

    dist(o: Vector2) {
        return Math.sqrt(this.distSq(o));
    }
}

class Room {
    width: number;
    height: number;
    position: Vector2;
    graphics: PIXI.Graphics;
    constructor(position: Vector2, width: number, height: number) {
        this.width = width;
        this.height = height;
        this.position = position;
        this.graphics = new PIXI.Graphics();
        app.stage.addChild(this.graphics);
        this.draw();
    }

    draw() {
        this.graphics.clear();
        this.graphics.lineStyle(1, 0xffffff);
        this.graphics.beginFill(0x0f0f0f);
        this.graphics.drawRect(this.position.x, this.position.y, this.width, this.height);
        this.graphics.endFill();
    }

    checkForCollision(o: Room) {
        const l1 = this.position.add(new Vector2(-this.width / 2, this.height / 2));
        const r1 = this.position.add(new Vector2(this.width / 2, -this.height / 2));
        const l2 = o.position.add(new Vector2(-o.width / 2, o.height / 2));
        const r2 = o.position.add(new Vector2(o.width / 2, -o.height / 2));
        
        if (l1.x >= r2.x || l2.x >= r1.x) 
            return false; 
      
        // If one rectangle is above other 
        if (l1.y <= r2.y || l2.y <= r1.y) 
            return false; 
      
        return true; 
    }
}

let rooms: Array<Room> = [];


function roundm(n: number, m: number): number {
    return Math.floor((n + m - 1) / 2) * 2;
}

// https://stackoverflow.com/questions/5837572/generate-a-random-point-within-a-circle-uniformly/50746409#50746409
// even though this is well explained, didn't understand it fully
function generatePositionsWithinCircle(center: Vector2, radius: number, n: number): Vector2[] {
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

function randValueWithBounds(min: number, max: number): number {
    let dim = min + Math.random() * (max - min);
    return roundm(dim, TILE_SIZE);
}

function generateRooms(points: Vector2[]): Array<Room> {
    const rooms: Array<Room> = [];
    points.forEach(p => {
        const room = new Room(p, randValueWithBounds(ROOM_MIN_DIM, ROOM_MAX_DIM), randValueWithBounds(ROOM_MIN_DIM, ROOM_MAX_DIM));
        rooms.push(room);
    });

    return rooms;
}

function setup() {
    const points = generatePositionsWithinCircle(new Vector2(app.view.width / 2, app.view.height / 2), ROOM_SPAWN_RADIUS, ROOM_COUNT);
    rooms = generateRooms(points);
    app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta: number) {
    const sorted = rooms.sort((a: Room,b: Room): number => {
        return a.position.distSq(b.position);
    });

    for (let i = 0; i < sorted.length; i++) {
        for (let j = 0; j < sorted.length; j++) {
            if (i == j) continue;

            if (sorted[i].checkForCollision(sorted[j])) {
            }
        }

        sorted[i].draw();
    }
}

setup();