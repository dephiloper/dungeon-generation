import * as PIXI from "pixi.js";
import { bowyerWatson } from "./delaunay";
import { Vector2, Room, Triangle, Line, edgesFromTriangulation } from "./geometry";
import { prim } from "./mst";

const app: PIXI.Application = new PIXI.Application({ width: 960, height: 540, antialias: true, backgroundColor: 0xb0b0b0 });
document.body.appendChild(app.view);

const TILE_SIZE: number = 2;
const ROOM_MIN_DIM: number = 8;
const ROOM_MAX_DIM: number = 48;
const ROOM_SPAWN_RADIUS: number = 48;
const ROOM_COUNT: number = 128;
const MAIN_ROOM_COUNT: number = 12;
const MAIN_ROOM_DIST: number = 64;
const STAGE_PAUSE: number = 1000;
const STAGE_STEP_PAUSE: number = 100;
const READD_EDGE_COUNT: number = 2;

enum State {
    RoomGeneration,
    RoomSeparation,
    MainRoomPicking,
    Triangulation,
    SpanningTree,
    HallwayRouting,
    HallwayGeneration
}

let rooms: Array<Room> = [];
let coords: Array<Vector2> = [];
let edges: Array<Line> = [];
let connections: Array<Line> = [];
let removeEdges: Array<Line> = [];
let mainRooms: Array<Room> = [];
let tempIndex: number = 0;
let generationState: State = State.RoomGeneration;
let stateChanged: boolean = true;
let elapsedTime: number = 0.0;

function roundm(n: number, m: number): number {
    return Math.round(n / m) * m;
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
        room.graphics.visible = false;
        app.stage.addChild(room.graphics);
    }

    return rooms;
}

async function setup() {
    app.ticker.add(delta => gameLoop(delta));
}

function roomGeneration(_delta: number): void {
    if (stateChanged) {
        if (elapsedTime >= STAGE_PAUSE * 2) {
            stateChanged = false;
            coords = generatePositionsWithinCircle(new Vector2(app.view.width / 2, app.view.height / 2), ROOM_SPAWN_RADIUS, ROOM_COUNT);
            rooms = generateRooms(coords);
            elapsedTime = 0.0;
        }
    } else {
        if (elapsedTime >= STAGE_STEP_PAUSE / 10) {
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
        if (elapsedTime >= STAGE_PAUSE) {
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
                    const dir = rooms[j].position.dirTo(rooms[i].position);
                    let newPosition = rooms[i].position.add(dir.mul(delta * 2));
                    newPosition = newPosition.add(new Vector2(Math.random() - 0.5, Math.random() - 0.5).mul(2.5));
                    rooms[i].position = newPosition;
                    rooms[i].position.x = roundm(newPosition.x, TILE_SIZE);
                    rooms[i].position.y = roundm(newPosition.y, TILE_SIZE);
                } 
            }
        }
        tempIndex++;

        if (rooms.every(r => !r.isCollided)) {
            generationState = State.MainRoomPicking;
            stateChanged = true;
            elapsedTime = 0.0;
            tempIndex = 0;
            console.log(rooms);
        }
    }
}

function mainRoomPicking(_delta: number): void {
    if (stateChanged) {
        if (elapsedTime >= STAGE_PAUSE) {
            const sorted = rooms.sort((a, b) => b.width * b.height - a.width * a.height);
            mainRooms.push(sorted[0]);
            for (const s of sorted) {
                if (!mainRooms.some(m => m.position.distTo(s.position) < MAIN_ROOM_DIST)) {
                    mainRooms.push(s);
                    if (mainRooms.length == MAIN_ROOM_COUNT) break;
                }
            }
            stateChanged = false;
            elapsedTime = 0.0;
        }
    } else {
        if (elapsedTime >= STAGE_STEP_PAUSE) {
            mainRooms[tempIndex++].isMainRoom = true;
        }
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
        if (elapsedTime >= STAGE_PAUSE) {
            stateChanged = false;
            rooms.filter(r => !mainRooms.includes(r)).forEach(r => r.graphics.alpha = 0.2);
            const mainCoords: Array<Vector2> = mainRooms.map(r => r.position);
            let triangulation: Array<Triangle> = bowyerWatson(mainCoords);
            edges = edgesFromTriangulation(triangulation);
            elapsedTime = 0.0;
            tempIndex = 0;
        }
    } else {
        if (elapsedTime >= STAGE_STEP_PAUSE) {
            app.stage.addChild(edges[tempIndex].graphics);
            edges[tempIndex].draw();
            elapsedTime = 0.0;
            tempIndex++;
        }

        if (tempIndex == edges.length) {
            generationState = State.SpanningTree;
            stateChanged = true;
            elapsedTime = 0.0;
            tempIndex = 0;
        }
    }
}

