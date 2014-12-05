
attribute vec3 Vertex;
attribute vec2 TexCoord0;
attribute vec2 TexCoord1;
attribute vec2 TexCoord2;

uniform mat4 ModelViewMatrix;
uniform mat4 ProjectionMatrix;
uniform mat4 NormalMatrix;

varying vec3 FragNormal;
varying float FragDepth;
varying vec2 FragTexCoord0;


void main(void) {
  vec4 pos = ModelViewMatrix * vec4(Vertex,1.0);
  gl_Position = ProjectionMatrix * pos;
  FragTexCoord0.xy = TexCoord0.xy;

  // => NDC (-1, 1) then 0,1
  //FragDepth = (gl_Position.z / gl_Position.w) * 0.5 + 0.5;

  // view space Z
  //FragDepth = pos.z;
  float znear = 1.0;//ProjectionMatrix[3][2] / (ProjectionMatrix[2][2]-1.0);
  float zfar = 2.0;//ProjectionMatrix[3][2] / (ProjectionMatrix[2][2]+1.0);
   float depth = ((-pos.z - znear)/(zfar-znear)) ;

   //linear view Z
   FragDepth = depth;

}
