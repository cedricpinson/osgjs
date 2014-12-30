
void temporal(int doEnable, in vec4 currFragColor, out vec4 newFragColor)
{
  newFragColor = currFragColor;
  //if (doEnable == 1 && FrameNum > 1.0)
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

        vec4 currentColor = currFragColor;
    // should blend using four color around and clamp as p_malin
    if ( ((abs(velocity.x) < 0.00001 && abs(velocity.y) < 0.00001)))
    {
        // same pixel for same projected interpolated vertex on prev frame
        vec4 prevFragAccumColor = texture2D(Texture2, prevScreenTexPos.xy);

        //prevFragAccumColor = vec4(pow(prevFragAccumColor.x, 2.2),pow(prevFragAccumColor.y, 2.2),pow(prevFragAccumColor.z, 2.2), prevFragAccumColor.a);


        // http://en.wikipedia.org/wiki/Moving_average#Cumulative_moving_average
        // cumulative moving average over frameNum (which starts at 100)
        // Accum(n+1) = Accum(n) + ((x(n+1) - Accum(n)) / (n + 1)))
        float n = FrameNum - 1.0;
        newFragColor = prevFragAccumColor + ((currentColor - prevFragAccumColor) / ( n + 1.0));

        //newFragColor = vec4(pow(newFragColor.x, 1.0/2.2),pow(newFragColor.y, 1.0/2.2),pow(newFragColor.z, 1.0/2.2), newFragColor.a);
    }
  }
}
