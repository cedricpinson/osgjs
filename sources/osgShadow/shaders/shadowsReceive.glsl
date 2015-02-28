//begin shadows

#pragma include "colorEncode.glsl"

// see shadowSettings.js header for shadow algo param explanations

// end Float codec
float getSingleFloatFromTex(sampler2D depths, vec2 uv){
#ifndef _FLOATTEX
    return  decodeFloatRGBA(texture2D(depths, uv));
#else
    return texture2D(depths, uv).x;
#endif
}

vec2 getDoubleFloatFromTex(sampler2D depths, vec2 uv){
#ifndef _FLOATTEX
    return decodeHalfFloatRGBA(texture2D(depths, uv));
#else
    return texture2D(depths, uv).xy;
#endif
}

vec4 getQuadFloatFromTex(sampler2D depths, vec2 uv){
    return texture2D(depths, uv).xyzw;
}
// end Float codec


#pragma include "vsm.glsl" "_VSM"

#pragma include "evsm.glsl" "_EVSM"

#pragma include "esm.glsl" "_ESM"

#pragma include "bandPCF.glsl" "_BAND_PCF"
#pragma include "poissonPCF.glsl" "_POISSON_PCF"
#pragma include "tapPCF.glsl" "_TAP_PCF"


// SHADOWS
float getShadowedTermUnified(const in vec2 shadowUV, const in float shadowReceiverZ,
                             const in sampler2D tex, const in vec4 shadowMapSize,
                             const in float epsilonVSM,
                             const in float exponent0, const in float exponent1) {


    // Calculate shadow amount
    float shadow = 1.0;

    // return 0.0 for black;
    // return 1.0 for light;


#ifdef _NONE

    float shadowDepth = getSingleFloatFromTex(tex, shadowUV.xy);
    // shadowReceiverZ : receiver depth in light view
    // shadowDepth : caster depth in light view
    // receiver is shadowed if its depth is superior to the caster
    shadow = ( shadowReceiverZ > shadowDepth ) ? 0.0 : 1.0;

#elif defined( _PCF )

    shadow = getShadowPCF(tex, shadowMapSize, shadowUV, shadowReceiverZ);

#elif defined( _ESM )

    shadow = fetchESM(tex, shadowMapSize, shadowUV, shadowReceiverZ, exponent0, exponent1);

#elif  defined( _VSM )

    vec2 moments = getDoubleFloatFromTex(tex, shadowUV.xy);
    shadow = chebyshevUpperBound(moments, shadowReceiverZ, epsilonVSM);

#elif  defined( _EVSM )

    vec4 occluder = getQuadFloatFromTex(tex, shadowUV.xy);
    vec2 exponents = vec2(exponent0, exponent1);
    vec2 warpedDepth = warpDepth(shadowReceiverZ, exponents);

    float derivationEVSM = epsilonVSM;
    // Derivative of warping at depth
    vec2 depthScale = derivationEVSM * exponents * warpedDepth;
    vec2 minVariance = depthScale * depthScale;

    float epsilonEVSM = -epsilonVSM;

    // Compute the upper bounds of the visibility function both for x and y
    float posContrib = chebyshevUpperBound(occluder.xz, -warpedDepth.x, minVariance.x);
    float negContrib = chebyshevUpperBound(occluder.yw, warpedDepth.y, minVariance.y);

    shadow = min(posContrib, negContrib);

#endif


    return shadow;
}


float computeShadow(const in bool lighted,
                    in vec4 shadowVertexProjected,
                    const in sampler2D tex,
                    const in vec4 texSize,
                    const in vec4 depthRange,
                    const in vec3 LightPosition,
                    const in float N_Dot_L,
                    const in vec3 Normal,
                    const in float bias,
                    const in float epsilonVSM,
                    const in float exponent,
                    const in float exponent1) {


    if (!lighted)
        return 1.;

    if (depthRange.x == depthRange.y)
        return 1.;

    vec4 shadowUV;

    shadowUV.xy = shadowVertexProjected.xy / shadowVertexProjected.w;
    shadowUV.xy = shadowUV.xy * 0.5 + 0.5;// mad like

    bool outFrustum = any(bvec4 ( shadowUV.x > 1., shadowUV.x < 0., shadowUV.y > 1., shadowUV.y < 0. ));

    float objDepth;
    // inv linearize done in vertex shader
    objDepth =  - shadowVertexProjected.z;

    if (outFrustum || shadowUV.w < 0.0 || objDepth < 0.0)
        return 1.0;// limits of light frustum


    // to [0,1]
    //objDepth =  (objDepth - depthRange.x)* depthRange.w;
    objDepth =  objDepth / depthRange.y;


    // depth biasl
    //float shadowBias = 0.005*tan(acos(N_Dot_L)); // cosTheta is dot( n, l ), clamped between 0 and 1
    // same but 4 cycles instead of 15
    float shadowBias = 0.005 * sqrt( 1. -  N_Dot_L*N_Dot_L) / N_Dot_L;
    shadowBias = clamp(shadowBias, 0.,  bias);

    //normal offset aka Exploding Shadow Receivers
    //if(shadowVertexProjected.w != 1.0){
    const float normalExploding = 2.0;
    // only relevant for perspective, not orthogonal
    shadowBias += Normal.z * ( objDepth * normalExploding * texSize.z);
    //}


    // shadowZ must be clamped to [0,1]
    // otherwise it's not comparable to
    // shadow caster depth map
    // which is clamped to [0,1]
    // Not doing that makes ALL shadowReceiver > 1.0 black
    // because they ALL becomes behind any point in Caster depth map
    objDepth = clamp(objDepth, 0., 1. - shadowBias);

    objDepth -= shadowBias;

    return getShadowedTermUnified(shadowUV.xy, objDepth, tex, texSize,  epsilonVSM, exponent, exponent1);

}
// end shadows
