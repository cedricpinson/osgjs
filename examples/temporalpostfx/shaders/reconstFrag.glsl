#ifdef GL_ES
precision highp float;
#endif

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

uniform mat4 ProjectionMatrix;

varying vec2  FragTexCoord0;
varying vec4  FragScreenPos;
varying float FragDepth;

// previous frame screenpos
varying vec4  FragPreScreenPos;
// previous frame depth
varying float FragPrevDepth;


uniform sampler2D Texture0;
uniform vec2 RenderSize;


void main(void) {

  // => NDC (-1, 1) then (0, 1)
  //non linear perspective divide
  vec2 screenPos =   (FragScreenPos.xy / FragScreenPos.w) * 0.5 + vec2(0.5) ;
  //screenPos.xy =   FragScreenPos.xy ;

  //non linear perspective divide
  vec2 prevScreenPos =   (FragPreScreenPos.xy / FragPreScreenPos.w) * 0.5 + vec2(0.5);



  float prevPosition = unpack4x8ToFloat(texture2D(Texture0, prevScreenPos.xy));
  bool previousFramePixelOk = abs(prevPosition - FragPrevDepth) < 0.01;
  gl_FragColor = vec4(previousFramePixelOk ? vec3(FragDepth) : vec3(1.0,0.0,0.0), 1.0);


  //gl_FragColor = vec4(vec3(abs(prevPosition - FragPrevDepth)), 1.0);
  //gl_FragColor = texture2D(Texture0, FragTexCoord0.xy);
  //gl_FragColor = vec4(vec3(prevPosition), 1.0);


  //gl_FragColor = vec4( prevScreenPos.xy, 0.0,1.0);
  // gl_FragColor = vec4( screenPos.xy, 0.0,1.0);


  vec2 screenPosGL = gl_FragCoord.xy / RenderSize.xy;
  //   gl_FragColor = vec4( screenPosGL.xy , 0.0 ,1.0);
  //gl_FragColor = vec4( prevScreenPos.xy, 0.0 ,1.0);
  //gl_FragColor = vec4( screenPos.xy, 0.0 ,1.0);

  //gl_FragColor = vec4( (screenPos.xy - screenPosGL.xy) * 0.5 + vec2(0.5), 0.0 ,1.0);
  //gl_FragColor = vec4( (prevScreenPos.xy - screenPosGL.xy)* 0.5 + vec2(0.5) , 0.0 ,1.0);

 // show screen pos diff (sort of velocity)
  // gl_FragColor = vec4( (screenPos.xy - prevScreenPos.xy) , 0.0,1.0);
   gl_FragColor = vec4( (prevScreenPos.xy - screenPos.xy)* 0.5 + vec2(0.5) , 0.0,1.0);
}
