export class Vector2 {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
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

    dist_to(o: Vector2): number {
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

    dir_to(o: Vector2) {
        return o.sub(this).normalized();
    }
}