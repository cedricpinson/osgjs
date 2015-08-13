
mat4 getMat4FromVec4( const int index ) {
    vec4 l1 = uBones[ index  ];
    vec4 l2 = uBones[ index + 1 ];
    vec4 l3 = uBones[ index + 2 ];

    mat4 myMat = mat4(1.0);//identity matrix

    myMat[ 0 ][ 0 ] = l1[ 0 ];
    myMat[ 0 ][ 1 ] = l2[ 0 ];
    myMat[ 0 ][ 2 ] = l3[ 0 ];
    //myMat[ 0 ][ 3 ] = 0.;

    myMat[ 1 ][ 0 ] = l1[ 1 ];
    myMat[ 1 ][ 1 ] = l2[ 1 ];
    myMat[ 1 ][ 2 ] = l3[ 1 ];
    //myMat[ 1 ][ 3 ] = 0.;

    myMat[ 2 ][ 0 ] = l1[ 2 ];
    myMat[ 2 ][ 1 ] = l2[ 2 ];
    myMat[ 2 ][ 2 ] = l3[ 2 ];
    //myMat[ 2 ][ 3 ] = 0.;

    myMat[ 3 ][ 0 ] = l1[ 3 ];
    myMat[ 3 ][ 1 ] = l2[ 3 ];
    myMat[ 3 ][ 2 ] = l3[ 3 ];
    //myMat[ 3 ][ 3 ] = 1.;

    return myMat;
}

//http://http.developer.nvidia.com/GPUGems/gpugems_ch04.html
mat4 skeletalTransform( const in vec4 weightsVec, const in vec4 bonesIdx )
{
    ivec4 idx =  3 * ivec4(bonesIdx);

    return  weightsVec.x * getMat4FromVec4( idx.x ) +
        weightsVec.y * getMat4FromVec4( idx.y ) +
        weightsVec.z * getMat4FromVec4( idx.z ) +
        weightsVec.w * getMat4FromVec4( idx.w );
}
