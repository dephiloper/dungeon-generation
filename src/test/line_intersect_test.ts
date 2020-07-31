import * as PIXI from "pixi.js";
import { Point, Line, Vector2 } from "../geometry";

const app: PIXI.Application = new PIXI.Application({ width: 960, height: 540, antialias: true, backgroundColor: 0xb0b0b0, clearBeforeRender: true });
document.body.appendChild(app.view);
app.stage.interactive = true;

const l1 = new Line(new Vector2(300, 300), new Vector2(600, 300));
const p = new Point(0, 0);
p.color = 0xff0000;
p.radius = 5;
l1.color = 0x000000;
const l2 = new Line(new Vector2(600, 200), new Vector2(400, 500));
l2.color = 0x000000;
app.stage.addChild(l1.graphics);
app.stage.addChild(l2.graphics);
app.stage.addChild(p.graphics);

app.stage.on("pointermove", (e: any) => {
    l2.b = new Vector2(e.data.global.x, e.data.global.y);
});

function gameLoop(_delta: number): void {
    l1.draw();
    l2.draw();
    p.graphics.visible = false;
    const intersection = l1.intersectsWith(l2);
    if (!intersection.isNaN()) {
        p.graphics.visible = true;
        p.position = intersection;
    }
    p.draw();
    
}

app.ticker.add(delta => gameLoop(delta));