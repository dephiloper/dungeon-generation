import * as PIXI from "pixi.js";
import { Point, Line, Vector2, Room } from "../geometry";

const app: PIXI.Application = new PIXI.Application({ width: 960, height: 540, antialias: true, backgroundColor: 0xb0b0b0, clearBeforeRender: true });
document.body.appendChild(app.view);
app.stage.interactive = true;

const points: Array<Point> = [];
const l = new Line(new Vector2(100, 100), new Vector2(200, 200));
l.color = 0xff0000;
const r = new Room(new Vector2(400, 400), 128, 128);

app.stage.addChild(r.graphics);
app.stage.addChild(l.graphics);
for (let i = 0; i < 4; i++) {
    const p = new Point(0, 0);
    p.color = 0xff0000;
    p.radius = 5;
    app.stage.addChild(p.graphics);
    points.push(p);
}

app.stage.on("pointermove", (e: any) => {
    l.b = new Vector2(e.data.global.x, e.data.global.y);
});

function gameLoop(_delta: number): void {
    points.forEach(p => p.graphics.visible = false);
    const intersections = r.intersectWithLine(l);
    if (intersections.length > 0) {
        for (let i = 0; i < intersections.length; i++) {
            points[i].position = intersections[i];
            points[i].draw();
            points[i].graphics.visible = true;
        }
    }
    l.draw();
    r.draw();
}

app.ticker.add(delta => gameLoop(delta));