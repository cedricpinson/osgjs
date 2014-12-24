attribute vec3 Vertex;

uniform mat4 ModelViewMatrix;
uniform mat4 ProjectionMatrix;

void main(void) {
    gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);
}
