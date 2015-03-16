attribute vec3 Vertex;
//attribute vec4 Normal;

uniform mat4 ModelViewMatrix;
uniform mat4 ProjectionMatrix;
uniform mat4 NormalMatrix;

varying vec4 FragEyePos;
//varying vec4 FragNormal;


//uniform float bias;
//uniform float texelSize;

void main(void) {
    FragEyePos = ModelViewMatrix * vec4(Vertex,1.0);
    //FragNormal = NormalMatrix * vec4(Normal.xyz,1.0);

    gl_Position = ProjectionMatrix  * FragEyePos;

    //FragEyePos.z += FragEyePos.z * FragNormal.z * bias * 1800. * texelSize;
}
