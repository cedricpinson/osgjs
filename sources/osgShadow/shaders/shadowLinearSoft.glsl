#pragma include "floatFromTex.glsl"


#ifdef _OUT_DISTANCE
#define OPT_ARG_outDistance ,out float outDistance
#else
#define OPT_ARG_outDistance
#endif

// simulation of texture2Dshadow glsl call on HW
// http://codeflow.org/entries/2013/feb/15/soft-shadow-mapping/
float texture2DCompare(const in sampler2D depths, const in vec2 uv, const in float compare, const in vec4 clampDimension){
    float depth = getSingleFloatFromTex(depths, clamp(uv, clampDimension.xy, clampDimension.zw));
    return compare - depth;
}

// simulates linear fetch like texture2d shadow
float texture2DShadowLerp(
    const in sampler2D depths,
    const in vec4 size,
    const in vec2 uv,
    const in float compare,
    const in vec4 clampDimension
    OPT_ARG_outDistance){

    vec2 f = fract(uv * size.xy + 0.5);
    vec2 centroidUV = floor(uv * size.xy + 0.5) * size.zw;

    vec4 fetches;
    fetches.x = texture2DCompare(depths, centroidUV + size.zw * vec2(0.0, 0.0), compare, clampDimension);
    fetches.y = texture2DCompare(depths, centroidUV + size.zw * vec2(0.0, 1.0), compare, clampDimension);
    fetches.z = texture2DCompare(depths, centroidUV + size.zw * vec2(1.0, 0.0), compare, clampDimension);
    fetches.w = texture2DCompare(depths, centroidUV + size.zw * vec2(1.0, 1.0), compare, clampDimension);

#ifdef _OUT_DISTANCE
    float _a = mix(fetches.x, fetches.y, f.y);
    float _b = mix(fetches.z, fetches.w, f.y);
    outDistance = mix(_a, _b, f.x);
#endif

    vec4 st = step(fetches, vec4(0.0));

    float a = mix(st.x, st.y, f.y);
    float b = mix(st.z, st.w, f.y);
    return mix(a, b, f.x);
}
