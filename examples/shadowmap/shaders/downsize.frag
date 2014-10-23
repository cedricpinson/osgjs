#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D Texture0;
uniform vec4 TexSize;
varying vec2 FragTexCoord0;

void main(void) {
  vec2 shift = TexSize.zw;
  gl_FragColor = texture2D( Texture0,  FragTexCoord0);
}