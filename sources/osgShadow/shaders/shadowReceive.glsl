#ifdef _OUT_DISTANCE
#define OPT_ARG_outDistance ,out float outDistance
#define OPT_INSTANCE_ARG_outDistance ,outDistance
#else
#define OPT_ARG_outDistance
#define OPT_INSTANCE_ARG_outDistance
#endif

#ifdef _ATLAS_SHADOW
#define OPT_ARG_atlasSize ,const in vec4 atlasSize
#else
#define OPT_ARG_atlasSize
#endif

#ifdef _NORMAL_OFFSET
#define OPT_ARG_normalBias ,const in float normalBias
#else
#define OPT_ARG_normalBias
#endif

#ifdef _JITTER_OFFSET
#define OPT_ARG_jitter ,const in float jitter
#define OPT_INSTANCE_ARG_jitter ,jitter
#else
#define OPT_ARG_jitter
#define OPT_INSTANCE_ARG_jitter
#endif

#pragma include "tapPCF.glsl"

#pragma DECLARE_FUNCTION DERIVATIVES:enable
float shadowReceive(const in bool lighted,
                    const in vec3 normalWorld,
                    const in vec3 vertexWorld,

                    const in sampler2D shadowTexture,

                    const in vec2 shadowSize,
                    const in vec3 shadowProjection,

                    const in vec4 shadowViewRight,
                    const in vec4 shadowViewUp,
                    const in vec4 shadowViewLook,


                    const in vec2 shadowDepthRange,
                    const in float shadowBias
                    OPT_ARG_atlasSize
                    OPT_ARG_normalBias
                    OPT_ARG_outDistance
                    OPT_ARG_jitter) {

    // 0 for early out
    bool earlyOut = false;

    // Calculate shadow amount
    float shadow = 1.0;

    if (!lighted) {
        shadow = 0.0;
#ifndef _OUT_DISTANCE
        earlyOut = true;
#endif // _OUT_DISTANCE
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
    float invDepthRange;

    if (!earlyOut) {

        shadowVertexEye.x = dot(shadowViewRight.xyz, vertexWorld.xyz) + shadowViewRight.w;
        shadowVertexEye.y = dot(shadowViewUp.xyz, vertexWorld.xyz) + shadowViewUp.w;
        shadowVertexEye.z = dot(shadowViewLook.xyz, vertexWorld.xyz) + shadowViewLook.w;
        shadowVertexEye.w = 1.0;


        // derivated, only need z.
        //vec3 shadowLightDir = vec3(0.0, 0.0, 1.0); // in shadow view light is camera
        //shadowNormalEye =  shadowViewMatrix * normalFront;
        //shadowNormalEye.x = dot(shadowViewRight.xyz, normalWorld.xyz);
        //shadowNormalEye.y = dot(shadowViewUp.xyz, normalWorld.xyz);
        shadowNormalEye.z = dot(shadowViewLook.xyz, normalWorld.xyz);
        //shadowNormalEye.w = 0.0;

        //N_Dot_L = dot(shadowNormalEye.xyz, shadowLightDir);
        N_Dot_L = shadowNormalEye.z;

        if (!earlyOut) {

            invDepthRange = 1.0 / (shadowDepthRange.y - shadowDepthRange.x);

#ifdef _NORMAL_OFFSET

            // http://www.dissidentlogic.com/old/images/NormalOffsetShadows/GDC_Poster_NormalOffset.png
            float normalOffsetScale = clamp(1.0  - N_Dot_L, 0.0 , 1.0);
            normalOffsetScale *= abs((shadowVertexEye.z - shadowDepthRange.x) * invDepthRange);
            normalOffsetScale *= max(shadowProjection.x, shadowProjection.y);
            normalOffsetScale *= normalBias * invDepthRange;


            vec4 shadowNormalShift =  vec4(normalWorld, 0.0) * normalOffsetScale;
            shadowNormalEye.x = dot(shadowViewRight.xyz, shadowNormalShift.xyz);
            shadowNormalEye.y = dot(shadowViewUp.xyz, shadowNormalShift.xyz);
            shadowNormalEye.z = dot(shadowViewLook.xyz, shadowNormalShift.xyz);
            shadowNormalEye.w = 0.0;

            vec4 viewShadow = shadowVertexEye + shadowNormalEye;
#else
            vec4 viewShadow = shadowVertexEye;
#endif


            if (shadowProjection.z == 0.0){

               // X, 0, 0, 0,
               // 0, Y, 0, 0,
               // 0, 0, -1, -1,
               // 0, 0, -2.0*znear, 0
               // mat4 shadowProjectionMatrix;
               // shadowProjectionMatrix[0] = vec4(shadowProjection.x, 0.0, 0.0, 0.0 );
               // shadowProjectionMatrix[1] = vec4(0.0, shadowProjection.y, 0.0, 0.0 );
               // shadowProjectionMatrix[2] = vec4(0.0, 0.0, -1.0, -1.0 );
               // shadowProjectionMatrix[3] = vec4(0.0, 0.0, -2.0*shadowDepthRange.x, 0.0 );
               // shadowVertexProjected = shadowProjectionMatrix * shadowVertexEye;

               // derivated optimisation
               shadowVertexProjected.x = shadowProjection.x * viewShadow.x;
               shadowVertexProjected.y = shadowProjection.y * viewShadow.y;

               shadowVertexProjected.z = - viewShadow.z - (2.0 * shadowDepthRange.x * viewShadow.w);
               shadowVertexProjected.w = - viewShadow.z;

            }
            else{
                // lr = 1/(left-right);
                // bt = 1/(bottom-top);
                // nf = 1/(near-far);
                // -2*lr,           0,               0,              0,
                // 0,               -2*bt,           0,              0,
                // 0,               0,               2*nf,           0.0,
                // (left+right)*lr, (top+bottom)*bt, (far+near)*nf), 1
                // here left = -right && top = -bottom
                // float lr = 1.0 / (-2.0 * shadowProjection.x);
                // float bt = 1.0 / (-2.0 * shadowProjection.y);
                // float nf = 1.0 / (shadowDepthRange.x - shadowDepthRange.y);
                float nfNeg = 1.0 / (shadowDepthRange.x - shadowDepthRange.y);
                float nfPos = (shadowDepthRange.x + shadowDepthRange.y)*nfNeg;

                //mat4 shadowProjectionMatrix;
                //shadowProjectionMatrix[0] = vec4(1.0 / shadowProjection.x, 0.0,     0.0,  0.0 );
                //shadowProjectionMatrix[1] = vec4(0.0,     1.0 / shadowProjection.y, 0.0,  0.0 );
                //shadowProjectionMatrix[2] = vec4(0.0,     0.0, 2.0*nfNeg, 0.0 );
                //shadowProjectionMatrix[3] = vec4(0.0,     0.0, nfPos, 1.0 );
                //shadowdertexProjected = shadowProjectionMatrix * shadowVertexEye;

                // derivated optimisation
                shadowVertexProjected.x = viewShadow.x / shadowProjection.x;
                shadowVertexProjected.y = viewShadow.y / shadowProjection.y;

                shadowVertexProjected.z = 2.0 * nfNeg* viewShadow.z + nfPos * viewShadow.w;
                shadowVertexProjected.w = viewShadow.w;

            }


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
            shadowReceiverZ =  (shadowReceiverZ - shadowDepthRange.x) * invDepthRange;

            if(shadowReceiverZ < 0.0) {
                earlyOut = true; // notably behind camera
            }

        }
    }

    // pcf pbias to add on offset
    vec2 shadowBiasPCF = vec2 (0.);

#ifdef GL_OES_standard_derivatives
#ifdef _RECEIVERPLANEDEPTHBIAS
    vec2 biasUV;

    vec3 texCoordDY = dFdx(shadowVertexEye.xyz);
    vec3 texCoordDX = dFdy(shadowVertexEye.xyz);

    biasUV.x = texCoordDY.y * texCoordDX.z - texCoordDX.y * texCoordDY.z;
    biasUV.y = texCoordDX.x * texCoordDY.z - texCoordDY.x * texCoordDX.z;
    biasUV *= 1.0 / ((texCoordDX.x * texCoordDY.y) - (texCoordDX.y * texCoordDY.x));

    // Static depth biasing to make up for incorrect fractional sampling on the shadow map grid
    float fractionalSamplingError = dot(vec2(1.0, 1.0) * shadowSize.xy, abs(biasUV));
    float receiverDepthBias = min(fractionalSamplingError, 0.01);

    shadowBiasPCF.x = biasUV.x;
    shadowBiasPCF.y = biasUV.y;

    shadowReceiverZ += receiverDepthBias;

#else // _RECEIVERPLANEDEPTHBIAS
    shadowBiasPCF.x = clamp(dFdx(shadowReceiverZ) * shadowSize.x, -1.0, 1.0 );
    shadowBiasPCF.y = clamp(dFdy(shadowReceiverZ) * shadowSize.y, -1.0, 1.0 );
#endif

#endif // GL_OES_standard_derivatives


    vec4 clampDimension;

#ifdef _ATLAS_SHADOW
    shadowUV.xy  = ((shadowUV.xy * atlasSize.zw ) + atlasSize.xy) * shadowSize.xy;

    // clamp uv bias/filters by half pixel to avoid point filter on border
    clampDimension.xy = atlasSize.xy + vec2(0.5);
    clampDimension.zw = (atlasSize.xy + atlasSize.zw) - vec2(0.5);

    clampDimension = clampDimension * shadowSize.xyxy;
#else
    clampDimension = vec4(0.0, 0.0, 1.0, 1.0);
#endif // _RECEIVERPLANEDEPTHBIAS


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
        float res = getShadowPCF(shadowTexture,
                                 shadowSize,
                                 shadowUV,
                                 shadowReceiverZ,
                                 shadowBiasPCF,
                                 clampDimension
                                 OPT_INSTANCE_ARG_outDistance
                                 OPT_INSTANCE_ARG_jitter);
#ifdef _OUT_DISTANCE
        if (lighted) shadow = res;
        outDistance *= shadowDepthRange.y - shadowDepthRange.x; // world space distance
#else
        shadow = res;
#endif  // _OUT_DISTANCE
    }

    return shadow;

}
