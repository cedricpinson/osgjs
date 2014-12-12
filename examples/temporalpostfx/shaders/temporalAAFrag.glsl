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
varying vec3 FragPos;
varying float FragDepth;

// previous frame screenpos
varying vec4  FragPreScreenPos;
// previous frame depth
varying float FragPrevDepth;

uniform mat4 PrevProjectionMatrix;

uniform sampler2D Texture0;
uniform sampler2D Texture1;
uniform sampler2D Texture2;

uniform vec2 RenderSize;

/** Morgan McGuire Deep G-buffer
    Reconstruct camera-space P.xyz from screen-space S = (x, y) in
    pixels and camera-space z < 0.  Assumes that the upper-left pixel center
    is at (0.5, 0.5) [but that need not be the location at which the sample tap
    was placed!]

    Costs 3 MADD.  Error is on the order of 10^3 at the far plane, partly due to z precision.

 projInfo = vec4(-2.0f / (RenderSize;X*P[0][0]),
          -2.0f / (RenderSize;Y*P[1][1]),
          ( 1.0f - P[0][2]) / P[0][0],
          ( 1.0f + P[1][2]) / P[1][1])

    where P is the projection matrix that maps camera space points
    to [-1, 1] x [-1, 1].  That is, Camera::getProjectUnit().
*/
vec3 reconstructCSPosition(vec2 S, float z, vec4 projInfo) {
    return vec3((S.xy * projInfo.xy + projInfo.zw) * z, z);
}

void main(void) {

  // => NDC (-1, 1) then (0, 1)
  //non linear perspective divide
  vec2 screenPos =   (FragScreenPos.xy / FragScreenPos.w) * 0.5 + vec2(0.5) ;

  //non linear perspective divide
  vec2 prevScreenPos =   (FragPreScreenPos.xy / FragPreScreenPos.w) * 0.5 + vec2(0.5);


  float prevFragDepth = unpack4x8ToFloat(texture2D(Texture2, prevScreenPos.xy));

  // compare current reprojected vertex with old matrix
 // with value in previous depth buffer

  /*
   vec4 projInfo = vec4(-2.0 / (RenderSize.x*PrevProjectionMatrix[0][0]),
           -2.0 / (RenderSize.y*PrevProjectionMatrix[1][1]),
          ( 1.0 - PrevProjectionMatrix[0][2]) / PrevProjectionMatrix[0][0],
          ( 1.0 + PrevProjectionMatrix[1][2]) / PrevProjectionMatrix[1][1]);

  vec3 prevFragPos = reconstructCSPosition(prevScreenPos, prevFragDepth, projInfo);
*/

  float diffDepth = abs(prevFragDepth - FragPrevDepth);
  //float diffDepth = abs(prevFragPos.z - FragPrevDepth);
  // 0.01 arbitrary, should come from "[AS06] Minimum triangle separation for correct z-buffer occlusion"
  bool previousFramePixelOk = diffDepth < 0.1;


  if (previousFramePixelOk){
    //temporalAA
      // supposed to be uniform moving around the clock
  float sampleX = 1.0;
  float sampleY = 1.0;

   vec2 prevScreenPosJitter = prevScreenPos;
   prevScreenPosJitter.x += sampleX / RenderSize.x;
   prevScreenPosJitter.y += sampleY / RenderSize.y;

    float prevFragDepthJit = unpack4x8ToFloat(texture2D(Texture2, prevScreenPosJitter.xy));
    gl_FragColor.rgb = vec3((FragDepth + prevFragDepthJit) * 0.5);
    //gl_FragColor.rgb = vec3(0.0,1.0,0.0);
  }
  else{
    // no TemporalAA
    gl_FragColor.rgb = vec3(FragDepth);
  }
  gl_FragColor.a = 1.0;

  //gl_FragColor = vec4((previousFramePixelOk ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0)), 1.0);
  //gl_FragColor = vec4( vec3(diffDepth), 1.0);
   /*
   vec2 screenPosGL = gl_FragCoord.xy / RenderSize.xy;
   // show screen pos diff (sort of velocity, rgb(0.5,0.5,0.0) is middle)
   gl_FragColor = vec4( (prevScreenPos.xy - screenPos.xy)* 0.5 + vec2(0.5) , 0.0,1.0);
   */
}
