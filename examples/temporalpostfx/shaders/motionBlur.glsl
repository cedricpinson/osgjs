precision highp float;


// Sample the color buffer along the velocity vector.
vec4 motionBlur(sampler2D tex, vec2 texCoord, vec2 velocityFact)
{
    float fact = 5.0;
    vec2 velocityInc = velocityFact / fact;

    // Sample the color buffer along the velocity vector.
    vec4 currentColor = texture2D(tex, texCoord);
    texCoord += velocityInc;
    currentColor += texture2D(tex, texCoord);
    texCoord += velocityInc;
    currentColor += texture2D(tex, texCoord);
    texCoord += velocityInc;
    currentColor += texture2D(tex, texCoord);
    texCoord += velocityInc;
    currentColor += texture2D(tex, texCoord);
    texCoord += velocityInc;

    return  currentColor / fact;

}

#pragma include "colorEncode"


uniform sampler2D Texture0;
uniform sampler2D Texture1;
uniform vec2 RenderSize;

vec2 getVelocity(sampler2D tex, vec2 pos)
{
    vec4 col = texture2D(tex,  pos);

    vec2 vel;
    // clear came on renderbin is broken
    if (false && all(equal(col, vec4(.5,.5,.5,1.))))
        {
            vel = vec2(0.);
        }
    else
        {
           vel = decodeHalfFloatRGBA(col) ;
            vel -= vec2(0.5);
            vel *= 2.0;
        }
    return vel;
}

void main(){
    vec2 screenPos = gl_FragCoord.xy/RenderSize;
    vec2 velocity = getVelocity(Texture0, screenPos);

    vec2 screenPosPrev = screenPos - velocity;
    vec2 velocityPrev = getVelocity(Texture0, screenPosPrev);

    vec4 color;

    if ((abs(velocity.x) > 0.0 || abs(velocity.y) > 0.0) &&
        (abs(velocityPrev.x) > 0.0 || abs(velocityPrev.y) > 0.0))
        {
            //velocity = clamp(velocity, vec2(-0.2),vec2(0.2) );
            color = motionBlur( Texture1, screenPos, velocity);
        }
    else
        {
            color = texture2D(Texture1, screenPos);
            color = vec4(1.0, 0.0, 0.0, 1.0);
        }

    gl_FragColor = vec4(color.rgb, 1.0);
}
