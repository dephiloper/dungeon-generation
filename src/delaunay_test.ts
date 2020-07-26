import * as PIXI from "pixi.js";
import { edgesFromTriangulation, Point, Triangle } from "./geometry";
import { bowyerWatson } from "./delaunay";
import { Vector2 } from "./vector2";

const app: PIXI.Application = new PIXI.Application({ width: 960, height: 540, antialias: true, backgroundColor: 0xb0b0b0, clearBeforeRender: true });
document.body.appendChild(app.view);

let points: Array<Point> = [];
let triangulation: Array<Triangle> = [];

document.body.addEventListener('mousedown', (e) => {
    const p: Point = new Point(e.clientX, e.clientY);
    app.stage.addChild(p.graphics);
    points.push(p);
});

document.body.addEventListener('keydown', (e) => {
    if (e.code != 'Space') return;
    
    triangulation = bowyerWatson(points.map(p => p.position));
    let edges: Array<[Vector2, Vector2]> = edgesFromTriangulation(triangulation);
    for (const e of edges) {
        const line = new PIXI.Graphics();
        line.lineStyle(2, 0xff0000);
        line.moveTo(e[0].x, e[0].y);
        line.lineTo(e[1].x, e[1].y);
        app.stage.addChild(line);
    }
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

