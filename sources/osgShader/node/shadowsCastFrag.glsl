#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif


uniform float exponent;
uniform float exponent1;
uniform vec4 Shadow_DepthRange;
uniform mat4 Shadow_View;

varying vec4 WorldPos;

#pragma include "floatrgbacodec.glsl"

#ifdef _EVSM
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
#endif // _EVSM

void main(void) {
    float depth;
    // linearize (aka map z to near..far to 0..1)
    #ifndef NUM_STABLE
        depth =  - WorldPos.z;
        // linearize (aka map z to near..far to 0..1)
        depth = (depth - Shadow_DepthRange.x )* Shadow_DepthRange.w;
        //depth = WorldPos.z / WorldPos.w;
        depth = clamp(depth, 0.0, 1.0);
    #else
        depth =  length(WorldPos.xyz);
        depth = (depth - Shadow_DepthRange.x )* Shadow_DepthRange.w;
        //depth = WorldPos.z / WorldPos.w;
        depth = clamp(depth, 0.0, 1.0);

    #endif

    #ifdef _FLOATTEX
        #ifdef _EVSM
            gl_FragColor = ShadowDepthToEVSM(depth);
        #else
           #ifdef _VSM
               gl_FragColor = EncodeHalfFloatRGBA(vec2(depth, depth*depth));
          #else
                // _ESM, _PCF, _NONE
                #ifdef _ESM
                    float depthScale = exponent1;//40.0;
                    //depth = exp(exponent*depth*depthScale), 0.0, 1.0;
                    depth = depth*depthScale;
                    //depth = clamp(depth, 0.0, 1.0);
                #endif
                gl_FragColor = EncodeFloatRGBA(depth);
           #endif
        #endif
   #else
        #ifdef _VSM
            gl_FragColor = vec4(depth, depth*depth, 0.0, 1.0);
        #else
           // _ESM, _PCF, _NONE
            #ifdef _ESM
            float depthScale = exponent1;//40.0;
            //depth = exp(exponent*depth*depthScale);
            depth = depth*depthScale;
            //depth = clamp(depth, 0.0, 1.0);
            #endif
            gl_FragColor = vec4(depth, 0.0, 0.0, 1.0);
        #endif
    #endif
}
