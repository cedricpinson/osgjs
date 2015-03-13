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

// Intersect ray with AABB, knowing there is an intersection.
//   Dir = Ray direction.
//   Org = Start of the ray.
//   Box = Box is at {0,0,0} with this size.
// Returns distance on line segment.
float IntersectAABB(vec3 Dir, vec3 Org, vec3 Box)
{
  vec3 RcpDir = 1.0 / Dir;
  vec3 TNeg = (  Box  - Org) * RcpDir;
  vec3 TPos = ((-Box) - Org) * RcpDir;
  return max(max(min(TNeg.x, TPos.x), min(TNeg.y, TPos.y)), min(TNeg.z, TPos.z));
}

float HistoryClamp(vec3 History, vec3 Filtered, vec3 NeighborMin, vec3 NeighborMax)
{
  vec3 Min = min(Filtered, min(NeighborMin, NeighborMax));
  vec3 Max = max(Filtered, max(NeighborMin, NeighborMax));
  vec3 Avg2 = Max + Min;
  vec3 Dir = Filtered - History;
  vec3 Org = History - Avg2 * 0.5;
  vec3 Scale = Max - Avg2 * 0.5;
  return clamp(IntersectAABB(Dir, Org, Scale), 0.,1.);
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

    vec2 nearestPixelCoord = floor(pixelCoord) + step (vec2(0.5), f);

    vec2 nearestUV = nearestPixelCoord * size.zw;

    return texture2D(tex, nearestUV, 100.0);
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
        //fMaxLen = 1e-6;



        if (any(lessThan(abs(velocity),  vec2(fMaxLen))))
        {
            bool OffScreen = max(abs(prevScreenTexPos.x), abs(prevScreenTexPos.y)) >= 1.0;


            if (OffScreen)
                return;

            //bool notPixelPerfect = any(notEqual(fract(prevScreenTexPos.xy * renderSize.xy),vec2(0.0)));
            //if (notPixelPerfect)
            //    return;

            //newFragColor = texture2D(Texture2, prevScreenTexPos.xy);

            // same pixel for same projected interpolated vertex on prev frame
            //vec4 prevFragAccumColor = texture2DPoint(Texture2, prevScreenTexPos.xy, renderSize);
            vec4 prevFragAccumColor = texture2D(Texture2, prevScreenTexPos.xy);

            // debug check should be a correct image
            //newFragColor = prevFragAccumColor;
            // return;


//#define HISTORY_CLAMP 1
//#define ACCUM_AVERAGE 1
#define EXP_AVERAGE 1

#if defined(HISTORY_CLAMP)

    vec4 Neighbor0 = texture2D(Texture2, prevScreenTexPos.xy * vec2(-1., -1.)*renderSize.zw);
    vec4 Neighbor1 = texture2D(Texture2, prevScreenTexPos.xy * vec2( 0., -1.)*renderSize.zw);
    vec4 Neighbor2 = texture2D(Texture2, prevScreenTexPos.xy * vec2( 1., -1.)*renderSize.zw);
    vec4 Neighbor3 = texture2D(Texture2, prevScreenTexPos.xy * vec2(-1.,  0.)*renderSize.zw);
    vec4 Neighbor4 = prevFragAccumColor;
    vec4 Neighbor5 = texture2D(Texture2, prevScreenTexPos.xy * vec2( 1.,  0.)*renderSize.zw);
    vec4 Neighbor6 = texture2D(Texture2, prevScreenTexPos.xy * vec2(-1.,  1.)*renderSize.zw);
    vec4 Neighbor7 = texture2D(Texture2, prevScreenTexPos.xy * vec2( 0.,  1.)*renderSize.zw);
    vec4 Neighbor8 = texture2D(Texture2, prevScreenTexPos.xy * vec2( 1.,  1.)*renderSize.zw);

    vec4 NeighborMin = min(min(
        min(min(Neighbor0, Neighbor1), min(Neighbor2, Neighbor3)),
        min(min(Neighbor4, Neighbor5), min(Neighbor6, Neighbor7))), Neighbor8);
    vec4 NeighborMax = max(max(
        max(max(Neighbor0, Neighbor1), max(Neighbor2, Neighbor3)),
        max(max(Neighbor4, Neighbor5), max(Neighbor6, Neighbor7))), Neighbor8);

    vec4 FilteredLow = Neighbor4;


    float n = FrameNum + 1.0 ;
    newFragColor = prevFragAccumColor + ((currentColor - prevFragAccumColor) / ( n + 1.0 ));

    //vec3 outColor = currentColor;
    vec4 outColor = newFragColor;

      // Clamp history, this uses color AABB intersection for tighter fit.
      // Clamping works with the low pass (if available) to reduce flicker.
    float ClampBlend = HistoryClamp(outColor.rgb, FilteredLow.rgb, NeighborMin.rgb, NeighborMax.rgb);

    newFragColor.rgba = mix(outColor.rgba, FilteredLow.rgba, ClampBlend);

#elif  defined(ACCUM_AVERAGE)

            // http://en.wikipedia.org/wiki/Moving_average#Cumulative_moving_average
            // cumulative moving average over frameNum (
            // Accum(n+1) = Accum(n) + ((x(n+1) - Accum(n)) / (n + 1)))
            float n = FrameNum + 1.0 ;
            newFragColor = prevFragAccumColor + ((currentColor - prevFragAccumColor) / ( n + 1.0 ));

#elif defined(EXP_AVERAGE)

            // exponential weighted average
            float alpha = 0.15;// higher discards older data faster
            newFragColor = mix(prevFragAccumColor, currentColor, alpha);

 #endif

        }
        else if (false)// motion blur test, problem=> we need nearest and mb need linear
        {
            //velocity = clamp(velocity, vec2(-2.)*renderSize.zw, vec2(2.)*renderSize.zw);
            float alpha = 0.5;// higher discards older data faster
            newFragColor = mix(motionBlur( Texture2, prevScreenTexPos, velocity), currentColor, alpha);
        }

    }


}
