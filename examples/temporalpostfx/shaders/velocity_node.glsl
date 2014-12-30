
#pragma include "colorEncode"

vec4 velocity(int doEnable, out vec4 result)
{
    // => NDC (-1, 1) then (0, 1)
    //non linear perspective divide
    // could use gl_FragCoord if FS

    vec2 screenTexPos =   (FragScreenPos.xy / FragScreenPos.w ) * 0.5 + vec2(0.5) ;
    vec2 screenPos =   (FragScreenPos.xy ) ;

    //non linear perspective divide
    vec2 prevScreenTexPos =   (FragPrevScreenPos.xy/ FragPrevScreenPos.w) * 0.5 +  vec2(0.5);
    vec2 prevScreenPos =   (FragPrevScreenPos.xy);

    vec2 velocity = screenPos - prevScreenPos;
    velocity *= 0.5;
    velocity += 0.5;
    //result = vec4(velocity.x, velocity.y, 0.0, 1.0);

// encode the 2 float on vec4 (16bits per float)
    result = encodeHalfFloatRGBA(velocity);
    return result;
}
