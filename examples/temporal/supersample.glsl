varying vec2 vTexCoord0;
uniform vec2 RenderSize;
uniform sampler2D Texture0;
uniform sampler2D Texture1;
uniform vec4 halton;

vec4 supersample(const in vec4 currFragColor,  const in sampler2D tex, const in vec2 uv, const in vec4 haltonP)
{
    // halton[0-1] : jitter offset
    // halton[2] : 0 disable; 1: supersample, 2: motion blur
    // halton[3] : Frame Number since start of amortized supersample of static frame

    if ( haltonP[2] == 0.0 )
        return currFragColor;

    vec4 res;
    // same pixel for same projected interpolated vertex on prev frame
    vec4  accumColorN = texture2D(tex, uv.xy);

    // supersample
    if ( haltonP[2] == 1.0 ){

        // http://en.wikipedia.org/wiki/Moving_average#Cumulative_moving_average
        // cumulative moving average over frameNum (which starts at 2)
        // n is previous frame
        // accumColorN = Accum(n)
        // return value is accumColor( n +1 )
        // Accum(n+1) = Accum(n) + ((x(n+1) - Accum(n)) / (n + 1)))
        float n = haltonP[3];

        // equation showdown for
        // res = accumColorN + ((currFragColor - accumColorN) / ( n ) );
        // res = accumColorN + colorFrag / n - accumColorN/n
        // res = accumColorN - accumColorN/n + colorFrag / n
        // mix(x, y, a) is x*(1.0 − a) + y*a = x - ax + y*a
        res = mix(accumColorN, currFragColor, 1.0/(n));

        return res;
    }

    // motion blur
    if  ( haltonP[2] == 2.0 ){

        // number of frame to accumulate/blur
        float n = 1.5;

        // here mix is "inverted", as new fragment must be much more inmportant
        // and eventually replace olds
        res = mix(currFragColor, accumColorN, 1.0/n);

        return res;

    }
    /*develblock:start*/
    // debug
    // check dual color alternance
    //res +=  mod(n, 2.0) == 1.0 ? vec4(1.0, 0.0, 0.0, 1.0) : vec4(0.0, 1.0, 0.0, 1.0);
    /*develblock:end*/
    return res;
}

void main()
{
    vec4 currColor = texture2D(Texture0, vTexCoord0.xy);

    vec4 superSample =   supersample(currColor, Texture1, vTexCoord0.xy, halton);


    gl_FragColor = superSample;

}
