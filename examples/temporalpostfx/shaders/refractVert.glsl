
attribute vec3 Vertex;
attribute vec3 Normal;
attribute vec2 TexCoord0;

varying vec2 FragTexCoord0;
varying vec4 FragNormal;
varying vec4 FragPosition;

uniform mat4 ModelViewMatrix;
uniform mat4 NormalMatrix;
uniform mat4 ProjectionMatrix;

void main(void) {
    FragPosition = ModelViewMatrix * vec4(Vertex,1.0);
    FragNormal = NormalMatrix * vec4(Normal,0.0);
    FragTexCoord0 = TexCoord0;

    gl_Position = ProjectionMatrix * FragPosition;
}
