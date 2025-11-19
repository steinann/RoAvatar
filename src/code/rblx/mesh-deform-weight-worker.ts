import { add, clamp, divide, floor, gaussian_rbf, multiply, type WeightChunk } from "./mesh-deform";

onmessage = function(event) {
    const {id, mesh, ref_mesh, baseChunks, heightSplit, depthSplit, widthSplit, sigma, lowerBound, higherBound, start_i, end_i } = event.data;

    //console.log(mesh)

    const weightChunks: WeightChunk[] = new Array(end_i - start_i)
    
    for (let i = start_i; i < end_i; i++) {
        const vert = mesh.coreMesh.verts[i]
        //console.log(vert)
        //console.log(ref_mesh._size)
        const chunkPos = clamp(floor(multiply(divide(add(vert.position, multiply(ref_mesh._size,[0.5,0.5,0.5])), ref_mesh._size), [widthSplit, heightSplit, depthSplit])), lowerBound, higherBound)
        const [x,y,z] = chunkPos

        const baseChunk = baseChunks[x * (heightSplit * depthSplit) + y * depthSplit + z]
        const weights = new Array(baseChunk.indices.length)
        let weightSum = 0

        for (let i = 0; i < baseChunk.indices.length; i++) {
            const index = baseChunk.indices[i]
            const weight = gaussian_rbf(vert.position, ref_mesh.coreMesh.verts[index].position, sigma)
            weightSum += weight
            weights[i] = weight
        }

        if (weightSum !== 0) {
            for (let i = 0; i < weights.length; i++) {
                weights[i] /= weightSum
            }
        }

        const weightChunk = {
            meshChunk: baseChunk,
            weights: weights,
        }

        weightChunks[i - start_i] = weightChunk
    }

    this.postMessage({id, weightChunks})
}