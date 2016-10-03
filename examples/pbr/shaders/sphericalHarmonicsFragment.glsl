
varying vec3 vViewNormal;
varying vec3 vLocalVertex;

uniform vec3 uEnvironmentSphericalHarmonics[9];
uniform mat4 uEnvironmentTransform;


#pragma include "colorSpace.glsl"
#pragma include "sphericalHarmonics.glsl"


mat3 getEnvironmentTransfrom( mat4 transform ) {
    vec3 x = vec3(transform[0][0], transform[1][0], transform[2][0]);
    vec3 y = vec3(transform[0][1], transform[1][1], transform[2][1]);
    vec3 z = vec3(transform[0][2], transform[1][2], transform[2][2]);
    mat3 m = mat3(x,y,z);
    return m;
}

void main() {

    mat3 environmentTransform = getEnvironmentTransfrom( uEnvironmentTransform );
    vec3 n = normalize( vViewNormal );
    n = environmentTransform * n;
    vec3 color = sphericalHarmonics( uEnvironmentSphericalHarmonics, n );
    gl_FragColor = vec4( linearTosRGB(color, DefaultGamma), 1.0);

}
