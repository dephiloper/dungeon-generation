import * as PIXI from "pixi.js";
import { bowyerWatson } from "./delaunay";
import { Triangle, edgesFromTriangulation } from "./geometry";
import { Vector2 } from "./vector2";

const app: PIXI.Application = new PIXI.Application({ width: 960, height: 540, antialias: false, backgroundColor: 0xb0b0b0, clearBeforeRender: true });
document.body.appendChild(app.view);

const TILE_SIZE: number = 4;
const ROOM_MIN_DIM: number = 8;
const ROOM_MAX_DIM: number = 48;
const ROOM_SPAWN_RADIUS: number = 48;
const ROOM_COUNT: number = 128;
const MAIN_ROOM_COUNT: number = 4;

enum State {
    RoomGeneration,
    RoomSeparation,
    MainRoomPicking,
    Triangulation,
    SpanningTree,
    HallwayGeneration
}

class Room {
    private static ID_COUNT: number = 0;
    id: number;
    position: Vector2;
    width: number;
    height: number;
    isCollided: boolean;
    graphics: PIXI.Graphics;
    isMainRoom: boolean;

    constructor(position: Vector2, width: number, height: number) {
        this.id = Room.ID_COUNT++;
        this.position = position;
        this.width = width;
        this.height = height;
        this.isCollided = false;
        this.isMainRoom = false;
        this.graphics = new PIXI.Graphics();
        this.graphics.pivot.x = width / 2;
        this.graphics.pivot.y = height / 2;
        this.graphics.visible = false;
        app.stage.addChild(this.graphics);
    }

    draw() {
        this.graphics.clear();
        this.graphics.lineStyle(1, this.isCollided ? 0xff0000 : 0xffffff);
        this.graphics.beginFill(this.isMainRoom ? 0x006400 : 0x0f0f0f);
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

        if (l1.y <= r2.y || l2.y <= r1.y)
            return false;

        return true;
    }
}

let rooms: Array<Room> = [];
let coords: Array<Vector2> = [];
let edges: Array<[Vector2, Vector2]> = [];
let tempIndex: number = 0;
let generationState: State = State.RoomGeneration;
let stateChanged: boolean = true;
let elapsedTime: number = 0.0;

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
        points.push(new Vector2(x, y));
    }

    return points;
}

function randValueWithBounds(min: number, max: number): number {
    let dim = min + Math.random() * (max - min);
    return roundm(dim, TILE_SIZE);
}

function generateRooms(points: Vector2[]): Array<Room> {
    const rooms: Array<Room> = [];
    for (const p of points) {
        const room = new Room(p, randValueWithBounds(ROOM_MIN_DIM, ROOM_MAX_DIM), randValueWithBounds(ROOM_MIN_DIM, ROOM_MAX_DIM));
        rooms.push(room);
    }

    return rooms;
}

async function setup() {
    app.ticker.add(delta => gameLoop(delta));
}

function roomGeneration(_delta: number): void {
    if (stateChanged) {
        if (elapsedTime >= 1000) {
            stateChanged = false;
            coords = generatePositionsWithinCircle(new Vector2(app.view.width / 2, app.view.height / 2), ROOM_SPAWN_RADIUS, ROOM_COUNT);
            rooms = generateRooms(coords);
            elapsedTime = 0.0;
        }
    } else {
        if (elapsedTime >= 20) {
            rooms[tempIndex++].graphics.visible = true;
            elapsedTime = 0.0;
        }

        if (rooms.every(r => r.graphics.visible)) {
            generationState = State.RoomSeparation;
            stateChanged = true;
            elapsedTime = 0.0;
            tempIndex = 0;
        }
    }
}

function roomSeparation(delta: number): void {
    if (stateChanged) {
        if (elapsedTime >= 500) {
            stateChanged = false;
            elapsedTime = 0.0;
        }
    } else {
        for (let i = 0; i < rooms.length; i++) {
            rooms[i].isCollided = false;
            for (let j = 0; j < rooms.length; j++) {
                if (i == j) continue;

                if (rooms[i].checkForCollision(rooms[j])) {
                    rooms[i].isCollided = true;
                    const dir = rooms[j].position.dir_to(rooms[i].position);
                    rooms[i].position = rooms[i].position.add(dir.mul(delta * 2));
                    rooms[i].position = rooms[i].position.add(new Vector2(Math.random() - 0.5, Math.random() - 0.5).mul(1.5));
                }
            }
        }

        if (rooms.every(r => !r.isCollided)) {
            generationState = State.MainRoomPicking;
            stateChanged = true;
            elapsedTime = 0.0;
            tempIndex = 0;
        }
    }
}

function mainRoomPicking(_delta: number): void {
    if (stateChanged) {
        if (elapsedTime >= 500) {
            stateChanged = false;
            elapsedTime = 0.0;
        }
    } else {
        const sorted = rooms.sort((a, b) => b.width * b.height - a.width * a.height);
        sorted[tempIndex++].isMainRoom = true;
        if (tempIndex == MAIN_ROOM_COUNT) {
            generationState = State.Triangulation;
            stateChanged = true;
            elapsedTime = 0.0;
            tempIndex = 0;
        }
    }
}

function triangulation(_delta: number): void {
    if (stateChanged) {
        if (elapsedTime >= 500) {
            stateChanged = false;
            const mainCoords: Array<Vector2> = rooms.filter(r => r.isMainRoom).map(r => r.position);
            let triangulation: Array<Triangle> = bowyerWatson(mainCoords);
            // triangulation.forEach(t => {
            //     app.stage.addChild(t.graphics);
            //     t.draw();
            // });

            //edges = edgesFromTriangulation(triangulation);
            for (const t of triangulation) {
                edges.push(...t.edges);
            }
            console.log(edges.length);
            elapsedTime = 0.0;
            tempIndex = 0;
        }
    } else {
        if (elapsedTime >= 20) {
            const line = new PIXI.Graphics();
            line.lineStyle(2, 0x000000, 1);
            line.moveTo(edges[tempIndex][0].x, edges[tempIndex][0].y);
            line.lineTo(edges[tempIndex][1].x, edges[tempIndex][1].y);
            app.stage.addChild(line);
            elapsedTime = 0.0;
            tempIndex++;
        }

        if (tempIndex == edges.length -1) {
            generationState = State.SpanningTree;
            stateChanged = true;
            elapsedTime = 0.0;
            tempIndex = 0;
        }
    }
}

function gameLoop(delta: number): void {
    switch (generationState) {
        case State.RoomGeneration:
            roomGeneration(delta);
            break;
        case State.RoomSeparation:
            roomSeparation(delta);
            break;
        case State.MainRoomPicking:
            mainRoomPicking(delta);
            break;
        case State.Triangulation:
            triangulation(delta);
            break;
        case State.SpanningTree:
            break;
        case State.HallwayGeneration:
            break;
    }

    for (let i = 0; i < rooms.length; i++) {
        rooms[i].draw();
    }

    elapsedTime += app.ticker.elapsedMS;
}

setup();