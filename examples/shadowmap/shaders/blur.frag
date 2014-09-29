
#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D Texture0;
varying vec4 FragTexCoord0;
uniform vec2 RenderSize;


uniform int Orientation;
uniform int BlurAmount;
uniform float BlurScale;
uniform float BlurStrength;

float Gaussian(float x, float deviation)
{
    return(1.0 / sqrt(2.0 * 3.141592 * deviation)) * exp(-((x * x) / (2.0 * deviation)));
}


void main(void)
{
    float halfBlur = float(BlurAmount) * 0.5;
    vec4 colour = vec4(0.0);
    vec4 texColour = vec4(0.0);
    /* Gaussian deviation*/
    float deviation = halfBlur * 0.35;
    deviation *= deviation;
    float strength = 1.0 - BlurStrength;
    if(Orientation == 0) {
    	/* Horizontal blur */
        for(int i = 0; i < 50; ++i)
        {
            if(i >= BlurAmount)
            	break;
            float offset = float(i) - halfBlur;
            vec2 texCoord = FragTexCoord0.xy + vec2(offset * (1.0 / RenderSize.x) * BlurScale, 0.0);
            texColour = texture2D(Texture0, texCoord);
            texColour.rgb += texColour.rgb / texColour.a;
            colour += texColour * Gaussian(offset * strength, deviation);
        }
    }
    else
    {
    	/*Vertical blur*/
        for(int i = 0; i < 50; ++i)
        {
            if(i >= BlurAmount) break;
            float offset = float(i) - halfBlur;
            vec2 texCoord = FragTexCoord0.xy + vec2(0.0, offset * (1.0 / RenderSize.y) * BlurScale);
            texColour = texture2D(Texture0, texCoord);
            texColour.rgb += texColour.rgb / texColour.a;
            colour += texColour * Gaussian(offset * strength, deviation);
        }
    }
    /* Apply colour */
    gl_FragColor = clamp(colour, 0.0, 1.0);
    gl_FragColor.rgb *= gl_FragColor.a;
}