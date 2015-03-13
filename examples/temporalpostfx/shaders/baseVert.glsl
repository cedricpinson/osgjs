
attribute vec3 Vertex;
attribute vec2 TexCoord0;
varying vec2 FragTexCoord0;
uniform mat4 ModelViewMatrix;
uniform mat4 ProjectionMatrix;

void main(void) {
    gl_Position = ProjectionMatrix * (ModelViewMatrix * vec4(Vertex,1.0));
  FragTexCoord0 = TexCoord0;
}
