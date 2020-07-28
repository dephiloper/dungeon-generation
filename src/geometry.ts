import * as PIXI from "pixi.js";

export class Vector2 {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    equals(o: Vector2): boolean {
        return this.x == o.x && this.y == o.y;
    }

    toString(): string {
        return `{x: ${this.x}, y: ${this.y}}`
    }

    add(o: Vector2): Vector2 {
        return new Vector2(this.x + o.x, this.y + o.y);
    }

    sub(o: Vector2): Vector2 {
        return new Vector2(this.x - o.x, this.y - o.y);
    }

    mul(o: any): Vector2 {
        if (o instanceof Vector2) {
            return new Vector2(this.x * o.x, this.y * o.y);
        } else if (typeof o == 'number') {
            return new Vector2(this.x * o, this.y * o);
        }
        throw new Error(`The type ${typeof o} is not supported.`)
    }

    div(o: any): Vector2 {
        if (o instanceof Vector2) {
            return new Vector2(this.x / o.x, this.y / o.y);
        } else if (typeof o == 'number') {
            return new Vector2(this.x / o, this.y / o);
        }
        throw new Error(`The type ${typeof o} is not supported.`)
    }

    dot(o: Vector2) {
        return this.x * o.x + this.y * o.y;
    }

    distSq(o: Vector2): number {
        return Math.pow(o.x - this.x, 2) + Math.pow(o.y - this.y, 2);
    }

    distTo(o: Vector2): number {
        return Math.sqrt(this.distSq(o));
    }

    normalized() {
        return this.div(this.length());
    }

    length() {
        return Math.sqrt(this.dot(this));
    }

    lengthSq() {
        return Math.pow(this.x, 2) + Math.pow(this.y, 2);
    }

    dirTo(o: Vector2) {
        return o.sub(this).normalized();
    }
}

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

export class Line {
    vertices: [Vector2, Vector2]
    graphics: PIXI.Graphics
    color: number

    constructor(a: Vector2, b: Vector2) {
        this.vertices = [a, b];
        this.graphics = new PIXI.Graphics();
        this.color = 0x00ff00;
    }

    get a(): Vector2 { return this.vertices[0]; }
    get b(): Vector2 { return this.vertices[1]; }

    equals(o: Line) {
        return (this.a.equals(o.a) && this.b.equals(o.b)) || (this.a.equals(o.b) && this.b.equals(o.a));
    }

    draw(): void {
        this.clear();
        this.graphics.lineStyle(2, this.color, 1);
        this.graphics.moveTo(this.a.x, this.a.y);
        this.graphics.lineTo(this.b.x, this.b.y);
    }

    clear(): void {
        this.graphics.clear();
    }
}

export class Triangle {
    points: Array<Vector2>
    graphics: PIXI.Graphics
    edges: Array<Line>
    circumCenter: Vector2

    constructor(a: Vector2, b: Vector2, c: Vector2) {
        this.points = new Array<Vector2>(a, b, c);
        this.edges = [new Line(a, b), new Line(b, c), new Line(c, a)];
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
        const r = this.a.distTo(this.circumCenter);
        return p.distTo(this.circumCenter) < r;
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

export function edgesFromTriangulation(triangulation: Array<Triangle>): Array<Line> {
    const edges: Array<Line> = [];

    for (const t of triangulation) {
        for (const te of t.edges) {
            if (!edges.some(e => te.equals(e))) {
                edges.push(te);
            }
        }
    }

    return edges;
}