
// --- KD tree types/helpers ---

import type { Vec3 } from "../rblx/mesh"
import { distance } from "../rblx/mesh-deform"

export class KDNode {
    point: Vec3
    index: number
    axis: number
    left: KDNode | null = null
    right: KDNode | null = null

    constructor(point: Vec3, index: number, axis: number) {
        this.point = point
        this.index = index
        this.axis = axis
    }
}

export function buildKDTree(points: Vec3[], indices: number[], depth = 0): KDNode | null {
    if (points.length === 0) return null;

    const axis = depth % 3;

    const sorted = points
        .map((p, i) => ({ p, index: indices[i] }))
        .sort((a, b) => a.p[axis] - b.p[axis]);

    const mid = Math.floor(sorted.length / 2);
    const node = new KDNode(sorted[mid].p, sorted[mid].index, axis);

    const leftPoints = sorted.slice(0, mid).map(x => x.p);
    const leftIndices = sorted.slice(0, mid).map(x => x.index);
    const rightPoints = sorted.slice(mid + 1).map(x => x.p);
    const rightIndices = sorted.slice(mid + 1).map(x => x.index);

    node.left = buildKDTree(leftPoints, leftIndices, depth + 1);
    node.right = buildKDTree(rightPoints, rightIndices, depth + 1);

    return node;
}

// K-NN, returning sorted by distance
export function knnSearch(node: KDNode | null, target: Vec3, k: number, heap: { dist: number, index: number }[] = []): { dist: number, index: number }[] {
    if (!node) return heap;

    const axis = node.axis;
    const dist = distance(target, node.point);

    // insert into heap (simple array sorted by dist)
    heap.push({ dist, index: node.index });
    heap.sort((a, b) => a.dist - b.dist);
    if (heap.length > k) heap.pop();

    const diff = target[axis] - node.point[axis];
    const primary = diff < 0 ? node.left : node.right;
    const secondary = diff < 0 ? node.right : node.left;

    knnSearch(primary, target, k, heap);

    // check if other side might contain closer points
    if (heap.length < k || Math.abs(diff) < heap[heap.length - 1].dist) {
        knnSearch(secondary, target, k, heap);
    }

    return heap;
}