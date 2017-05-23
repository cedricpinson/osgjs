#pragma include "colorEncode.glsl"


vec4 computeShadowDepth(const in vec4 fragEye,
                        const in vec4 shadowRange
#if defined (_ATLAS_SHADOW_NO_SCISSOR)
                        , const in vec4 shadowMapSize
#endif
    ){

#if defined (_ATLAS_SHADOW_NO_SCISSOR)
    if (gl_FragCoord.x <= shadowMapSize.x
        || gl_FragCoord.x >= shadowMapSize.x + shadowMapSize.z
        || gl_FragCoord.y <= shadowMapSize.y
        || gl_FragCoord.y >= shadowMapSize.y + shadowMapSize.w)
        discard;
#endif

    // distance to camera
    float depth =  -fragEye.z * fragEye.w;
    // most precision near 0, make sure we are near 0 and in  [0,1]
    depth = (depth - shadowRange.x ) * shadowRange.w;

    vec4 outputFrag;
#if defined (_FLOATTEX)
    outputFrag = vec4(depth, 0.0, 0.0, 1.0);
#else
    outputFrag = encodeFloatRGBA(depth);
#endif

    return outputFrag;
}
