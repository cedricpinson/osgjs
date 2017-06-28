#pragma DECLARE_FUNCTION
vec3 textureRGB(const in sampler2D tex, const in vec2 uv) {
    return texture2D(tex, uv.xy).rgb;
}

#pragma DECLARE_FUNCTION
vec4 textureRGBA(const in sampler2D tex, const in vec2 uv) {
    return texture2D(tex, uv.xy).rgba;
}

#pragma DECLARE_FUNCTION
float textureIntensity(const in sampler2D tex, const in vec2 uv) {
    return texture2D(tex, uv).r;
}

#pragma DECLARE_FUNCTION
float textureAlpha(const in sampler2D tex, const in vec2 uv) {
    return texture2D(tex, uv.xy).a;
}
