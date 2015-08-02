
mat4 getMat4FromVec4( const int index, inout mat4 myMat ) {
    vec4 l1 = uBones[ index  ];
    vec4 l2 = uBones[ index + 1 ];
    vec4 l3 = uBones[ index + 2 ];

    myMat[ 0 ][ 0 ] = l1[ 0 ];
    myMat[ 0 ][ 1 ] = l2[ 0 ];
    myMat[ 0 ][ 2 ] = l3[ 0 ];
    // myMat[ 0 ][ 3 ] = 0.;

    myMat[ 1 ][ 0 ] = l1[ 1 ];
    myMat[ 1 ][ 1 ] = l2[ 1 ];
    myMat[ 1 ][ 2 ] = l3[ 1 ];
    // myMat[ 1 ][ 3 ] = 0.;

    myMat[ 2 ][ 0 ] = l1[ 2 ];
    myMat[ 2 ][ 1 ] = l2[ 2 ];
    myMat[ 2 ][ 2 ] = l3[ 2 ];
    // myMat[ 2 ][ 3 ] = 0.;

    myMat[ 3 ][ 0 ] = l1[ 3 ];
    myMat[ 3 ][ 1 ] = l2[ 3 ];
    myMat[ 3 ][ 2 ] = l3[ 3 ];
    myMat[ 3 ][ 3 ] = 1.;

    return myMat;
}

//http://http.developer.nvidia.com/GPUGems/gpugems_ch04.html
mat4 skeletalTransform( const in vec4 weightsVec, const in vec4 bonesIdx ) {
    ivec4 idx =  3 * ivec4(bonesIdx);
    mat4 tmpMat = mat4(1.0);
    mat4 outMat = mat4(0.0);

    if(weightsVec.x > 0.0) outMat += weightsVec.x * getMat4FromVec4( idx.x, tmpMat );
    if(weightsVec.y > 0.0) outMat += weightsVec.y * getMat4FromVec4( idx.y, tmpMat );
    if(weightsVec.z > 0.0) outMat += weightsVec.z * getMat4FromVec4( idx.z, tmpMat );
    if(weightsVec.w > 0.0) outMat += weightsVec.w * getMat4FromVec4( idx.w, tmpMat );
    return outMat;
}
