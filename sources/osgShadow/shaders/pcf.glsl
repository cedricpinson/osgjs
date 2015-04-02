
#pragma include "bandPCF.glsl" "_BAND_PCF"
#pragma include "poissonPCF.glsl" "_POISSON_PCF"
#pragma include "tapPCF.glsl" "_TAP_PCF"

float computeShadow(const in bool lighted,
                    in vec4 shadowVertexProjected,
                    const in sampler2D tex,
                    const in vec4 shadowMapSize,
                    const in vec4 depthRange,
                    const in vec3 LightPosition,
                    const in float N_Dot_L,
                    const in vec3 Normal,
                    const in float bias
    )
{
    #pragma include "shadowsReceiveMain.glsl" "_PCF" "_NONE"
}
