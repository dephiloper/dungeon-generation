import { Vector2, Triangle, Line } from "./geometry";

export function bowyerWatson(coords: Array<Vector2>): Array<Triangle> {
    // pointList is a set of coordinates defining the points to be triangulated
    let triangulation: Array<Triangle> = []; // empty triangle mesh data structure
    // must be large enough to completely contain all the points in pointList
    const superTriangle: Triangle = generateSuperTriangle(coords);
    triangulation.push(superTriangle);

    // add all the points one at a time to the triangulation
    for (const c of coords) {
        let badTriangles: Array<Triangle> = [];
        // first find all the triangles that are no longer valid due to the insertion
        for (const t of triangulation) {
            if (t.pointInCircumCircle(c)) {
                badTriangles.push(t);
            }
        }
        let polygon: Array<Line> = [];
        for (const t of badTriangles) { // find the boundary of the polygonal hole
            for (const e of t.edges) { // loop over every bad triangle
                let shared = false;
                for (const ot of badTriangles) { // loop over every other bad triangle
                    if (t == ot) continue;
                    for (const oe of ot.edges) {
                        if (e.equals(oe)) {
                            shared = true;
                        }
                    }
                }
                if (!shared) polygon.push(e);
            }
        }
        triangulation = triangulation.filter((t) => !badTriangles.includes(t)); // get all triangles that are not inside bad triangles
        
        for (const e of polygon) { // re-triangulate the polygonal hole
            triangulation.push(new Triangle(e.a, e.b, c));
        }
    }
    triangulation = triangulation.filter((t) => !t.sharesPointWith(superTriangle)); // done inserting points, now clean up
    return triangulation;
}

export function generateSuperTriangle(coords: Array<Vector2>): Triangle {
    let min = new Vector2(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    let max = new Vector2(0, 0);

    for (const p of coords) {
        if (p.x > max.x)
            max.x = p.x;
        if (p.x < min.x)
            min.x = p.x;
        if (p.y > max.y)
            max.y = p.y;
        if (p.y < min.y)
            min.y = p.y;
    }
    max = max.add(new Vector2(100,100));
    min = min.sub(new Vector2(100,100));
    let lenX: number = max.x - min.x;
    let lenY: number = max.y - min.y;

    let a = min;
    let b = a.add(new Vector2(0, lenX + lenY));
    let c = a.add(new Vector2(lenX + lenY, 0));
    return new Triangle(a, b, c);
}