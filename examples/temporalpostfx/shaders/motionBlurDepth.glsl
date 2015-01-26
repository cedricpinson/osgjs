precision highp float;

#pragma include "colorEncode"


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

#pragma include "colorEncode"


uniform sampler2D Texture0;
uniform sampler2D Texture1;
uniform vec2 RenderSize;

uniform mat4 viewProjectionInverseMatrix;
uniform mat4 previousViewProjectionMatrix;

uniform float velocityFactor;


void getWorldPosition(in sampler2D tex, in vec2 uv, out vec4 currentPos, out vec4 worldPos)
{
    float zOverW = decodeFloatRGBA( texture2D( tex, uv ) );
    // currenPos NDC [-1, 1]
     currentPos = vec4( uv.x * 2. - 1., uv.y * 2. - 1., zOverW, 1. );
    worldPos = currentPos * viewProjectionInverseMatrix;
    // Divide by w to get the world position.
    worldPos /= worldPos.w;
}

void main(){

    vec2 screenPos = gl_FragCoord.xy/RenderSize;
    vec4 worldPos;
    vec4 currentPos;
    getWorldPosition(Texture0, screenPos, currentPos, worldPos);

    // Use the world position, and transform by the previous view-projection matrix.
    vec4 previousPos = worldPos * previousViewProjectionMatrix;
    // Convert to nonhomogeneous points [-1,1] by dividing by w.
    previousPos /= previousPos.w;


    // Use this frame's position and last frame's to compute the pixel velocity.
    float fact = velocityFactor;
    fact = 1.0;
    vec2 velocity = fact * ( currentPos.xy - previousPos.xy ) * .5;
    //velocity = .01 *  normalize( velocity );

    vec4 color;

    vec4 col = texture2D( Texture0, screenPos );
    if ( all(equal(col, vec4(.5,.5,.5,1.)))){
        velocity = vec2(.0,.0);
    }

    if ((abs(velocity.x) > 0.0 || abs(velocity.y) > 0.0) )
        {
            //velocity = clamp(velocity, vec2(-0.2),vec2(0.2) );
            color = motionBlur( Texture1, screenPos, velocity*5.0);
        }
    else
        {
            color = texture2D(Texture1, screenPos);
            //color = vec4(1.0, 0.0, 0.0, 1.0);
        }
    //color = vec4(velocity, 0.0, 1.0);
    //color = vec4(currentPos.xy, 0.0,1.0);
    gl_FragColor = vec4(color.rgb, 1.0);
}
