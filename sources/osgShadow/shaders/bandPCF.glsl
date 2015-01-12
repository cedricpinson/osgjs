

float getShadowPCF(sampler2D tex, vec4 shadowMapSize, vec2 shadowUV, float shadowZ, float gbias) {

    vec2 o = shadowMapSize.zw;
    float shadowed = 0.0;

    // fastest bug gives banding
#if defined(_PCFx4)

    float xPixelOffset = o.x;
    float yPixelOffset = o.y;

    float dx0 = -1.0 * xPixelOffset;
    float dy0 = -1.0 * yPixelOffset;
    float dx1 = 1.0 * xPixelOffset;
    float dy1 = 1.0 * yPixelOffset;

    vec4 shadowValues;

    // vector ops faster alu
    shadowValues.x = getSingleFloatFromTex( tex, shadowUV.xy + vec2( dx0, dy0 ) );
    shadowValues.y = getSingleFloatFromTex( tex, shadowUV.xy + vec2( dx0, dy1 ) );
    shadowValues.z = getSingleFloatFromTex( tex, shadowUV.xy + vec2( dx1, dy0 ) ) ;
    shadowValues.w = getSingleFloatFromTex( tex, shadowUV.xy + vec2( dx1, dy1 ) ) ;
    shadowValues = vec4(lessThan(vec4(shadowZ - gbias), shadowValues  ));
    shadowed = dot(shadowValues, vec4(0.25));

    // here still didn't querying the real shadow at shadowUV.
    // This could be a single func checking for branching
    // like befire going to x9, x16 or anythiong
    // or even complex "blurring"
    if (shadowed != 0.0) // we're on an edge
    {
        shadowed += (shadowZ - gbias < getSingleFloatFromTex( tex, shadowUV.xy ))  ?  1.0 : 0.0;
        shadowed *= 0.5;
    }

#elif defined(_PCFx9)

    float xPixelOffset = o.x;
    float yPixelOffset = o.y;

    float dx0 = -1.0 * xPixelOffset;
    float dy0 = -1.0 * yPixelOffset;
    float dx1 = 1.0 * xPixelOffset;
    float dy1 = 1.0 * yPixelOffset;

    mat3 shadowKernel;
    mat3 depthKernel;


    depthKernel[0][0] = getSingleFloatFromTex( tex, shadowUV.xy + vec2( dx0, dy0 ) );
    depthKernel[0][1] = getSingleFloatFromTex( tex, shadowUV.xy + vec2( dx0, 0.0 ) );
    depthKernel[0][2] = getSingleFloatFromTex( tex, shadowUV.xy + vec2( dx0, dy1 ) );
    depthKernel[1][0] = getSingleFloatFromTex( tex, shadowUV.xy + vec2( 0.0, dy0 ) );
    depthKernel[1][1] = getSingleFloatFromTex( tex, shadowUV.xy ) ;
    depthKernel[1][2] = getSingleFloatFromTex( tex, shadowUV.xy + vec2( 0.0, dy1 ) ) ;
    depthKernel[2][0] = getSingleFloatFromTex( tex, shadowUV.xy + vec2( dx1, dy0 ) ) ;
    depthKernel[2][1] = getSingleFloatFromTex( tex, shadowUV.xy + vec2( dx1, 0.0 ) ) ;
    depthKernel[2][2] = getSingleFloatFromTex( tex, shadowUV.xy + vec2( dx1, dy1 ) ) ;

    // using 4 vector ops to save ALU
    // filter is done post dept/shadow compare
    vec3 shadowZ3 = vec3( shadowZ - gbias);
    shadowKernel[0] = vec3(lessThan(shadowZ3, depthKernel[0]  ));
    shadowKernel[0] *= vec3(0.25);

    shadowKernel[1] = vec3(lessThan(shadowZ3, depthKernel[1] ));
    shadowKernel[1] *= vec3(0.25);

    shadowKernel[2] = vec3(lessThan(shadowZ3, depthKernel[2] ));
    shadowKernel[2] *= vec3(0.25);

    vec2 fractionalCoord = 1.0 - fract( shadowUV.xy );

    shadowKernel[0] = mix( shadowKernel[1], shadowKernel[0], fractionalCoord.x );
    shadowKernel[1] = mix( shadowKernel[2], shadowKernel[1], fractionalCoord.x );

    vec4 shadowValues;
    shadowValues.x = mix( shadowKernel[0][1], shadowKernel[0][0], fractionalCoord.y );
    shadowValues.y = mix( shadowKernel[0][2], shadowKernel[0][1], fractionalCoord.y );
    shadowValues.z = mix( shadowKernel[1][1], shadowKernel[1][0], fractionalCoord.y );
    shadowValues.w = mix( shadowKernel[1][2], shadowKernel[1][1], fractionalCoord.x );

    shadowed = dot( shadowValues, vec4( 1.0 ) );

#elif defined(_PCFx16)

    vec2 fetch[16];
    fetch[0] = shadowUV.xy + vec2(-2.0, -2.0)*o;
    fetch[1] = shadowUV.xy + vec2(-1.0, -2.0)*o;
    fetch[2] = shadowUV.xy + vec2(1.0, -2.0)*o;
    fetch[3] = shadowUV.xy + vec2(2.0, -2.0)*o;
    fetch[4] = shadowUV.xy + vec2(-2.0, -1.0)*o;
    fetch[5] = shadowUV.xy + vec2(-1.0, -1.0)*o;
    fetch[6] = shadowUV.xy + vec2(1.0, -1.0)*o;
    fetch[7] = shadowUV.xy + vec2(2.0, -1.0)*o;
    fetch[8] = shadowUV.xy + vec2(-2.0, 1.0)*o;
    fetch[9] = shadowUV.xy + vec2(-1.0, 1.0)*o;
    fetch[10] = shadowUV.xy + vec2(1.0, 1.0)*o;
    fetch[11] = shadowUV.xy + vec2(2.0, 1.0)*o;
    fetch[12] = shadowUV.xy + vec2(-2.0, 2.0)*o;
    fetch[13] = shadowUV.xy + vec2(-1.0, 2.0)*o;
    fetch[14] = shadowUV.xy + vec2(1.0, 2.0)*o;
    fetch[15] = shadowUV.xy + vec2(2.0, 2.0)*o;

    for(int i = 0; i < 16; i++) {

        float zz = getSingleFloatFromTex(tex, fetch[i]);
        shadowed += step(shadowZ - gbias , zz);
    }
    shadowed = shadowed / 16.0;
#endif // pcfx16
    return shadowed;

}
