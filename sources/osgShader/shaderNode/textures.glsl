// -*-c-*-
#pragma include "functions.glsl"

vec4 textureSpheremap(const in sampler2D texture, const in vec3 normal) {
    vec2 uv = normalToSphericalUV( normal );
    return texture2D(texture, uv.xy );
}

vec3 textureCubemapRGB(const in samplerCube texture, const in vec3 uv) {
    return textureCube(texture, uv).rgb;
}

vec4 textureHDR(const in sampler2D texture, const in vec2 size, const in vec2 uv) {
    vec4 rgbe = texture2D(texture, floor(uv * size) / size);
    float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));
    return vec4(rgbe.rgb * 255.0 * f, 1.0);
}

vec4 textureHDRLinear(const in sampler2D texture, const in vec2 size, const in vec2 uv) {
    vec2 textureSize = vec2(256.0, 128.0);
    vec2 t = 1.0 / size;
    vec4 a = textureHDR(texture, size, uv + vec2(0.0, 0.0)),
        b = textureHDR(texture, size, uv + vec2(t.x, 0.0)),
        c = textureHDR(texture, size, uv + vec2(0.0, t.y)),
        d = textureHDR(texture, size, uv + vec2(t.x, t.y));
    vec2 f = fract(uv * size);
    vec4 A = mix(a, b, f.x),
        B = mix(c, d, f.x);
    return mix(A, B, f.y);
}

vec3 textureSpheremapHDR(const in sampler2D texture, const in vec2 size, const in vec3 normal) {
    vec2 uv = normalToSphericalUV( normal );
    return textureHDRLinear(texture, size, uv.xy ).rgb;
}

float textureIntensity(const in sampler2D texture, const in vec2 uv) {
    vec3 rgb = texture2D(texture, uv).rgb;
    return dot(rgb,vec3(1.0/3.0));
}

vec3 textureNormal(in sampler2D texture, const in vec2 uv) {
    vec3 rgb = texture2D(texture, uv).rgb;
    return normalize((2.0*rgb-vec3(1.0)));
}

vec2 textureGradient(in sampler2D texture, const in vec2 uv, const in vec2 size) {
    vec2 step = 1.0 / size;
    float dx = texture2D(texture, uv - vec2(step.x, 0.0)).r - texture2D(texture, uv + vec2(step.x, 0.0)).r;
    float dy = texture2D(texture, uv - vec2(0.0, step.y)).r - texture2D(texture, uv + vec2(0.0, step.y)).r;
    return vec2(dx, dy);
}
