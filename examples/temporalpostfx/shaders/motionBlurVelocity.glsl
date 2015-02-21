#pragma include "colorEncode"

// Sample the color buffer along the velocity vector.
vec4 motionBlur(sampler2D tex, vec2 texCoord, vec2 velocityFact)
{
    vec4 finalColor = vec4( 0. );
    vec2 offset = vec2( 0. );
    float weight = 0.;
    //const int samples = 20;
    const int samples = 5;
    for( int i = 0; i < samples; i++ ) {
        offset = velocityFact * ( float( i ) / ( float( samples ) - 1. ) - .5 );
        vec4 c = texture2D( tex, texCoord + offset );
        finalColor += c;
    }
    finalColor /= float( samples );
    return finalColor;
}

vec2 getVelocity(sampler2D tex, vec2 pos)
{
    vec4 col = texture2D(tex,  pos);

    //if ( all(equal(col, vec4(.5,.5,.5,1.))))
    //    return vec2(0.);

    // clear came on renderbin is broken
    vec2 vel;
    vel = decodeHalfFloatRGBA(col) ;
     // set to [-1.0,1.0]
    vel -= vec2(0.5);
    vel *= 2.0;
    return vel;
}

uniform sampler2D Texture0;
uniform sampler2D Texture1;
uniform vec2 RenderSize;

void main(){
    vec2 screenPos = gl_FragCoord.xy/RenderSize;
    vec2 velocity = getVelocity(Texture0, screenPos);

    vec2 screenPosPrev = screenPos - velocity;
    vec2 velocityPrev = getVelocity(Texture0, screenPosPrev);

    vec4 color;

    if ((abs(velocity.x) > 0.0 || abs(velocity.y) > 0.0)
        /* &&     (abs(velocityPrev.x) > 0.0 || abs(velocityPrev.y) > 0.0)*/
        )
        {
            //velocity = clamp(velocity, vec2(-0.2), vec2(0.2) );
            //color = motionBlur( Texture1, screenPos, (velocity + velocityPrev)*0.0675);

            velocity = clamp(velocity, vec2(-8.)/RenderSize.xy, vec2(8.)/RenderSize.xy);
            color = motionBlur( Texture1, screenPos, velocity);
        }
    else
        {
            color = texture2D(Texture1, screenPos);
            //color = vec4(1.0, 0.0, 0.0, 1.0);
        }

    gl_FragColor = vec4(color.rgb, 1.0);
}
