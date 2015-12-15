
varying vec3 osg_FragNormal;

uniform sampler2D uEnvironment;
varying vec2 osg_FragTexCoord0;
uniform vec2 uEnvironmentSize;
uniform vec2 uEnvironmentLodRange;
uniform float uLod;

#pragma include "panoramaSampler.glsl"

void main (void)
{
    vec3 direction = normalize( osg_FragNormal);
    vec2 uvBase = normalToPanoramaUV( direction );

    //vec3 texel = textureRGBELinearPanoramic( uEnvironment, uEnvironmentSize, uvBase );
    vec3 texel = texturePanorama( uEnvironment, uvBase );
    texel = texturePanorama(uEnvironment, osg_FragTexCoord0);
    gl_FragColor = vec4( texel, 1.0);
}
