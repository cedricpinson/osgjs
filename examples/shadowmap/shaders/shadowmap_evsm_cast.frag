#ifdef GL_ES
precision highp float;
#endif


uniform vec4 Shadow_DepthRange;
uniform mat4 Shadow_View;

varying vec4 WorldPos;


uniform float exponent;
uniform float exponent1;

// Convert depth to EVSM coefficients
// Input depth should be in [0, 1]
vec2 WarpDepth(float depth, vec2 exponents)
{
    // Rescale depth into [-1, 1]
    depth = 2.0  * depth - 1.0;
    float pos =  exp( exponents.x * depth);
    float neg = -exp(-exponents.y * depth);
    return vec2(pos, neg);
}

// Convert depth value to EVSM representation
vec4 ShadowDepthToEVSM(float depth)
{
	vec2 exponents = vec2(exponent, exponent1);
	vec2 warpedDepth = WarpDepth(depth, exponents);
	return  vec4(warpedDepth.xy, warpedDepth.xy * warpedDepth.xy);
}

void main(void) {
    float depth;
// #define NUM_STABLE
    #ifndef NUM_STABLE
        depth =  - WorldPos.z;
        // linerarize (aka map z to near..far to 0..1) 
        depth = (depth - Shadow_DepthRange.x )* Shadow_DepthRange.w;
        //depth = WorldPos.z / WorldPos.w;
         depth = clamp(depth, 0.0, 1.0);
    #else
        depth =  length(WorldPos.xyz);
        depth = (depth - Shadow_DepthRange.x )* Shadow_DepthRange.w;
        //depth = WorldPos.z / WorldPos.w;
         depth = clamp(depth, 0.0, 1.0);
    #endif


    gl_FragColor = ShadowDepthToEVSM(depth);
}