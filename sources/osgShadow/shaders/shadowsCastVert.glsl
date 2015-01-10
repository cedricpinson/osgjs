attribute vec3 Vertex;

uniform mat4 ModelViewMatrix;
uniform mat4 ProjectionMatrix;


varying vec4 FragEyePos;

void main(void) {
    FragEyePos = ModelViewMatrix * vec4(Vertex,1.0);
    gl_Position = ProjectionMatrix  * FragEyePos;
}
