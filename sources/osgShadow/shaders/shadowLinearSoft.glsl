#pragma include "floatFromTex.glsl"
#pragma include "rand.glsl"

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
// TODO could be in a random.glsl file
// https://github.com/EpicGames/UnrealEngine/blob/release/Engine/Shaders/Private/Random.ush#L27
float shadowInterleavedGradientNoise(const in vec2 fragCoord, const in float frameMod) {
    vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
    return fract(magic.z * fract(dot(fragCoord.xy + frameMod * vec2(47.0, 17.0) * 0.695, magic.xy)));
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
        centroidCoord += shadowInterleavedGradientNoise(gl_FragCoord.xy, jitter).xy;
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
