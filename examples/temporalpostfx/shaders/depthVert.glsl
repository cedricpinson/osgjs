
attribute vec3 Vertex;

uniform mat4 ModelViewMatrix;
uniform mat4 ProjectionMatrix;
uniform mat4 NormalMatrix;

varying vec3 FragNormal;
varying float FragDepth;


void main(void) {
  vec4 pos = ModelViewMatrix * vec4(Vertex,1.0);
  gl_Position = ProjectionMatrix * pos;

  //FragDepth = (gl_Position.z / gl_Position.w) * 0.5 + 0.5;
   FragDepth = pos.z;
}
