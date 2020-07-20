import * as PIXI from "pixi.js";
import { Vector2 } from "./vec";

const app: PIXI.Application = new PIXI.Application({width: 960, height: 540, antialias: false, backgroundColor: 0xb0b0b0, clearBeforeRender: true});
document.body.appendChild(app.view);

const TILE_SIZE: number = 4;
const ROOM_MIN_DIM: number = 8;
const ROOM_MAX_DIM: number = 64;
const ROOM_SPAWN_RADIUS: number = 92;
const ROOM_COUNT: number = 64;


class Room {
    width: number;
    height: number;
    position: Vector2;
    graphics: PIXI.Graphics;
    collided: boolean;
    constructor(position: Vector2, width: number, height: number) {
        this.collided = false;
        this.width = width;
        this.height = height;
        this.position = position;
        this.graphics = new PIXI.Graphics();
        this.graphics.pivot.x = width / 2;
        this.graphics.pivot.y = height / 2;
        app.stage.addChild(this.graphics);
    }

    draw() {
        this.graphics.clear();
        this.graphics.lineStyle(1, this.collided ? 0xff0000 : 0xffffff);
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
// collision test
// let a = new Room(new Vector2(100, 100), 40, 40);
// let b = new Room(new Vector2(200, 200), 40, 40);
// document.onmousemove = (event) => {
//     b.position = new Vector2(event.clientX, event.clientY);
// }

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

async function generateRooms(points: Vector2[]): Promise<Array<Room>> {
    const rooms: Array<Room> = [];
    for (const p of points) {
        const room = new Room(p, randValueWithBounds(ROOM_MIN_DIM, ROOM_MAX_DIM), randValueWithBounds(ROOM_MIN_DIM, ROOM_MAX_DIM));
        room.draw();
        await new Promise(resolve => setTimeout(resolve, 50));
        rooms.push(room);
        console.log("room");
    }

    return rooms;
}

async function setup() {
    const points = generatePositionsWithinCircle(new Vector2(app.view.width / 2, app.view.height / 2), ROOM_SPAWN_RADIUS, ROOM_COUNT);
    rooms = await generateRooms(points);
    app.ticker.add(delta => gameLoop(delta));
    // app.ticker.add(delta => collisionTest(delta));

}

function gameLoop(delta: number) {
    const sorted = rooms.sort((a: Room,b: Room): number => {
        return a.position.distSq(b.position);
    });

    for (let i = 0; i < sorted.length; i++) {
        sorted[i].collided = false;
        for (let j = 0; j < sorted.length; j++) {
            if (i == j) continue;

            if (sorted[i].checkForCollision(sorted[j])) {
                sorted[i].collided = true;
                const dir = sorted[j].position.dir_to(sorted[i].position);
                sorted[i].position = sorted[i].position.add(dir.mul(delta*2));
                sorted[i].position = sorted[i].position.add(new Vector2(Math.random() - 0.5, Math.random() - 0.5).mul(1.5))
            }
        }

        sorted[i].draw();
    }
}

// function collisionTest(delta: number) {
//     a.collided = false;
//     b.collided = false;

//     if (a.checkForCollision(b)) {
//         a.collided = true;
//     }

//     if (b.checkForCollision(a)) {
//         b.collided = true;
//     }

//     a.draw();
//     b.draw();
// }

setup();