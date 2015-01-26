precision highp float;

#pragma include "colorEncode"

varying vec4 FragPosition;

void main()
{
   //linear ndc Z
  float depth = gl_FragCoord.z;
  gl_FragColor = encodeFloatRGBA(depth);

}
