attribute vec3 Vertex;
attribute vec3 Normal;
attribute vec2 TexCoord0;
attribute vec4 Tangent;

uniform mat4 ModelViewMatrix;
uniform mat4 ProjectionMatrix;
uniform mat4 NormalMatrix;


varying vec3 osg_FragNormal;
varying vec2 osg_FragTexCoord0;

void main(void) {
    osg_FragNormal = vec3(NormalMatrix * vec4(Normal, 0.0));
    osg_FragTexCoord0 = TexCoord0;
    gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);
}
