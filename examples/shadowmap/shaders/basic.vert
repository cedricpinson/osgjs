#ifdef GL_ES
precision highp float;
#endif

attribute vec3 Vertex;
attribute vec2 TexCoord0;

uniform mat4 ViewMatrix;
uniform mat4 ModelWorldMatrix;
uniform mat4 ProjectionMatrix;
uniform vec4 fragColor;

varying vec2 FragTexCoord0;


void main(void) {
    gl_Position = ProjectionMatrix * ViewMatrix * ModelWorldMatrix *  vec4(Vertex,1.0);
	FragTexCoord0 = TexCoord0;
}