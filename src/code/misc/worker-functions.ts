//import * as math from "mathjs"
//import * as numeric from "numeric"

/*function patchRBFWorkerFuncmathjs([A, bx, by, bz]: [number[][], number[], number[], number[]]) {
    const A_mat = math.matrix(A)

    //solve weights
    const LU = math.lup(A_mat)
    const wx = (math.lusolve(LU, math.matrix(bx)).toArray() as number[]).flat()
    const wy = (math.lusolve(LU, math.matrix(by)).toArray() as number[]).flat()
    const wz = (math.lusolve(LU, math.matrix(bz)).toArray() as number[]).flat()

    return wx.map((_, i) => [wx[i], wy[i], wz[i]] as Vec3)
}*/

/*function patchRBFWorkerFunc([A, bx, by, bz]: [number[][], number[], number[], number[]]) {
    //compute LU
    const LU = numeric.LU(A)

    //solve weights
    const wx = numeric.LUsolve(LU, bx)
    const wy = numeric.LUsolve(LU, by)
    const wz = numeric.LUsolve(LU, bz)

    return wx.map((_, i) => [wx[i], wy[i], wz[i]] as Vec3)
}*/

function luDecompose(A: Float32Array[]) {
    const n = A.length
    const LU = A
    const P = new Int32Array(n)

    for (let i = 0; i < n; i++) P[i] = i

    for (let k = 0; k < n; k++) {
        //pivot
        let pivot = k
        for (let i = k + 1; i < n; i++) {
            if (Math.abs(LU[i][k]) > Math.abs(LU[pivot][k])) {
                pivot = i
            }
        }

        //swap rows
        if (pivot !== k) {
            const tmpRow = LU[k]
            LU[k] = LU[pivot]
            LU[pivot] = tmpRow

            const tmpP = P[k]
            P[k] = P[pivot]
            P[pivot] = tmpP
        }

        //elimination
        const pivotVal = LU[k][k]
        for (let i = k + 1; i < n; i++) {
            LU[i][k] /= pivotVal
            const mult = LU[i][k]
            const rowI = LU[i]
            const rowK = LU[k]
            for (let j = k + 1; j < n; j++) {
                rowI[j] -= mult * rowK[j]
            }
        }
    }

    return { LU, P }
}


function luSolve({ LU, P }: { LU: Float32Array[], P: Int32Array }, b: Float32Array) {
    const n = LU.length
    const x = new Float32Array(n)

    //apply permutation
    for (let i = 0; i < n; i++) {
        x[i] = b[P[i]]
    }

    //forward substitution (Ly = Pb)
    for (let i = 0; i < n; i++) {
        const row = LU[i]
        let sum = x[i]
        for (let j = 0; j < i; j++) {
            sum -= row[j] * x[j]
        }
        x[i] = sum
    }

    //backward substitution (Ux = y)
    for (let i = n - 1; i >= 0; i--) {
        const row = LU[i]
        let sum = x[i]
        for (let j = i + 1; j < n; j++) {
            sum -= row[j] * x[j]
        }
        x[i] = sum / row[i]
    }

    return x
}

function patchRBFWorkerFunc([_A, _bx, _by, _bz]: [ArrayBuffer[], ArrayBuffer, ArrayBuffer, ArrayBuffer]) {
    //convert buffers to Float32Array
    const A = _A.map(r => new Float32Array(r))
    const bx = new Float32Array(_bx)
    const by = new Float32Array(_by)
    const bz = new Float32Array(_bz)

    //solve for weights
    const LU = luDecompose(A)

    const wx = luSolve(LU, bx)
    const wy = luSolve(LU, by)
    const wz = luSolve(LU, bz)

    //combine weights of x,y,z into a Float32Array
    const n = wx.length
    const result = new Float32Array(n * 3)

    for (let i = 0; i < n; i++) {
        result[i*3 + 0] = wx[i]
        result[i*3 + 1] = wy[i]
        result[i*3 + 2] = wz[i]
    }

    return result.buffer
}



// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const WorkerTypeToFunction: {[K in string]: Function} = {
    "patchRBF": patchRBFWorkerFunc
}
