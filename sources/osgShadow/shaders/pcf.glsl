
#pragma include "tapPCF.glsl"

#ifdef _ATLAS_SHADOW

float computeShadow(const in bool lighted,
                    const in sampler2D tex,
                    const in vec4 shadowMapSize,
                    const in vec4 shadowTextureSize,
                    const in mat4 shadowProjectionMatrix,
                    const in mat4 shadowViewMatrix,
                    const in vec4 depthRange,
                    const in vec3 normalWorld,
                    const in vec3 vertexWorld,                    
                    const in float bias
#ifdef _NORMAL_OFFSET
                    ,const in float normalBias
#endif //_NORMAL_OFFSET
                    
    )
#else
    
float computeShadow(const in bool lighted,
                    const in sampler2D tex,
                    const in vec4 shadowTextureSize,
                    const in mat4 shadowProjectionMatrix,
                    const in mat4 shadowViewMatrix,
                    const in vec4 depthRange,
                    const in vec3 normalWorld,
                    const in vec3 vertexWorld,
                    const in float bias
#ifdef _NORMAL_OFFSET
                    ,const in float normalBias
#endif //_NORMAL_OFFSET

   )
    
#endif
{
                        
    #pragma include "shadowsReceiveMain.glsl"

}