function spanningTree(_delta: number): void {
    if (stateChanged) {
        if (elapsedTime >= STAGE_PAUSE) {
            stateChanged = false;
            mainRooms = rooms.filter(r => r.isMainRoom);
            let mstEdges = prim(mainRooms.map(r => r.position));

            for (const e of edges) {
                let included: boolean = false;
                for (const m of mstEdges) {
                    if (e.equals(m)) {
                        included = true;
                        break;
                    }
                }

                if (!included) {
                    removeEdges.push(e);
                }
            }

            // readd edges to allow alternative paths
            for (let i = 0; i < READD_EDGE_COUNT; i++) {
                removeEdges.splice(Math.floor(Math.random() * removeEdges.length), 1);
            }
            edges = edges.filter(e => !removeEdges.includes(e));

            tempIndex = 0;
            elapsedTime = 0.0;
        }
    } else {
        if (elapsedTime >= STAGE_STEP_PAUSE) {
            app.stage.removeChild(removeEdges[tempIndex++].graphics);
            elapsedTime = 0.0;
        }

        if (tempIndex == removeEdges.length) {
            generationState = State.HallwayRouting;
            stateChanged = true;
            elapsedTime = 0.0;
            tempIndex = 0;
        }
    }
}

function hallwayRouting(_delta: number): void {
    if (stateChanged) {
        if (elapsedTime >= STAGE_PAUSE) {
            stateChanged = false;
            const center = new Vector2(app.view.width / 2, app.view.height / 2);
            for (const e of edges) {
                // choose route depending on the route
                let a: Vector2 = e.a;
                let b: Vector2 = e.b;

                if (a.distSq(center) < b.distSq(center)) {
                    const temp: Vector2 = a;
                    a = b;
                    b = temp;
                }

                const l1 = new Line(a, new Vector2(a.x, b.y));
                const l2 = new Line(new Vector2(a.x, b.y), b);
                l1.color = 0xff0000;
                l2.color = 0xff0000;

                if (Math.abs(a.x - center.x) > Math.abs(a.y - center.y)) {
                    l1.b = new Vector2(b.x, a.y);
                    l2.a = new Vector2(b.x, a.y);
                }

                connections.push(l1);
                connections.push(l2);
            }
            tempIndex = 0;
            elapsedTime = 0.0;
        }
    } else {
        if (tempIndex == connections.length) {
            if (elapsedTime >= STAGE_PAUSE) {
                generationState = State.HallwayGeneration;
                elapsedTime = 0.0;
                tempIndex = 0;
                stateChanged = true;

                let unusedRooms = rooms.filter(r => !r.isMainRoom && !r.isIntermediate);
                unusedRooms.forEach(r => app.stage.removeChild(r.graphics));
                rooms = rooms.filter(r => !unusedRooms.includes(r));
            }
        }
        else if (elapsedTime >= STAGE_STEP_PAUSE) {
            const l = connections[tempIndex];
            app.stage.addChild(l.graphics);

            for (const r of rooms.filter(r => !r.isMainRoom)) {
                const intersects = r.intersectWithLine(l);
                if (intersects.length > 0) {
                    r.isIntermediate = true;
                    r.graphics.alpha = 1.0;
                }
            }

            if (tempIndex < edges.length) {
                const e = edges[tempIndex];
                app.stage.removeChild(e.graphics);
            }
            tempIndex++;
            elapsedTime = 0.0;
        }
    }
}

function hallwayGeneration(_delta: number): void {
    if (stateChanged) {
        if (elapsedTime >= STAGE_PAUSE) {
            stateChanged = false;
            tempIndex = 0;
            elapsedTime = 0.0;
        }
    } else {
        if (tempIndex == connections.length) {
            if (elapsedTime >= STAGE_PAUSE) {
                connections.forEach(c => app.stage.removeChild(c.graphics));
                generationState = State.HallwayGeneration;
                elapsedTime = 0.0;
                tempIndex = 0;
            }
        }
        else if (elapsedTime >= STAGE_STEP_PAUSE) {
            const c = connections[tempIndex];
            let dir = c.a.dirTo(c.b);
            let width = dir.x == 0 ? 8 : 2;
            let height = dir.y == 0 ? 8 : 2;

            for (let i = 1; i < c.length(); i += 2) {
                let r = new Room(c.a.add(dir.mul(i)), width, height);
                if (!rooms.some(room => room.checkForCollision(r))) {
                    app.stage.addChild(r.graphics);
                    r.isHallway = true;
                    rooms.push(r);
                }
            }
            tempIndex++;
            elapsedTime = 0.0;
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
            spanningTree(delta);
            break;
        case State.HallwayRouting:
            hallwayRouting(delta);
            break;
        case State.HallwayGeneration:
            hallwayGeneration(delta);
            break;
    }

    for (const r of rooms) {
        r.draw();
    }

    for (const l of connections) {
        l.draw();
    }

    elapsedTime += app.ticker.elapsedMS;
}

setup();