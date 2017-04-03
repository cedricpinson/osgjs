vec3 textureRGB(const in sampler2D tex, const in vec2 uv) {
    return texture2D(tex, uv.xy ).rgb;
}

vec4 textureRGBA(const in sampler2D tex, const in vec2 uv) {
    return texture2D(tex, uv.xy ).rgba;
}

float textureIntensity(const in sampler2D tex, const in vec2 uv) {
    return texture2D(tex, uv).r;
}

float textureAlpha(const in sampler2D tex, const in vec2 uv) {
    return texture2D(tex, uv.xy ).a;
}
