
attribute vec3 Vertex;

uniform mat4 ModelViewMatrix;
uniform mat4 ProjectionMatrix;
uniform mat4 NormalMatrix;

varying vec3 FragNormal;
varying float FragDepth;


void main(void) {
  vec4 pos = ModelViewMatrix * vec4(Vertex,1.0);
  gl_Position = ProjectionMatrix * pos;

  // => NDC (-1, 1) then 0,1
  //FragDepth = (gl_Position.z / gl_Position.w) * 0.5 + 0.5;

  // view space Z
  //FragDepth = pos.z;
   float znear = ProjectionMatrix[3][2] / (ProjectionMatrix[2][2]-1.0);
   float zfar = ProjectionMatrix[3][2] / (ProjectionMatrix[2][2]+1.0);
   float depth = (-pos.z - znear)/(zfar-znear);
   //linear view Z
   FragDepth = depth;
}
