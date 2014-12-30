
attribute vec3 Vertex;
attribute vec2 TexCoord0;

uniform mat4 ModelViewMatrix;
uniform mat4 ProjectionMatrix;

uniform mat4 PrevModelViewMatrix;
uniform mat4 PrevProjectionMatrix;

// something to draw
varying vec2 FragTexCoord0;

// frame screenpos
varying vec4  FragScreenPos;
// previous frame screenpos
varying vec4  FragPrevScreenPos;

uniform vec2 RenderSize;
uniform float SampleX;
uniform float SampleY;
uniform float FrameNum;
uniform float FactorRender;

void main(void) {

  vec4 pos = ModelViewMatrix * vec4(Vertex,1.0);
  mat4 projMat = ProjectionMatrix;
  if (FrameNum > 100.0){
    // original paper stretch to -1,1 but neighbour pixel will
    // overwrite over neighbour pixel
    // projMat[2][0] += ((SampleX * 2.0) - 1.0) / (RenderSize.x );
    // projMat[2][1] += ((SampleY * 2.0) - 1.0) / (RenderSize.y );
    // here it doesn't as it spread over -0.5+0.5
     projMat[2][0] += ((SampleX ) - 0.5) / (RenderSize.x );
     projMat[2][1] += ((SampleY ) - 0.5) / (RenderSize.y );
  }
  vec4 position = projMat * pos;
  gl_Position = position;

  FragTexCoord0.xy = TexCoord0.xy;
  //projection space
  FragScreenPos = position;

   // compute prev clip space position
  vec4 prevPos = PrevModelViewMatrix * vec4(Vertex,1.0);
  // get previous screen space position:
  vec4 prevPosition = PrevProjectionMatrix * prevPos;
  // projection space
  FragPrevScreenPos = prevPosition;
}
