#define OPT_ARG_jitter
#define OPT_INSTANCE_ARG_jitter
#define OPT_ARG_outDistance
#define OPT_INSTANCE_ARG_outDistance

#pragma include "pcf.glsl"


#define LIGHT_SIZE 2.0

// http://developer.download.nvidia.com/shaderlibrary/docs/shadow_PCSS.pdf
vec2 findBlocker(const in sampler2D shadowTexture,
                 const in vec2 texCoord,
                 const in float zReceiver,
                 const in vec2 searchWidth,
                 const in vec4 clampDimension) {

    vec2 areaDisk[8];

    areaDisk[0] = vec2(-1.0, -1.0);
    areaDisk[1] = vec2(0.0,  -1.0);
    areaDisk[2] = vec2(1.0,  -1.0);
    areaDisk[3] = vec2(-1.0, 0.0);
    areaDisk[4] = vec2(1.0, 0.0);
    areaDisk[5] = vec2(-1.0, 1.0);
    areaDisk[6] = vec2(0.0,  1.0);
    areaDisk[7] = vec2(1.0,  1.0);


    float blockerSum = 0.0;
    float numBlockers = 0.0;

#define NUM_BLOCK_SEARCH 8

    for (int i = 0; i < NUM_BLOCK_SEARCH; i++) {
        vec2 coord = texCoord + areaDisk[i] * searchWidth;
        float smap = texture2DCompare(shadowTexture, coord, zReceiver, clampDimension);
        if (smap >= 0.0){
            blockerSum += smap;
            numBlockers++;
        }
    }
    return numBlockers == 0.0 ? vec2(0.0, 0.0) : vec2(zReceiver + (blockerSum / numBlockers),
                                                      numBlockers);
}


float getShadowPCSS(                    const in sampler2D shadowTexture,
                                        const in vec4 shadowSize,
                                        const in vec2 shadowUV,
                                        const in float shadowReceiverZ,
                                        const in vec2 shadowBiasPCF,
                                        const in vec4 clampDimension,
                                        const in float nearplane) {

    // blocker search
    vec2 blockers = findBlocker(shadowTexture,
                                shadowUV.xy,
                                shadowReceiverZ,
                                vec2(LIGHT_SIZE)*shadowSize.zw,
                                clampDimension);

    // x has the average depth, y has the total number of blockers
    if (blockers.y == 0.0) {
        // no blockers so no shadowing
        return 1.0;
    }

    float penumbraEstimation = clamp(((blockers.x- shadowReceiverZ - nearplane) / (blockers.x - nearplane)) * LIGHT_SIZE, 4.0, 16.0);

    return getShadowPCF(shadowTexture,
                        shadowSize,
                        shadowUV,
                        shadowReceiverZ,
                        shadowBiasPCF,
                        clampDimension,
                        penumbraEstimation);
}


#pragma DECLARE_FUNCTION DERIVATIVES:enable
float shadowReceive(const in bool lighted,
                    const in vec3 normalWorld,
                    const in vec3 vertexWorld,
                    const in sampler2D shadowTexture,
                    const in vec4 shadowSize,
                    const in mat4 shadowProjectionMatrix,
                    const in mat4 shadowViewMatrix,
                    const in vec4 shadowDepthRange,
                    const in float shadowBias) {

    // 0 for early out
    bool earlyOut = false;

    // Calculate shadow amount
    float shadow = 1.0;

    if (!lighted) {
        shadow = 0.0;
    }

    if (shadowDepthRange.x == shadowDepthRange.y) {
        earlyOut = true;
    }

    vec4 shadowVertexEye;
    vec4 shadowNormalEye;
    float shadowReceiverZ = 0.0;
    vec4 shadowVertexProjected;
    vec2 shadowUV;
    float N_Dot_L;

    if (!earlyOut) {

        shadowVertexEye =  shadowViewMatrix *  vec4(vertexWorld, 1.0);

        vec3 shadowLightDir = vec3(0.0, 0.0, 1.0); // in shadow view light is camera
        vec4 normalFront = vec4(normalWorld, 0.0);
        shadowNormalEye =  shadowViewMatrix * normalFront;
        N_Dot_L = dot(shadowNormalEye.xyz, shadowLightDir);

        if (!earlyOut) {
            shadowVertexProjected = shadowProjectionMatrix * shadowVertexEye;
            if (shadowVertexProjected.w < 0.0) {
                earlyOut = true; // notably behind camera
            }

        }

        if (!earlyOut) {

            shadowUV.xy = shadowVertexProjected.xy / shadowVertexProjected.w;
            shadowUV.xy = shadowUV.xy * 0.5 + 0.5;// mad like

            if (any(bvec4 ( shadowUV.x > 1., shadowUV.x < 0., shadowUV.y > 1., shadowUV.y < 0.))) {
                earlyOut = true;// limits of light frustum
            }

            // most precision near 0, make sure we are near 0 and in [0,1]
            shadowReceiverZ = - shadowVertexEye.z;
            shadowReceiverZ =  (shadowReceiverZ - shadowDepthRange.x) * shadowDepthRange.w;

            if(shadowReceiverZ < 0.0) {
                earlyOut = true; // notably behind camera
            }

        }
    }

    // pcf pbias to add on offset
    vec2 shadowBiasPCF = vec2 (0.);

#ifdef GL_OES_standard_derivatives
    shadowBiasPCF.x = clamp(dFdx(shadowReceiverZ)* shadowSize.z, -1.0, 1.0 );
    shadowBiasPCF.y = clamp(dFdy(shadowReceiverZ)* shadowSize.w, -1.0, 1.0 );
#endif // GL_OES_standard_derivatives


    vec4 clampDimension;
    clampDimension = vec4(0.0, 0.0, 1.0, 1.0);

    // now that derivatives is done and we don't access any mipmapped/texgrad texture we can early out
    // see http://teknicool.tumblr.com/post/77263472964/glsl-dynamic-branching-and-texture-samplers
    if (earlyOut) {
        // empty statement because of weird gpu intel bug
    } else {

        // depth bias: fighting shadow acne (depth imprecsion z-fighting)
        // cosTheta is dot( n, l ), clamped between 0 and 1
        // float shadowBias = 0.005*tan(acos(N_Dot_L));
        // same but 4 cycles instead of 15
        float depthBias = 0.05 * sqrt( 1.0 - N_Dot_L * N_Dot_L) / clamp(N_Dot_L, 0.0005, 1.0);

        // That makes sure that plane perpendicular to light doesn't flicker due to
        // selfshadowing and 1 = dot(Normal, Light) using a min bias
        depthBias = clamp(depthBias, 0.00005, 2.0 * shadowBias);

        // shadowZ must be clamped to [0,1]
        // otherwise it's not comparable to shadow caster depth map
        // which is clamped to [0,1]
        // Not doing that makes ALL shadowReceiver > 1.0 black
        // because they ALL becomes behind any point in Caster depth map
        shadowReceiverZ = clamp(shadowReceiverZ, 0.0, 1.0 -depthBias) - depthBias;

        // Now computes Shadow
        shadow = getShadowPCSS(shadowTexture,
                               shadowSize,
                               shadowUV,
                               shadowReceiverZ,
                               shadowBiasPCF,
                               clampDimension,
                               shadowDepthRange.x * shadowDepthRange.w);
    }

    return shadow;

}
