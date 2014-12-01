
attribute vec3 Vertex;
attribute vec2 TexCoord0;

uniform mat4 ModelViewMatrix;
uniform mat4 ProjectionMatrix;

uniform mat4 PrevModelViewMatrix;
uniform mat4 PrevProjectionMatrix;

// something to draw
varying float FragDepth;
varying vec4  FragScreenPos;
varying vec2 FragTexCoord0;

// previous frame screenpos
varying vec4  FragPreScreenPos;
// previous frame depth
varying float FragPrevDepth;

void main(void) {

  vec4 pos = ModelViewMatrix * vec4(Vertex,1.0);
  vec4 position = ProjectionMatrix * pos;
  gl_Position = position;
  FragTexCoord0.xy = TexCoord0.xy;
  //projection space
  FragScreenPos = position;

  // => NDC (-1, 1) then 0,1
  //FragDepth = (position.z/position.w) * 0.5 + 0.5;
  // View space Z
  FragDepth = pos.z;
   // compute prev clip space position
  vec4 prevPos = PrevModelViewMatrix * vec4(Vertex,1.0);
  // get previous screen space position:
  vec4 prevPosition = PrevProjectionMatrix * prevPos;

  // get previous depth
  // ndc (-1, 1) then 0,1
  //FragPrevDepth = (prevPosition.z / prevPosition.w) * 0.5 + 0.5;;
  // View space Z
  FragPrevDepth = prevPos.z;

  //clip space
  //prevPosition.xyz /= prevPosition.w;
  //prevPosition.xy = prevPosition.xy * 0.5 + 0.5;
  // projection space
  FragPreScreenPos = prevPosition;
}
