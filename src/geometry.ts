import {Vector2} from './vector2';
import * as PIXI from "pixi.js";

export class Point {
    position: Vector2
    graphics: PIXI.Graphics

    constructor(x: number, y: number) {
        this.position = new Vector2(x, y);
        this.graphics = new PIXI.Graphics();
    }

    draw(): void {
        this.clear();
        this.graphics.beginFill(0x0f0f0f);
        this.graphics.drawCircle(this.position.x, this.position.y, 2);
        this.graphics.endFill();
    }

    clear(): void {
        this.graphics.clear();
    }
}

export class Triangle {
    points: Array<Vector2>
    graphics: PIXI.Graphics
    edges: Array<[Vector2, Vector2]>
    circumCenter: Vector2

    constructor(a: Vector2, b: Vector2, c: Vector2) {
        this.points = new Array<Vector2>(a, b, c);
        this.edges = [[a, b], [b, c], [c, a]];
        this.circumCenter = this.calculateCircumCenter();
        this.graphics = new PIXI.Graphics();
    }

    get a(): Vector2 { return this.points[0]; }

    get b(): Vector2 { return this.points[1]; }

    get c(): Vector2 { return this.points[2]; }

    calculateCircumCenter(): Vector2 {
        const d: number = 2 * (this.a.x * (this.b.y - this.c.y) + this.b.x * (this.c.y - this.a.y) + this.c.x * (this.a.y - this.b.y));
        const aDot = this.a.dot(this.a);
        const bDot = this.b.dot(this.b);
        const cDot = this.c.dot(this.c);

        let xu: number = aDot * (this.b.y - this.c.y) + bDot * (this.c.y - this.a.y) + cDot * (this.a.y - this.b.y);
        xu /= d;
        let yu: number = aDot * (this.c.x - this.b.x) + bDot * (this.a.x - this.c.x) + cDot * (this.b.x - this.a.x);
        yu /= d;

        return new Vector2(xu, yu);
    }

    pointInCircumCircle(p: Vector2): boolean {
        const r = this.a.dist_to(this.circumCenter);
        return p.dist_to(this.circumCenter) < r;
    }

    sharesPointWith(t: Triangle): boolean {
        return this.hasPoint(t.a) || this.hasPoint(t.b) || this.hasPoint(t.c);
    }

    hasPoint(p: Vector2): boolean {
        return this.a == p || this.b == p || this.c == p;
    }

    draw(): void {
        this.graphics.clear();
        this.graphics.lineStyle(1, 0x0f0f0f, 1);
        this.graphics.moveTo(this.a.x, this.a.y);
        this.graphics.lineTo(this.b.x, this.b.y);
        this.graphics.lineTo(this.c.x, this.c.y);
        this.graphics.lineTo(this.a.x, this.a.y);
    }
}

export function edgesAreEqual(a: [Vector2, Vector2], b: [Vector2, Vector2]) {
    return (a[0] == b[0] && a[1] == b[1]) || (a[0] == b[1] && a[1] == b[0]);
}

export function edgesFromTriangulation(triangulation: Array<Triangle>): Array<[Vector2, Vector2]> {
    const edges: Array<[Vector2, Vector2]> = [];

    for (const t of triangulation) {
        for (const te of t.edges) {
            if (!edges.some(e => edgesAreEqual(te, e))) {
                edges.push(te);
            }
        }
    }

    return edges;
}