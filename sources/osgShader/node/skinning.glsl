
mat4 getMat4FromVec4( const int index, inout mat4 myMat ) {
    // We have to use a global variable because we can't access dynamically
    // matrix is transpose so we should do vec * matrix
    myMat[0] = uBones[ index ];
    myMat[1] = uBones[ index + 1];
    myMat[2] = uBones[ index + 2];
    return myMat;
}

//http://http.developer.nvidia.com/GPUGems/gpugems_ch04.html
mat4 skeletalTransform( const in vec4 weightsVec, const in vec4 bonesIdx ) {
    ivec4 idx =  3 * ivec4(bonesIdx);
    mat4 tmpMat = mat4(1.0);
    mat4 outMat = mat4(0.0);

    if(all(equal(weightsVec, vec4(0.0)))) return tmpMat;

    if(weightsVec.x > 0.0) outMat += weightsVec.x * getMat4FromVec4( idx.x, tmpMat );
    if(weightsVec.y > 0.0) outMat += weightsVec.y * getMat4FromVec4( idx.y, tmpMat );
    if(weightsVec.z > 0.0) outMat += weightsVec.z * getMat4FromVec4( idx.z, tmpMat );
    if(weightsVec.w > 0.0) outMat += weightsVec.w * getMat4FromVec4( idx.w, tmpMat );
    return outMat;
}
