
#pragma include "colorEncode.glsl"


vec4 computeShadowDepth(const in vec4 fragEye,
                        const in vec4 shadowRange){
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
