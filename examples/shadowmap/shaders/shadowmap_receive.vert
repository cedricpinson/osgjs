#ifdef GL_ES
precision highp float;
#endif

attribute vec3 Vertex;
attribute vec4 Color;
attribute vec3 Normal;

uniform float ArrayColorEnabled;

uniform mat4 ViewMatrix;
uniform mat4 ModelWorldMatrix;
uniform mat4 ProjectionMatrix;
uniform mat4 NormalMatrix;

varying vec4 VertexColor;


attribute vec2 TexCoord0;
varying vec2 FragTexCoord0;


// shadow stuff
uniform float Light0_uniform_enable;
// shadow 0
uniform mat4 Shadow_Projection0;
uniform mat4 Shadow_View0;
uniform vec4 Shadow_DepthRange0;

varying vec4 Shadow_VertexProjected0;
varying vec4 Shadow_Z0;


varying vec3 FragNormal;
varying vec3 FragVector;

#pragma include "common.vert"

void main(void) {

	vec4 Local_Vertex = vec4(Vertex.xyz, 1.0);
	vec4 Local_Normal = vec4(Normal.xyz, 0.0);
	mat4 ProjViewModelWorldMatrix;
	mat4 ModelViewMatrix;
	vec4 WorldPos;
	vec4 WorldNormalPos;
	vec4 EyePos;
	vec4 EyeNormal;
	vec4 ProjEyePos;

	eye_world_transform(ProjectionMatrix, ViewMatrix, ModelWorldMatrix,
		Local_Vertex, Local_Normal,
		ProjViewModelWorldMatrix,  ModelViewMatrix,
		WorldPos, WorldNormalPos,
		EyePos, EyeNormal, ProjEyePos);

	gl_Position 	= ProjEyePos;
	FragVector 		= WorldPos.xyz;
	FragNormal 		= WorldNormalPos.xyz;

	if (ArrayColorEnabled == 1.0)
		VertexColor = Color;
	else
		VertexColor = vec4(1.0,1.0,1.0,1.0);
	gl_PointSize = 1.0;


	// Project the vertex from the light's point of view
	vec4 worldPosition =  WorldPos;
	//#define NUM_STABLE
	if (Light0_uniform_enable != 0.0) {
	    #ifndef NUM_STABLE
			Shadow_Z0 = Shadow_View0 *  worldPosition;
			Shadow_VertexProjected0 = Shadow_Projection0 * Shadow_Z0;
		#else
			Shadow_Z0 =  worldPosition;
			Shadow_VertexProjected0 = Shadow_Projection0 * Shadow_View0 * Shadow_Z0;
	    #endif
	}

	FragTexCoord0 = TexCoord0;
}



