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
float getShadowedTermUnified(in vec2 shadowUV, in float shadowZ,
                             in sampler2D tex, in vec4 shadowMapSize,
                             in float myBias, in float epsilonVSM,
                             in float exponent0, in float exponent1) {


    // Calculate shadow amount
    float shadow = 1.0;

    // return 0.0 for black;
    // return 1.0 for light;

    // shadowZ must be clamped to [0,1]
    // otherwise it's not comparable to
    // shadow caster depth map
    // which is clamped to [0,1]
    // Not doing that makes ALL shadowReceiver > 1.0 black
    // because they ALL becomes behind any point in Caster depth map
    float shadowReceiverZ = clamp(shadowZ, 0.0, 1.0);

#ifdef _NONE

    float shadowDepth = getSingleFloatFromTex(tex, shadowUV.xy);
    // shadowReceiverZ : receiver depth in light view
    // shadowDepth : caster depth in light view
    // receiver is shadowed if its depth is superior to the caster
    shadow = ( shadowReceiverZ - myBias > shadowDepth ) ? 0.0 : 1.0;

#elif defined( _PCF )

    shadow = getShadowPCF(tex, shadowMapSize, shadowUV, shadowReceiverZ, myBias);

#elif defined( _ESM )

    shadow = fetchESM(tex, shadowMapSize, shadowUV, shadowReceiverZ, myBias, exponent0, exponent1);

#elif  defined( _VSM )

    vec2 moments = getDoubleFloatFromTex(tex, shadowUV.xy);
    float shadowBias = myBias;
    shadow = chebyshevUpperBound(moments, shadowReceiverZ, shadowBias, epsilonVSM);

#elif  defined( _EVSM )

    vec4 occluder = getQuadFloatFromTex(tex, shadowUV.xy);
    vec2 exponents = vec2(exponent0, exponent1);
    vec2 warpedDepth = warpDepth(shadowReceiverZ, exponents);

    float derivationEVSM = epsilonVSM;
    // Derivative of warping at depth
    vec2 depthScale = derivationEVSM * exponents * warpedDepth;
    vec2 minVariance = depthScale * depthScale;

    float epsilonEVSM = -epsilonVSM;
    float shadowBias = myBias;

    // Compute the upper bounds of the visibility function both for x and y
    float posContrib = chebyshevUpperBound(occluder.xz, -warpedDepth.x, shadowBias, minVariance.x);
    float negContrib = chebyshevUpperBound(occluder.yw, warpedDepth.y,  shadowBias, minVariance.y);

    shadow = min(posContrib, negContrib);

#endif


    return shadow;
}


float computeShadow(in bool lighted,
                    in vec4 shadowVertexProjected,
                    in vec4 shadowZ,
                    in sampler2D tex,
                    in vec4 texSize,
                    in vec4 depthRange,
                    in vec3 LightPosition,
                    in float N_Dot_L,
                    in vec3 Normal,
                    in float bias,
                    in float epsilonVSM,
                    in float exponent,
                    in float exponent1) {


    if (!lighted)
        return 1.0;

    vec4 shadowUV;

    // depth bias
    float shadowBias = 0.005*tan(acos(N_Dot_L)); // cosTheta is dot( n, l ), clamped between 0 and 1
    shadowBias = clamp(shadowBias, 0.0, bias);


#if defined( _TAP_PCF) //|| (defined(_BAND_PCF) && defined(_PCFx9))
    shadowBias = - shadowBias;
#endif
    //normal offset aka Exploding Shadow Receivers
    if(shadowVertexProjected.w != 1.0){
        // only relevant for perspective, not orthogonal
        shadowVertexProjected += vec4(Normal.xyz*shadowBias*(shadowVertexProjected.z * 2.0*texSize.z),0);
    }

    shadowUV = shadowVertexProjected / shadowVertexProjected.w;
    shadowUV.xy = shadowUV.xy* 0.5 + 0.5;


    if (shadowUV.x > 1.0 || shadowUV.y > 1.0 || shadowUV.x < 0.0 || shadowUV.y < 0.0 )
        return 1.0;// limits of light frustum


    float objDepth;

    // linearize
    objDepth =  -shadowZ.z / shadowZ.w;
    // to [0,1]
    objDepth =  (objDepth - depthRange.x)* depthRange.w;


    return getShadowedTermUnified(shadowUV.xy, objDepth, tex, texSize, shadowBias, epsilonVSM, exponent, exponent1);

}
// end shadows
