//https://www.freepatentsonline.com/y2023/0124297.html
/*
1. Calculate threshold:
    a. For each face on an outer cage (calculateCloseToCageThreshold)
        i. calculate a distance between the face on the outer cage and the closest face on the render mesh
    b. Get the middle value of the distance as the threshold value
2. Find all faces on render mesh that need to be cluster (meshFacesOutsideOfOuterCage)
    a. The algorithm only wants to cluster when the face on the render mesh is outside of the outer cage
    b. For each face on the render mesh:
        i. If the face’s distance to the closest outer cage is larger than the threshold
        ii. AND when rays are shot from the face, at least one ray will not hit the outer cage,
        iii. Then the face needs to be clustered because it probably is outside of the outer cage
3. Group together those faces of the render mesh that are determined above to be outside of the outer cage (generateClusterForFacesOnMeshOutsideOfOuterCage)
    a. For each face on the render mesh that needs clustering:
        i. Find the face’s adjacent faces on the render mesh
        ii. If the adjacent face(s) needs clustering, add the face(s) into one group
4. Update the map of the render mesh to the related outer cage:
    a. For each cluster of render faces:
        i. For each render face in the cluster:
            1. Find all the related outer cage faces
            2. Add these outer cage faces into a cluster of related outer cage faces
            3. Update the related outer cage face of all faces in the cluster of related outer cage faces to each render face in the cluster of render face cluster
*/