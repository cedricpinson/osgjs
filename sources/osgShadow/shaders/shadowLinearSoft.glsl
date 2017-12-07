#pragma include "floatFromTex.glsl"

// simulation of texture2Dshadow glsl call on HW
// http://codeflow.org/entries/2013/feb/15/soft-shadow-mapping/
float texture2DCompare(const in sampler2D depths,
                       const in vec2 uv,
                       const in float compare,
                       const in vec4 clampDimension){
    float depth = getSingleFloatFromTex(depths, clamp(uv, clampDimension.xy, clampDimension.zw));
    return compare - depth;
}

#ifdef _JITTER_OFFSET
#define INT_SCALE3_JITTER vec3(.1031, .1030, .0973)
// uniform rand
vec3 randJitter(const in vec3 p2) {
    vec3 p3  = fract(p2.xyz * INT_SCALE3_JITTER);
    p3 += dot(p3, p3.yzx + 19.19);
    p3 = fract((p3.xxy + p3.yzz) * p3.zyx);
    return p3;
}
#endif

// simulates linear fetch like texture2d shadow
float texture2DShadowLerp(
    const in sampler2D depths,
    const in vec2 size,
    const in vec2 uv,
    const in float compare,
    const in vec4 clampDimension
    OPT_ARG_outDistance
    OPT_ARG_jitter){

    vec2 centroidCoord = uv / size.xy;

#ifdef _JITTER_OFFSET
    if (jitter > 0.0){
        centroidCoord += randJitter(vec3(gl_FragCoord.xy, jitter)).xy;
    }
#endif

    centroidCoord = centroidCoord + 0.5;
    vec2 f = fract(centroidCoord);
    vec2 centroidUV = floor(centroidCoord) * size.xy;

    vec4 fetches;
    const vec2 shift  = vec2(1.0, 0.0);
    fetches.x = texture2DCompare(depths, centroidUV + size.xy * shift.yy, compare, clampDimension);
    fetches.y = texture2DCompare(depths, centroidUV + size.xy * shift.yx, compare, clampDimension);
    fetches.z = texture2DCompare(depths, centroidUV + size.xy * shift.xy, compare, clampDimension);
    fetches.w = texture2DCompare(depths, centroidUV + size.xy * shift.xx, compare, clampDimension);



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
