#ifdef GL_ES
precision highp float;
#endif

uniform mat4 ProjectionMatrix;

uniform sampler2D Texture0;
uniform sampler2D Texture1;
uniform sampler2D Texture2;
varying vec2 FragTexCoord0;

varying float FragDepth;

vec4 packFloatTo4x8(in float v) {
  vec4 enc = vec4(1.0, 255.0, 65025.0, 160581375.0) * v;
  enc = fract(enc);
  enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);
  return enc;
}


vec4 pack2FloatTo4x8(in vec2 val) {
  const vec2 bitSh = vec2(256.0, 1.0);
  const vec2 bitMsk = vec2(0.0, 1.0/256.0);
  vec2 res1 = fract(val.x * bitSh);
  res1 -= res1.xx * bitMsk;
  vec2 res2 = fract(val.y * bitSh);
  res2 -= res2.xx * bitMsk;
  return vec4(res1.x,res1.y,res2.x,res2.y);
}

float unpack4x8ToFloat( vec4 rgba ) {
  return dot( rgba, vec4(1.0, 1.0/255.0, 1.0/65025.0, 1.0/160581375.0) );
}

vec2 unrpack4x8To2Float(in vec4 val) {
  const vec2 unshift = vec2(1.0/256.0, 1.0);
  return vec2(dot(val.xy, unshift), dot(val.zw, unshift));
}


void main(void) {
  gl_FragColor = packFloatTo4x8(FragDepth);

  /*
  gl_FragColor.rgb = texture2D(Texture2, FragTexCoord0.xy).rgb;
  gl_FragColor.a = 1.0;//FragDepth;
  */
}
