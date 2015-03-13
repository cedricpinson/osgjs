#ifdef GL_ES
precision highp float;
#endif

varying vec2 FragTexCoord0;
varying vec4 FragNormal;
varying vec4 FragPosition;

uniform sampler2D Texture0;


void main (void)
{
    // UV chart with texture
    //gl_FragColor = vec4(texture2D(Texture0, FragTexCoord0));

    // UV chart with normal
    gl_FragColor = vec4( vec3(normalize(FragNormal.xyz)), 1.0);
}
