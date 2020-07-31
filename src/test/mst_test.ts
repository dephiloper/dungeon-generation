import * as PIXI from "pixi.js";
import { Point, Line } from "../geometry";
import { prim } from "../mst";

const app: PIXI.Application = new PIXI.Application({ width: 960, height: 540, antialias: true, backgroundColor: 0xb0b0b0, clearBeforeRender: true });
document.body.appendChild(app.view);

let points: Array<Point> = [];
let edges: Array<Line> = [];

document.body.addEventListener('mousedown', (e) => {
    const p: Point = new Point(e.clientX, e.clientY);
    app.stage.addChild(p.graphics);
    points.push(p);
});

document.body.addEventListener('keydown', (e) => {
    if (e.code != 'Space') return;
    const mst = prim(points.map(p => p.position));
    console.log(edges.length);
    for (const e of mst) {
        app.stage.addChild(e.graphics);
        edges.push(e);
    }
});

function gameLoop(_delta: number): void {
    for (const point of points) {
        point.draw();
    }
    
    for (const edge of edges) {
        edge.draw();
    }
}

app.ticker.add(delta => gameLoop(delta));