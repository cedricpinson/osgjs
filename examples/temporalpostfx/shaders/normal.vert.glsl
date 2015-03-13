
attribute vec3 Vertex;
attribute vec3 Normal;

uniform mat4 ModelViewMatrix;
uniform mat4 ModelWorldMatrix;
uniform mat4 NormalMatrix;
uniform mat4 ProjectionMatrix;

varying vec4 FragPosition;
varying vec4 WorldPosition;
varying vec4 FragNormal;

void main(void) {

  FragPosition = ModelViewMatrix * vec4(Vertex,1.0);
  WorldPosition = ModelWorldMatrix * vec4(Vertex,1.0);
  FragNormal = NormalMatrix * vec4(Vertex,0.0);

  gl_Position = ProjectionMatrix * FragPosition;

}
