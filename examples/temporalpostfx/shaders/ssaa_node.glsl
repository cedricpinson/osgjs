float computeDeltaColor(vec3 C, sampler2D colorTex, vec2 texcoord, vec4 renderSize)
{
// Calculate color deltas:
    vec4 delta;

    vec3 Cleft = texture2D(colorTex, vec2(-1., 0.)*renderSize.zw).rgb;
    vec3 t = abs(C - Cleft);
    delta.x = max(max(t.r, t.g), t.b);

    vec3 Ctop = texture2D(colorTex, vec2(0., -1.)*renderSize.zw).rgb;
    t = abs(C - Ctop);
    delta.y = max(max(t.r, t.g), t.b);

// Calculate right and bottom deltas:
    vec3 Cright = texture2D(colorTex, vec2(1., 0.)*renderSize.zw).rgb;
    t = abs(C - Cright);
    delta.z = max(max(t.r, t.g), t.b);

    vec3 Cbottom = texture2D(colorTex, vec2(0., 1.)*renderSize.zw).rgb;
    t = abs(C - Cbottom);
    delta.w = max(max(t.r, t.g), t.b);

// Calculate the maximum delta in the direct neighborhood:
    vec2 maxDelta = max(delta.xy, delta.zw);
    float finalDelta = max(maxDelta.x, maxDelta.y);

// Local contrast adaptation:
    return finalDelta;
}


uniform vec4 renderSize;

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

vec4 texture2DPoint(const in sampler2D tex, const in vec2 uv, const in vec4 size)
{
    vec2 pixelCoord = uv * size.xy + 0.5;

    vec2 f = fract(pixelCoord);

    vec2 nearestPixelCoord = floor(pixelCoord) + vec2(f.x > 0.5 ? 1.0 : 0.0, f.y > 0.5 ? 1.0 : 0.0);

    vec2 nearestUV = nearestPixelCoord * size.zw;

    return texture2D(tex, nearestUV);
}


void temporal(int doEnable, in vec4 currFragColor, out vec4 newFragColor)
{
    newFragColor = currFragColor;
    //if (doEnable == 1 && FrameNum > 1.0)
    {

        // => NDC (-1, 1) then (0, 1)
        //non linear perspective divide
        // could use gl_FragCoord if FS
        vec2 prevScreenTexPos =   (FragPrevScreenPos.xy/ FragPrevScreenPos.w) * 0.5 +  vec2(0.5);

        vec2 screenTexPos =   (FragScreenPos.xy / FragScreenPos.w ) * 0.5 + vec2(0.5) ;
        //non linear perspective divide
        vec2 velocity = (screenTexPos - prevScreenTexPos);

        float fMaxLen = 1e-8;

#ifdef REPROJECTION_CLAMPING
        /////////////
        // 13 antialiasing methods in cryengine 3 p 19
        float fVlenSq = dot(velocity.xy, velocity.xy) + 1e-6f;
        velocity /= fVLenSq;
        // prevTexCoord = screenTexPos.xy + velocity * min(fVlenSq , fMaxLen)
        mediump fBlendW = 0.5 -0.5 * clamp(fVlenSq / fVMaxLen, 0.0, 1.0);
        // fBlendW *= clamp(1.0 - (abs(prevVel - currVel) * fVWeightScale);
//////////////////
#endif // REPROJECTION_CLAMPING

        // prev position color is
        // newFragColor = texture2D(Texture2, prevScreenTexPos.xy);

        vec4 currentColor = currFragColor;
        if ( ((abs(velocity.x) < fMaxLen && abs(velocity.y) < fMaxLen)))
        {

#ifdef COLOR_CLAMPING
            // should blend using four color around and clamp as p_malin
            float deltaColor = computeDeltaColor (currentColor.rgb, Texture2, prevScreenTexPos.xy, renderSize);
#endif


            // same pixel for same projected interpolated vertex on prev frame
            //vec4 prevFragAccumColor = texture2DPoint(Texture2, prevScreenTexPos.xy, renderSize);
            vec4 prevFragAccumColor = texture2D(Texture2, prevScreenTexPos.xy);


            // http://en.wikipedia.org/wiki/Moving_average#Cumulative_moving_average
            // cumulative moving average over frameNum (which starts at 100)
            // Accum(n+1) = Accum(n) + ((x(n+1) - Accum(n)) / (n + 1)))
            float n = FrameNum + 1.0 ;
            newFragColor = prevFragAccumColor + ((currentColor - prevFragAccumColor) / ( n + 1.0 ));
        }
        else if (false)// motion blur test, problem=> we need nearest and mb need linear
        {
            velocity = clamp(velocity, vec2(-8.)*renderSize.zw, vec2(8.)*renderSize.zw);
            newFragColor = mix(currentColor, motionBlur( Texture2, prevScreenTexPos, velocity), 0.5);
        }

    }
}
