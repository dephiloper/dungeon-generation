import { Vector2, Line } from "./geometry";

export function prim(coords: Array<Vector2>): Array<Line> {
    let spanningTree: Array<Line> = [];
    let reached: Array<Vector2> = [];
    let unreached: Array<Vector2> = [...coords];
    let rId: number = 0;
    let uId: number = 0;

    reached.push(unreached[0]);
    unreached.splice(0, 1);

    while (unreached.length > 0) {
        let minDist: number = Number.MAX_SAFE_INTEGER;
        for (let i = 0; i < reached.length; i++) {
            for (let j = 0; j < unreached.length; j++) {
                const dist = reached[i].distSq(unreached[j]);
                if (dist < minDist) {
                    minDist = dist;
                    rId = i;
                    uId = j;
                }
            }
        }

        spanningTree.push(new Line(reached[rId], unreached[uId]));
        reached.push(unreached[uId]);
        unreached.splice(uId, 1);
    }
    return spanningTree;
}