
#pragma include "tapPCF.glsl"

#ifdef _ATLAS_SHADOW

float computeShadow(const in bool lighted,
                    const in sampler2D tex,
                    const in vec4 shadowMapSize,
                    const in vec4 shadowTextureSize,
                    const in mat4 shadowProjectionMatrix,
                    const in mat4 shadowViewMatrix,
                    const in vec4 depthRange,
                    const in float N_Dot_L,
                    const in vec3 vertexWorld,
                    const in float bias
    )
#else
    
float computeShadow(const in bool lighted,
                    const in sampler2D tex,
                    const in vec4 shadowTextureSize,
                    const in mat4 shadowProjectionMatrix,
                    const in mat4 shadowViewMatrix,
                    const in vec4 depthRange,
                    const in float N_Dot_L,
                    const in vec3 vertexWorld,
                    const in float bias
    )
    
#endif
{
                        
    #pragma include "shadowsReceiveMain.glsl"

}

