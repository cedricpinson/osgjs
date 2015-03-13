#ifdef GL_ES
precision highp float;
#endif
varying vec2 FragTexCoord0;

uniform sampler2D Texture3;
uniform sampler2D Texture4;


void main (void)
{
  vec2 uv = FragTexCoord0;
  vec4 back  = texture2D(Texture3, uv);
  vec4 front = texture2D(Texture4, uv);

  gl_FragColor = vec4(mix(back.rgb, front.rgb, front.a), 1.0);
}
