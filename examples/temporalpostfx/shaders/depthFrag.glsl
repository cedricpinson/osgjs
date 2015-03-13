precision highp float;

#pragma include "colorEncode"

varying vec4 FragPosition;
uniform vec2 NearFar;

void main()
{
   //linear ndc
    float depth;
    depth = gl_FragCoord.z ;
    // linear view space depth
    //depth = FragPosition.z ;
    //depth = depth - NearFar[0] / (NearFar[1] - NearFar[0]);



    gl_FragColor = encodeFloatRGBA(depth);

}
