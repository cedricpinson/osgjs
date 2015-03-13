#pragma include "colorEncode"

// Sample the color buffer along the velocity vector.
vec4 motionBlur(sampler2D tex, vec2 texCoord, vec2 velocityFact)
{
    vec4 finalColor = vec4( 0. );

    //const int samples = 50;
    //const int samples = 20;
    const int samples = 10;

    float w = 1.0;
    float totalW = 0.0;
    vec2 offsetIncr = vec2( velocityFact  / ( float( samples ) ));
    vec2 offset = vec2( 0.0 );
    for( int i = 0; i < samples; i++ ) {
        finalColor += w * texture2D( tex, texCoord + offset );
        totalW += w;
        w *= 0.8;

        offset -= offsetIncr;
    }
    finalColor /= totalW;
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
     // set to [-2.0,2.0]
    vel -= vec2(0.5);
    vel *= 4.0;
    return vel;
}

uniform sampler2D Texture0;
uniform sampler2D Texture1;
uniform vec2 RenderSize;

void main(){
    vec2 screenPos = gl_FragCoord.xy/RenderSize.xy;
    vec2 velocity = getVelocity(Texture0, screenPos);

    vec2 screenPosPrev = screenPos - velocity;
    vec2 velocityPrev = getVelocity(Texture0, screenPosPrev);

    vec4 color;

    if (any(greaterThan(abs(velocity), vec2(1e-6))))
    {
            color = motionBlur( Texture1, screenPos, -velocity*4.);
    }

    gl_FragColor = vec4(color.rgb, 1.0);
}
