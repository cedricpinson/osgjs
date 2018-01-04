#pragma include "colorEncode.glsl"

#pragma DECLARE_FUNCTION
vec4 shadowCast(const in vec4 fragEye, const in vec2 shadowDepthRange){
    // distance to camera (we make sure we are near 0 and in [0,1])
    float depth = (-fragEye.z * fragEye.w - shadowDepthRange.x) / (shadowDepthRange.y - shadowDepthRange.x);

#ifdef _FLOATTEX
    return vec4(depth, 0.0, 0.0, 1.0);
#else
    return encodeFloatRGBA(depth);
#endif
}
