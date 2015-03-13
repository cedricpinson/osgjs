#ifdef GL_ES
precision highp float;
#endif
varying vec2 FragTexCoord0;

uniform sampler2D Texture0;
uniform sampler2D Texture1;

uniform float mixTex;
uniform float diffScale;
uniform float slide;

void main (void)
{
  vec2 uv = FragTexCoord0;
  vec4 color0 = vec4(texture2D(Texture0, uv));
  vec4 color1 = vec4(texture2D(Texture1, uv));
  if (mixTex > 0.0){
    gl_FragColor = color0 * mixTex + color1 * (1.0 - mixTex);
  }
  else if (diffScale > 0.0){
    vec4 diff = abs(color0 - color1);
    diff *= diff;
    diff *= diffScale;
    gl_FragColor = diff;
  }
  else if (slide > 0.0){
    float distMiddle = abs(FragTexCoord0.x - slide);
    float border = 0.001;
    if (distMiddle <= border){
      distMiddle = 1.0 - (distMiddle / border);
      if (FragTexCoord0.x < slide)
        gl_FragColor = color0 + vec4( vec3(distMiddle), 1.0);
      else
        gl_FragColor = color1 + vec4( vec3(distMiddle), 1.0);
    }
    else{
      gl_FragColor = (FragTexCoord0.x < slide ) ? color0 : color1;
    }
  }
  else{
      gl_FragColor = color1 ;
  }
}
