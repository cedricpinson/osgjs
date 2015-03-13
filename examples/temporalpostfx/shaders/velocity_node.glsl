
#pragma include "colorEncode"

void velocity(int doEnable, out vec4 result)
{
    // => NDC (-1, 1) then (0, 1)
    //non linear perspective divide
    // could use gl_FragCoord if FS
    vec2 screenTexPos =   (FragScreenPos.xy / FragScreenPos.w ) * 0.5 + vec2(0.5) ;
    //vec2 screenTexPos =   (FragScreenPos.xy  / FragPrevScreenPos.w) ;
    //non linear perspective divide
    vec2 prevScreenTexPos =   (FragPrevScreenPos.xy / FragPrevScreenPos.w) * 0.5 +  vec2(0.5);
    //vec2 prevScreenTexPos =   (FragPrevScreenPos.xy / FragPrevScreenPos.w) ;
    // once substract one from another
    // leads to [0,1] range
    vec2 velocity = (screenTexPos - prevScreenTexPos) * 0.5 +  vec2(0.5);
    // encode the 2 float on vec4 (16bits per float)
    result = encodeHalfFloatRGBA(velocity);
 }
