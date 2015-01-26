//https://raw.githubusercontent.com/vispy/experimental/master/fsaa/smaa.glsl



/* SMAA implementation. This file defines a few simple shaders that all use
 * the same large codebase that is publicly available.
 *
 * Uses SMAA. Copyright (C) 2011 by Jorge Jimenez, Jose I. Echevarria,
 * Belen Masia, Fernando Navarro and Diego Gutierrez."
 */

// Edge vertex shader
#ifdef _EDGE_VS

attribute vec3 Vertex;
attribute vec2 TexCoord0;

uniform vec2 RenderSize;
uniform mat4 ModelViewMatrix;
uniform mat4 ProjectionMatrix;

varying vec2 FragTexCoord0;
varying vec4 offset[3];

#define SMAA_INCLUDE_VS 1
#define SMAA_INCLUDE_PS 0

#pragma include "smaa.all" "_EDGE_VS"

void main()
{
    gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);
    FragTexCoord0 = TexCoord0;
    SMAAEdgeDetectionVS(TexCoord0, offset);
}
#endif //_EDGE_VS



// Edge fragment shader
#ifdef _EDGE_FS

uniform sampler2D texture0;
uniform vec2 RenderSize;

varying vec2 FragTexCoord0;
varying vec4 offset[3];
varying vec4 dummy2;

#define SMAA_INCLUDE_VS 0
#define SMAA_INCLUDE_PS 1

#pragma include "smaa.all" "_EDGE_FS"

void main()
{
    //gl_FragColor = SMAAColorEdgeDetectionPS(texcoord, offset, texture);
    gl_FragColor.xy = SMAALumaEdgeDetectionPS(FragTexCoord0, offset, texture0);
    //gl_FragColor.a = 1.0; // This is not there originally! Instead turn blending off!!
}
#endif //_EDGE_FS


// Blend vertex shader
#ifdef _BLEND_VS
out vec2 texcoord;
out vec2 pixcoord;
out vec4 offset[3];
out vec4 dummy2;

#define SMAA_ONLY_COMPILE_VS 1
#define SMAA_ONLY_COMPILE_PS 0

#pragma include "smaa.all" "_BLEND_VS"

void main()
{
  texcoord = gl_MultiTexCoord0.xy;
  vec4 dummy1 = vec4(0);
  SMAABlendingWeightCalculationVS(dummy1, dummy2, texcoord, pixcoord, offset);
  gl_Position = ftransform();
}
#endif // _BLEND_VS


// Blend fragment shader

#ifdef _BLEND_FS
uniform sampler2D edge_tex;
uniform sampler2D area_tex;
uniform sampler2D search_tex;

#define SMAA_ONLY_COMPILE_VS 0
#define SMAA_ONLY_COMPILE_PS 1

#pragma include "smaa.all" "_BLEND_FS"


in vec2 texcoord;
in vec2 pixcoord;
in vec4 offset[3];
in vec4 dummy2;
void main()
{
  gl_FragColor = SMAABlendingWeightCalculationPS(texcoord, pixcoord, offset, edge_tex, area_tex, search_tex, ivec4(0));
  //gl_FragColor = texture2D(search_tex, texcoord);//gl_TexCoord[0].xy);
  //gl_FragColor.a = 1.0;

}
#endif //_BLEND_FS


// Neighborhood vertex shader

#ifdef _NEIGH_VS
out vec2 texcoord;
out vec4 offset[2];
out vec4 dummy2;

#define SMAA_ONLY_COMPILE_VS 1
#define SMAA_ONLY_COMPILE_PS 0

#pragma include "smaa.all" "_NEIGH_VS"

void main()
{
  texcoord = gl_MultiTexCoord0.xy;
  vec4 dummy1 = vec4(0);
  SMAANeighborhoodBlendingVS(dummy1, dummy2, texcoord, offset);
  gl_Position = ftransform();
}
#endif //_NEIGH_VS


// Neighborhood fragment shader

#ifdef _NEIGH_FS

#define SMAA_ONLY_COMPILE_VS 0
#define SMAA_ONLY_COMPILE_PS 1

#pragma include "smaa.all" "_NEIGH_FS"

uniform sampler2D texture;
uniform sampler2D blend_tex;
in vec2 texcoord;
in vec4 offset[2];
in vec4 dummy2;
void main()
{
  gl_FragColor = SMAANeighborhoodBlendingPS(texcoord, offset, texture, blend_tex);
  //gl_FragColor = texture2D(blend_tex, texcoord);//gl_TexCoord[0].xy);
  //gl_FragColor.a = 1.0;
}
#endif //_NEIGH_FS
