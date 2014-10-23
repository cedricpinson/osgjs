#ifdef GL_ES
precision highp float;
#endif
attribute vec3 Vertex;
attribute vec4 Color;
attribute vec3 Normal;
uniform float ArrayColorEnabled;
uniform mat4 ModelViewMatrix;
uniform mat4 ProjectionMatrix;
uniform mat4 NormalMatrix;
varying vec4 VertexColor;
attribute vec2 TexCoord0;
varying vec2 FragTexCoord0;
uniform vec4 MaterialAmbient;
uniform vec4 MaterialDiffuse;
uniform vec4 MaterialSpecular;
uniform vec4 MaterialEmission;
uniform float MaterialShininess;

varying vec3 FragNormal;
varying vec3 FragEyeVector;
varying vec3 FragTexCoord1;


vec4 ftransform() {
  return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);
}
vec3 computeNormal() {
   return vec3(NormalMatrix * vec4(Normal, 0.0));
}

vec3 computeEyeVertex() {
   return vec3(ModelViewMatrix * vec4(Vertex,1.0));
}


void main(void) {
  gl_Position = ftransform();
  if (ArrayColorEnabled == 1.0)
    VertexColor = Color;
  else
    VertexColor = vec4(1.0,1.0,1.0,1.0);
FragTexCoord0 = TexCoord0;
FragTexCoord1.xyz = Vertex.xyz;

  FragEyeVector = computeEyeVertex();
  FragNormal = computeNormal();
}
