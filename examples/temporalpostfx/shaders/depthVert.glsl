
attribute vec3 Vertex;

uniform mat4 ModelViewMatrix;
uniform mat4 ProjectionMatrix;

varying float FragDepth;


void main(void) {
  vec4 pos = ModelViewMatrix * vec4(Vertex,1.0);
  gl_Position = ProjectionMatrix * pos;

}
