uniform sampler2D uEnvironment;
uniform vec2 uEnvironmentSize;
uniform vec2 uIrradianceSize;
uniform vec2 uEnvironmentLodRange;
uniform float uLod;
uniform float uBrightness;

uniform mat4 uEnvironmentTransform;

varying vec3 vViewVertex;
varying vec3 vViewNormal;
varying vec2 vTexCoord0;

#pragma include "math.glsl"
#pragma include "colorSpace.glsl"
#pragma include "panoramaSampler.glsl"

// environment rgbe lod inline
vec3 test0( const in vec3 direction ) {
#ifdef BACKGROUND
    vec2 uvBase = normalToPanoramaUV( direction );
    return texture2D( uEnvironment, uvBase).rgb;
#else
    vec3 texel = texturePanoramaLod( uEnvironment,
                                     uEnvironmentSize,
                                     direction,
                                     uLod,
                                     uEnvironmentLodRange[0] );
    return texel;
#endif
}

mat3 getEnvironmentTransfrom( mat4 transform ) {
    vec3 x = vec3(transform[0][0], transform[1][0], transform[2][0]);
    vec3 y = vec3(transform[0][1], transform[1][1], transform[2][1]);
    vec3 z = vec3(transform[0][2], transform[1][2], transform[2][2]);
    mat3 m = mat3(x,y,z);
    return m;
}

void main() {

    // vec3 N = normalize(vViewNormal);
    // mat3 environmentTransform = getEnvironmentTransfrom ( uEnvironmentTransform );

    // vec3 E = normalize(vViewVertex);
    // vec3 V = -E;
    // vec3 H = N;
    // vec3 L = normalize(2.0 * dot(V, H) * H - V);

    // vec3 direction = environmentTransform * L;

    vec3 direction = normalize( vViewNormal);
    direction = getEnvironmentTransfrom ( uEnvironmentTransform ) * direction;

    vec3 color = test0( direction );
#ifdef BACKGROUND
    color = sRGBToLinear( color, DefaultGamma );
#endif
    gl_FragColor = vec4( linearTosRGB(color * uBrightness, DefaultGamma ), 1.0);
}
