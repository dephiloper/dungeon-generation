import * as PIXI from "pixi.js";
import { Point, Triangle} from "./geometry";
import { bowyerWatson } from "./delaunay"; 

const app: PIXI.Application = new PIXI.Application({ width: 960, height: 540, antialias: true, backgroundColor: 0xb0b0b0, clearBeforeRender: true });
document.body.appendChild(app.view);

const points: Array<Point> = [];
let triangulation: Array<Triangle> = [];

document.body.addEventListener('mousedown', (e) => {
    const p: Point = new Point(e.clientX, e.clientY);
    app.stage.addChild(p.graphics);
    points.push(p);
});

document.body.addEventListener('keydown', (e) => {
    if (e.code != 'Space') return;
    triangulation = bowyerWatson(points.map(p => p.position));
    triangulation.forEach(t => app.stage.addChild(t.graphics));
});

function gameLoop(_delta: number): void {
    for (const point of points) {
        point.draw();
    }
    for (const t of triangulation) {
        t.draw();
    }
}

app.ticker.add(delta => gameLoop(delta));
