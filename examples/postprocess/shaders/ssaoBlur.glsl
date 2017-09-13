#pragma include "colorEncode.glsl"

uniform sampler2D TextureBlurInput;
uniform vec2 uTextureBlurInputSize;

uniform float uSsaoCrispness;
uniform int uSsaoOnly;

#define SSAO_FILTER_RADIUS 6

#define SSAO_TAP_BLUR(id, absid) sampleTex = TEXTURE_2D_TextureBlurInput(uv + axis * float(id) * 2.0); \
    z = decodeFloatRGBA(sampleTex); \
    weight = max(0.0, 1.0 - sharpnessFactor * abs(z - initialZ)) * (0.3 + gaussian[absid]); \
    sum += weight * sampleTex.a; \
    totalWeight += weight;

vec4 ssaoBlur(const in vec2 axis) {
    vec2 uv = gTexCoord;

    vec4 aoDepth = TEXTURE_2D_TextureBlurInput(uv);

    // background
    if(aoDepth.x == 1.0){
        return aoDepth;
    }

    float initialZ = decodeFloatRGBA(aoDepth);

    float gaussian[SSAO_FILTER_RADIUS + 1];
    #if SSAO_FILTER_RADIUS == 3
        gaussian[0] = 0.153170; gaussian[1] = 0.144893;
        gaussian[2] = 0.122649; gaussian[3] = 0.092902;
    #elif SSAO_FILTER_RADIUS == 4
        gaussian[0] = 0.153170; gaussian[1] = 0.144893; gaussian[2] = 0.122649;
        gaussian[3] = 0.092902; gaussian[4] = 0.062970;
    #elif SSAO_FILTER_RADIUS == 6
        gaussian[0] = 0.111220; gaussian[1] = 0.107798; gaussian[2] = 0.098151; gaussian[3] = 0.083953;
        gaussian[4] = 0.067458; gaussian[5] = 0.050920; gaussian[6] = 0.036108;
    #endif

    float totalWeight = gaussian[0];
    float sum = aoDepth.a * totalWeight;
    float sharpnessFactor = mix(50.0, 500.0, uSsaoCrispness);

    // ---- UNROLL ----
    vec2 ofs;
    float z;
    float weight;
    vec4 sampleTex;

    for(int i = -SSAO_FILTER_RADIUS; i < SSAO_FILTER_RADIUS; ++i){
        if( i != 0 ){
            SSAO_TAP_BLUR(-i, i);
            SSAO_TAP_BLUR(-i, i);
        }
    }
    // ---- UNROLL ----

    aoDepth.a = sum / totalWeight;
    return aoDepth;
}

#ifdef SSAO_BLUR_H
vec4 ssaoBlurH() {
    return ssaoBlur(vec2(1.0, 0.0) / uTextureBlurInputSize);
}
#else
vec4 ssaoBlurV() {
    vec4 blur = ssaoBlur(vec2(0.0, 1.0) / uTextureBlurInputSize);
    if(blur.x == 1.0){
        return vec4(0.0);
    }

    // apply ssao
    vec3 color = TEXTURE_2D_TextureInput(gTexCoord).rgb;
    if(uSsaoOnly == 1) color = vec3(0.7411);
    return vec4(color * blur.aaa, 1.0);
}
#endif
