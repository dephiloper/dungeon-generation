import * as PIXI from "pixi.js";

export class Room {
    private static ID_COUNT: number = 0;
    id: number = Room.ID_COUNT++;
    position: Vector2;
    width: number;
    height: number;
    graphics: PIXI.Graphics = new PIXI.Graphics();
    isCollided: boolean = false;
    isMainRoom: boolean = false;
    isIntermediate: boolean = false;


    constructor(position: Vector2, width: number, height: number) {
        this.position = position;
        this.width = width;
        this.height = height;
        this.graphics.pivot.x = width / 2;
        this.graphics.pivot.y = height / 2;
    }

    draw() {
        this.graphics.clear();
        this.graphics.lineStyle(1, this.isCollided ? 0xff0000 : 0xffffff);
        this.graphics.beginFill(this.isMainRoom ? 0x006400 : this.isIntermediate ? 0x000064 : 0x0f0f0f, 0.8);
        this.graphics.drawRect(this.position.x, this.position.y, this.width, this.height);
        this.graphics.endFill();

        if (this.isMainRoom) {
            this.graphics.lineStyle(1, 0x00ff00, 1);
            this.graphics.drawCircle(this.position.x + this.width / 2, this.position.y + this.height / 2, 3);
        }
    }

    // http://www.jeffreythompson.org/collision-detection/line-rect.php
    intersectWithLine(o: Line): Array<Vector2> {
        const rx: number = this.position.x - this.width / 2;
        const ry: number = this.position.y - this.height / 2;
        const rw: number = this.width;
        const rh: number = this.height;
        const l: Vector2 = o.intersectsWith(new Line(new Vector2(rx,ry), new Vector2(rx, ry+rh)));
        const r: Vector2 = o.intersectsWith(new Line(new Vector2(rx+rw,ry), new Vector2(rx+rw,ry+rh)));
        const t: Vector2 = o.intersectsWith(new Line(new Vector2(rx,ry), new Vector2(rx+rw,ry)));
        const b: Vector2 = o.intersectsWith(new Line(new Vector2(rx,ry+rh), new Vector2(rx+rw,ry+rh)));

        const intersections: Array<Vector2> = [];

        if (!l.isNaN()) intersections.push(l);
        if (!r.isNaN()) intersections.push(r);
        if (!t.isNaN()) intersections.push(t);
        if (!b.isNaN()) intersections.push(b);

        return intersections;
    }

    checkForCollision(o: Room): boolean {
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

export class Vector2 {
    static NaN = new Vector2(NaN, NaN);
    static ZERO = new Vector2(0, 0);
    static ONE = new Vector2(1, 1);

    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    equals(o: Vector2): boolean {
        return this.x == o.x && this.y == o.y;
    }

    isNaN() : boolean {
        return Number.isNaN(this.x) && Number.isNaN(this.y);
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
    
    cross(o: Vector2) {
        return this.x * o.y - this.y * o.x;
    }
}

export class Point {
    position: Vector2;
    graphics: PIXI.Graphics = new PIXI.Graphics();
    color: number = 0x0f0f0f;
    radius: number = 2;

    constructor(x: number, y: number) {
        this.position = new Vector2(x, y);
    }

    draw(): void {
        this.clear();
        this.graphics.beginFill(this.color);
        this.graphics.drawCircle(this.position.x, this.position.y, this.radius);
        this.graphics.endFill();
    }

    clear(): void {
        this.graphics.clear();
    }
}

export class Line {
    vertices: [Vector2, Vector2];
    graphics: PIXI.Graphics = new PIXI.Graphics();
    color: number = 0x00ff00;

    constructor(a: Vector2, b: Vector2) {
        this.vertices = [a, b];
    }

    get a(): Vector2 { return this.vertices[0]; }
    get b(): Vector2 { return this.vertices[1]; }
    set a(v: Vector2) { this.vertices[0] = v };
    set b(v: Vector2) { this.vertices[1] = v };

    // https://stackoverflow.com/a/565282/10547035
    intersectsWith(o: Line): Vector2 {
        const p = this.a;
        const r = this.b.sub(this.a);
        const q = o.a;
        const s = o.b.sub(o.a);
        const w = q.sub(p);
        const c = r.cross(s);
       
        const t = (w.cross(s)) / c;
        const u = (w.cross(r)) / c;

        if ((Math.abs(c) > 0.001) && (t >= 0 && t < 1) && (u >= 0 && u < 1)) {
            return this.a.add(r.mul(t));
        }

        // TODO: collinear intersection is missing

        return Vector2.NaN;
    }

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