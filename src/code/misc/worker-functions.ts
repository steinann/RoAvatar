import * as math from "mathjs"
import type { Vec3 } from "../rblx/mesh"

function patchRBFWorkerFunc([A, bx, by, bz]: [number[][], number[], number[], number[]]) {
    const A_mat = math.matrix(A)

    //solve weights
    const LU = math.lup(A_mat)
    const wx = (math.lusolve(LU, math.matrix(bx)).toArray() as number[]).flat()
    const wy = (math.lusolve(LU, math.matrix(by)).toArray() as number[]).flat()
    const wz = (math.lusolve(LU, math.matrix(bz)).toArray() as number[]).flat()

    return wx.map((_, i) => [wx[i], wy[i], wz[i]] as Vec3)
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const WorkerTypeToFunction: {[K in string]: Function} = {
    "patchRBF": patchRBFWorkerFunc
}
