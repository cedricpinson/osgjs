#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D Texture0;
uniform vec4 TexSize;
varying vec2 FragTexCoord0;


vec4 getSmoothTexelFilter(vec2 uvin) {
  vec2 shift = TexSize.zw;
  vec2 uv = uvin;
  vec4 c = texture2D( Texture0,  uv);
  c += texture2D( Texture0, uv+vec2(0,shift.y));
  c += texture2D( Texture0, uv+vec2(shift.x,shift.y));
  c += texture2D( Texture0, uv+vec2(shift.x,0));
  c += texture2D( Texture0, uv+vec2(shift.x,-shift.y));
  c += texture2D( Texture0, uv+vec2(0,-shift.y));
  c += texture2D( Texture0, uv+vec2(-shift.x,-shift.y));
  c += texture2D( Texture0, uv+vec2(-shift.x,0));
  c += texture2D( Texture0, uv+vec2(-shift.x,shift.y));
  return c / 9.0;
}

void main(void) {
   gl_FragColor = getSmoothTexelFilter(FragTexCoord0);
}