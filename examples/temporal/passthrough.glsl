

varying vec2 vTexCoord0;
uniform vec2 RenderSize;

uniform sampler2D Texture0;
uniform sampler2D Texture1;
uniform sampler2D Texture2;

uniform vec4 halton;

void main()
{
    // halton[0-1] : jitter offset
    // halton[2] : 0 disable; 1: supersample, 2: motion blur
    // halton[3] : Frame Number since start of amortized supersample of static frame

    vec4 superSampleResult = (mod(halton[3], 2.0) == 0.0) ? texture2D(Texture0, vTexCoord0) : texture2D(Texture1, vTexCoord0);

    gl_FragColor = superSampleResult;

}
