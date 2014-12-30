#ifdef GL_ES
precision highp float;
#endif


uniform mat4 ProjectionMatrix;
uniform mat4 PrevProjectionMatrix;

varying vec2  FragTexCoord0;


uniform sampler2D Texture0;
uniform sampler2D Texture1;
uniform sampler2D Texture2;

uniform vec2 RenderSize;
uniform float SampleX;
uniform float SampleY;
uniform float FrameNum;
// current frame screen Pos
varying vec4  FragScreenPos;
// previous frame screenpos
varying vec4  FragPrevScreenPos;


/////////////////////
////

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

void main(void) {

  // => NDC (-1, 1) then (0, 1)
  //non linear perspective divide
  // could use gl_FragCoord if FS
  vec2 screenTexPos =   (FragScreenPos.xy / FragScreenPos.w ) * 0.5 + vec2(0.5) ;
  vec2 screenPos =   (FragScreenPos.xy ) ;
  //non linear perspective divide
  vec2 prevScreenTexPos =   (FragPrevScreenPos.xy/ FragPrevScreenPos.w) * 0.5 + vec2(0.5);
  vec2 prevScreenPos =   (FragPrevScreenPos.xy);

  vec2 velocity = screenPos - prevScreenPos;

  if (false && FrameNum < 100.0){
      // first Frames
      gl_FragColor =  texture2D(Texture0, FragTexCoord0.xy);
  }
  else
  {

    if ( ((abs(velocity.x) < 0.001 && abs(velocity.y) < 0.001)))
    {
      // add jittering
      // should use Randomized halton
      // as in https://de45xmedrsdbp.cloudfront.net/Resources/files/TemporalAA_small-59732822.pdf#page=14
      // which in gl glsls
      // is like  https://github.com/smalld/particle_system/blob/master/ParticleSystem/shaders/system6.gi.compute.glsl
      // but for now... done js side
      // around the clock sample my ass.
      //vec2 prevScreenPosJitter = prevScreenPos;
      //prevScreenPosJitter.x += SampleX / RenderSize.x;
      //prevScreenPosJitter.y += SampleY / RenderSize.y;

        vec4 currentColor = texture2D(Texture0, FragTexCoord0.xy);
        vec4 prevFragAccumColor = texture2D(Texture2, prevScreenTexPos.xy);
        //vec4 prevFragAccumColor = texture2D(Texture2, prevScreenPosJitter.xy);

        // http://en.wikipedia.org/wiki/Moving_average#Cumulative_moving_average
        // cumulative moving average over frameNum (which starts at 100)
        // Accum(n+1) = Accum(n) + ((x(n+1) - Accum(n)) / (n + 1)))

        vec4 accum = prevFragAccumColor + ((currentColor - prevFragAccumColor) / ( FrameNum - 99.0));
        // vec4 accum = prevFragAccumColor + ((currentColor - prevFragAccumColor) / (2.0));

        gl_FragColor = accum;
        // gl_FragColor = (currentColor + accum) * 0.5;
        // gl_FragColor.a = 1.0;


    }
    else{
      // no TemporalAA
      if (true){
        // motion blur
        // http://http.developer.nvidia.com/GPUGems3/gpugems3_ch27.html
                gl_FragColor = motionBlur(Texture0, FragTexCoord0.xy, velocity.xy);
                //gl_FragColor = motionBlur(Texture2, screenTexPos.xy, velocity.xy);
      }
      else{
        // nothing
        gl_FragColor =  texture2D(Texture0, FragTexCoord0.xy);
      }
    }

  }

  //gl_FragColor = gl_FragColor*0.5 + 0.5*vec4(abs(screenPos.x - prevScreenPos.x), abs(screenPos.y - prevScreenPos.y), 0.0, 1.0);
  //gl_FragColor = vec4(screenPos.x,screenPos.y, distance(screenPos, prevScreenPos), 1.0);
}
