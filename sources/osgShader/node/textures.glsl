vec3 textureRGB(const in sampler2D texture, const in vec2 uv) {
    return texture2D(texture, uv.xy ).rgb;
}

vec4 textureRGBA(const in sampler2D texture, const in vec2 uv) {
    return texture2D(texture, uv.xy ).rgba;
}

float textureIntensity(const in sampler2D texture, const in vec2 uv) {
    return dot(texture2D(texture, uv).rgb,vec3(1.0/3.0));
}

float textureAlpha(const in sampler2D texture, const in vec2 uv) {
    return texture2D(texture, uv.xy ).a;
}
