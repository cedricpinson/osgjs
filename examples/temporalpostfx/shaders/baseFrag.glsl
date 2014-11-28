#ifdef GL_ES
precision highp float;
#endif
varying vec2 FragTexCoord0;
uniform sampler2D Texture0;


void main (void)
{
  vec2 uv = FragTexCoord0;
  gl_FragColor = vec4(texture2D(Texture0, uv));
}
