attribute vec3 Vertex;

uniform mat4 ViewMatrix;
uniform mat4 ModelWorldMatrix;
uniform mat4 ProjectionMatrix;


 varying vec4 FragEyePos;

 void main(void) {
   FragEyePos = ViewMatrix * (ModelWorldMatrix * vec4(Vertex,1.0));
   gl_Position = ProjectionMatrix  * FragEyePos;
}
