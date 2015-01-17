
// simulation of texture2Dshadow glsl call on HW
float texture2DCompare(sampler2D depths, vec2 uv, float compare, float gbias){

    float depth = getSingleFloatFromTex(depths, uv);
    return step(compare, depth - gbias);

}

// simulates linear fetch like texture2d shadow
float texture2DShadowLerp(sampler2D depths, vec4 size, vec2 uv, float compare, float gbias){

    vec2 texelSize = vec2(1.0)*size.zw;
    vec2 f = fract(uv*size.xy+0.5);
    vec2 centroidUV = floor(uv*size.xy+0.5)*size.zw;

    float lb = texture2DCompare(depths, centroidUV+texelSize*vec2(0.0, 0.0), compare, gbias);
    float lt = texture2DCompare(depths, centroidUV+texelSize*vec2(0.0, 1.0), compare, gbias);
    float rb = texture2DCompare(depths, centroidUV+texelSize*vec2(1.0, 0.0), compare, gbias);
    float rt = texture2DCompare(depths, centroidUV+texelSize*vec2(1.0, 1.0), compare, gbias);
    float a = mix(lb, lt, f.y);
    float b = mix(rb, rt, f.y);
    float c = mix(a, b, f.x);
    return c;

}
