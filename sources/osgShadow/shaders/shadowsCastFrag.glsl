
#pragma include "colorEncode.glsl"

// see shadowSettings.js header for shadow algo param explanations

#ifdef _EVSM
// Convert depth to EVSM coefficients
// Input depth should be in [0, 1]
vec2 warpDepth(float depth, vec2 exponents)
{
    float pos =  exp( exponents.x * depth);
    float neg = -exp(-exponents.y * depth);
    return vec2(pos, neg);
}

// Convert depth value to EVSM representation
vec4 shadowDepthToEVSM(float depth)
{
    vec2 warpedDepth = warpDepth(depth, vec2(exponent, exponent1));
    return  vec4(warpedDepth.xy, warpedDepth.xy * warpedDepth.xy);
}
#endif // _EVSM


vec4 computeShadowDepth(void) {
    float depth;
    // distance to camera
    depth =  -FragEyeVector.z * FragEyeVector.w;

    //depth = (depth - Shadow_DepthRange.x )* Shadow_DepthRange.w;
    depth = depth  / Shadow_DepthRange.y;

    vec4 outputFrag;

#if defined (_FLOATTEX) && defined(_PCF)
    outputFrag = vec4(depth, 0.0, 0.0, 1.0);
#elif defined (_FLOATTEX)  && defined(_ESM)
    float depthScale = exponent1;
    depth = exp(-depth*depthScale);
    outputFrag = vec4(depth, 0.0, 0.0, 1.0);
#elif defined (_FLOATTEX)  && defined(_VSM)
    outputFrag = vec4(depth, depth*depth, 0.0, 1.0);
#elif defined (_FLOATTEX)  && defined(_EVSM)
    outputFrag = shadowDepthToEVSM(depth);
#elif defined (_FLOATTEX) // && defined(_NONE)
    outputFrag = vec4(depth, 0.0, 0.0, 1.0);
#elif defined(_PCF)
    outputFrag = encodeFloatRGBA(depth);
#elif defined(_ESM)
    float depthScale = exponent1;
    depthScale = exp(-depth*depthScale);
    outputFrag = encodeFloatRGBA(depthScale);
#elif defined(_VSM)
    outputFrag = encodeHalfFloatRGBA(vec2(depth, depth*depth));
#else // NONE
    outputFrag = encodeFloatRGBA(depth);
#endif


    return outputFrag;

}
