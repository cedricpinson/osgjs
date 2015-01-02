#define PI 3.1415926535897932384626433832795
#define PI_2 (2.0*3.1415926535897932384626433832795)
#define INV_PI 1.0/PI
#define INV_LOG2 1.4426950408889634073599246810019

uniform sampler2D uEnvironment;
uniform vec2 uEnvironmentSize;

varying vec2 osg_FragTexCoord0;

#pragma include "panoramaSampler.glsl"

void main() {

    vec3 color = texturePanorama(uEnvironment, osg_FragTexCoord0);
    gl_FragColor = vec4( color, 1.0);

}
