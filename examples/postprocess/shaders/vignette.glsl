uniform vec2 uLensRadius;

vec4 vignette(const in vec4 color) {
    float dist = distance(gTexCoord, vec2(0.5));

    return vec4(color * smoothstep(uLensRadius.x, uLensRadius.y, dist));
}