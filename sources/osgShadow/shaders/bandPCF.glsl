

float getShadowPCF(sampler2D tex, vec4 shadowMapSize, vec2 uv, float shadowZ) {

    vec2 o = shadowMapSize.zw;
    float shadowed = 0.0;

#define TSF(off1, off2) getSingleFloatFromTex( tex, uv.xy + vec2(off1, off2) );

    // fastest bug gives banding
#if defined(_PCFx4)

    float xPixelOffset = o.x;
    float yPixelOffset = o.y;

    float dx0 = -1.0 * xPixelOffset;
    float dy0 = -1.0 * yPixelOffset;
    float dx1 = 1.0 * xPixelOffset;
    float dy1 = 1.0 * yPixelOffset;

    vec4 sV;

    // vector ops faster alu
    sV.x = TSF( dx0, dy0 );
    sV.y = TSF( dx1, dy0 );
    sV.z = TSF( dx1, dy0 );
    sV.w = TSF( dx1, dy1 );
    sV = vec4(lessThan(vec4(shadowZ), sV  ));
    shadowed = dot(sV, vec4(0.25));

    // here still didn't querying the real shadow at uv.
    // This could be a single func checking for branching
    // like befire going to x9, x16 or anythiong
    // or even complex "blurring"
    if (shadowed != 0.0) // we're on an edge
    {
        shadowed += (shadowZ  < getSingleFloatFromTex( tex, uv.xy ))  ?  1.0 : 0.0;
        shadowed *= 0.5;
    }

#elif defined(_PCFx9)

    float xPixelOffset = o.x;
    float yPixelOffset = o.y;

    float dx0 = -1.0 * xPixelOffset;
    float dy0 = -1.0 * yPixelOffset;
    float dx1 = 1.0 * xPixelOffset;
    float dy1 = 1.0 * yPixelOffset;

    mat3 kern;
    mat3 depthKernel;


    depthKernel[0][0] = TSF( dx0, dy0 );
    depthKernel[0][1] = TSF( dx0, 0.0 );
    depthKernel[0][2] = TSF( dx0, dy1 );
    depthKernel[1][0] = TSF( 0.0, dy0 );
    depthKernel[1][1] = TSF( 0.0, 0.0 );
    depthKernel[1][2] = TSF( 0.0, dy1 );
    depthKernel[2][0] = TSF( dx1, dy0 );
    depthKernel[2][1] = TSF( dx1, 0.0 );
    depthKernel[2][2] = TSF( dx1, dy1 );

    // using 4 vector ops to save ALU
    // filter is done post dept/shadow compare
    vec3 shadowZ3 = vec3( shadowZ );
    kern[0] = vec3(lessThan(shadowZ3, depthKernel[0]  ));
    kern[0] *= vec3(0.25);

    kern[1] = vec3(lessThan(shadowZ3, depthKernel[1] ));
    kern[1] *= vec3(0.25);

    kern[2] = vec3(lessThan(shadowZ3, depthKernel[2] ));
    kern[2] *= vec3(0.25);

    vec2 fractCoord = 1.0 - fract( uv.xy );

    kern[0] = mix( kern[1], kern[0], fractCoord.x );
    kern[1] = mix( kern[2], kern[1], fractCoord.x );

    vec4 sV;
    sV.x = mix( kern[0][1], kern[0][0], fractCoord.y );
    sV.y = mix( kern[0][2], kern[0][1], fractCoord.y );
    sV.z = mix( kern[1][1], kern[1][0], fractCoord.y );
    sV.w = mix( kern[1][2], kern[1][1], fractCoord.x );

    shadowed = dot( sV, vec4( 1.0 ) );

#elif defined(_PCFx16)

    shadowed += step(shadowZ , getSingleFloatFromTex(tex, uv.xy + vec2(-2.0, -2.0)*o));
    shadowed += step(shadowZ , getSingleFloatFromTex(tex, uv.xy + vec2(-1.0, -2.0)*o));
    shadowed += step(shadowZ , getSingleFloatFromTex(tex, uv.xy + vec2(1.0, -2.0)*o));
    shadowed += step(shadowZ , getSingleFloatFromTex(tex, uv.xy + vec2(2.0, -2.0)*o));
    shadowed += step(shadowZ , getSingleFloatFromTex(tex, uv.xy + vec2(-2.0, -1.0)*o));
    shadowed += step(shadowZ , getSingleFloatFromTex(tex, uv.xy + vec2(-1.0, -1.0)*o));
    shadowed += step(shadowZ , getSingleFloatFromTex(tex, uv.xy + vec2(1.0, -1.0)*o));
    shadowed += step(shadowZ , getSingleFloatFromTex(tex, uv.xy + vec2(2.0, -1.0)*o));
    shadowed += step(shadowZ , getSingleFloatFromTex(tex, uv.xy + vec2(-2.0, 1.0)*o));
    shadowed += step(shadowZ , getSingleFloatFromTex(tex, uv.xy + vec2(-1.0, 1.0)*o));
    shadowed += step(shadowZ , getSingleFloatFromTex(tex, uv.xy + vec2(1.0, 1.0)*o));
    shadowed += step(shadowZ , getSingleFloatFromTex(tex, uv.xy + vec2(2.0, 1.0)*o));
    shadowed += step(shadowZ , getSingleFloatFromTex(tex, uv.xy + vec2(-2.0, 2.0)*o));
    shadowed += step(shadowZ , getSingleFloatFromTex(tex, uv.xy + vec2(-1.0, 2.0)*o));
    shadowed += step(shadowZ , getSingleFloatFromTex(tex, uv.xy + vec2(1.0, 2.0)*o));
    shadowed += step(shadowZ , getSingleFloatFromTex(tex, uv.xy + vec2(2.0, 2.0)*o));

    shadowed = shadowed / 16.0;
#endif // pcfx16
    return shadowed;

}
