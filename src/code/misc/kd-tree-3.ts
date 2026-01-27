
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

type HeapItem = { dist: number; index: number };

function siftUp(heap: HeapItem[], i: number): void {
    while (i > 0) {
        const p = (i - 1) >> 1;
        if (heap[p].dist >= heap[i].dist) break;
        const tmp = heap[p];
        heap[p] = heap[i];
        heap[i] = tmp;
        i = p;
    }
}

function siftDown(heap: HeapItem[], i: number): void {
    const n = heap.length;
    while (true) {
        let largest = i;
        const l = (i << 1) + 1;
        const r = l + 1;

        if (l < n && heap[l].dist > heap[largest].dist) largest = l;
        if (r < n && heap[r].dist > heap[largest].dist) largest = r;
        if (largest === i) break;

        const tmp = heap[i];
        heap[i] = heap[largest];
        heap[largest] = tmp;

        i = largest;
    }
}

function heapPushMax(heap: HeapItem[], item: HeapItem, k: number): void {
    if (heap.length < k) {
        heap.push(item);
        siftUp(heap, heap.length - 1);
        return;
    }
    if (item.dist >= heap[0].dist) return; // worse than current worst

    heap[0] = item;
    siftDown(heap, 0);
}
function distSq(a: Vec3, b: Vec3): number {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    return dx * dx + dy * dy + dz * dz;
}

export function knnSearch(
    node: KDNode | null,
    target: Vec3,
    k: number,
    heap: HeapItem[] = []
): HeapItem[] {
    if (!node) return heap;

    const axis = node.axis;
    const dist = distSq(target, node.point);

    heapPushMax(heap, { dist, index: node.index }, k);

    const diff = target[axis] - node.point[axis];
    const primary = diff < 0 ? node.left : node.right;
    const secondary = diff < 0 ? node.right : node.left;

    knnSearch(primary, target, k, heap);

    //only explore far side if needed
    const worstDist = heap.length < k ? Infinity : heap[0].dist;
    if (diff * diff < worstDist) {
        knnSearch(secondary, target, k, heap);
    }

    if (node === null) {
        heap.sort((a, b) => a.dist - b.dist);
    }

    return heap;
}


export function nearestSearch(node: KDNode | null, target: Vec3,best: { dist: number, index: number } = { dist: Infinity, index: -1 }): { dist: number, index: number } {
    if (!node) return best;

    //compute distance to this node
    const dist = distance(target, node.point);
    if (dist < best.dist) {
        best = { dist, index: node.index };
    }

    const axis = node.axis;
    const diff = target[axis] - node.point[axis];

    //choose primary branch
    const primary = diff < 0 ? node.left : node.right;
    const secondary = diff < 0 ? node.right : node.left;

    //search primary branch
    best = nearestSearch(primary, target, best);

    if (Math.abs(diff) < best.dist) {
        best = nearestSearch(secondary, target, best);
    }

    return best;
}
