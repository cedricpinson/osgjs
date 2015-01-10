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

#pragma include "pcfBand.glsl" "_PCF_BAND"
#pragma include "pcfPoisson.glsl" "_PCF_POISSON"
#pragma include "pcfTap.glsl" "_PCF_TAP"


// SHADOWS
float getShadowedTermUnified(in vec2 shadowUV, in float shadowZ,
                             in sampler2D tex, in vec4 shadowMapSize,
                             in float myBias, in float VsmEpsilon,
                             in float exponent0, in float exponent1) {


    // Calculate shadow amount
    float shadow = 1.0;

#ifdef _NONE

    float shadowDepth = getSingleFloatFromTex(tex, shadowUV.xy);
    shadow = ( shadowZ - myBias > shadowDepth ) ? 0.0 : 1.0;

#elif defined( _PCF )

    shadow = getPCFShadow(tex, shadowMapSize, shadowUV, shadowZ, myBias);

#elif defined( _ESM )

    shadow = fetchESM(tex, shadowMapSize, shadowUV, shadowZ, myBias, exponent0, exponent1);

#elif  defined( _VSM )

    vec2 moments = getDoubleFloatFromTex(tex, shadowUV.xy);
    float shadowBias = myBias;
    shadow = chebyshevUpperBound(moments, shadowZ, shadowBias, VsmEpsilon);

#elif  defined( _EVSM )

    vec4 occluder = getQuadFloatFromTex(tex, shadowUV.xy);
    vec2 exponents = vec2(exponent0, exponent1);
    vec2 warpedDepth = warpDepth(shadowZ, exponents);

    float g_EVSM_Derivation = VsmEpsilon;
    // Derivative of warping at depth
    vec2 depthScale = g_EVSM_Derivation * exponents * warpedDepth;
    vec2 minVariance = depthScale * depthScale;

    float evsmEpsilon = -VsmEpsilon;
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
                    in float VsmEpsilon,
                    in float exponent,
                    in float exponent1) {


    if (!lighted)
        return 1.0;

    vec4 shadowUV;

    // depth bias
    float shadowBias = 0.005*tan(acos(N_Dot_L)); // cosTheta is dot( n, l ), clamped between 0 and 1
    shadowBias = clamp(shadowBias, 0.0, bias);


#if defined( _PCF_TAP) //|| (defined(_PCF_BAND) && defined(_PCFx9))
    shadowBias = - shadowBias;
#endif
    //normal offset aka Exploding Shadow Receivers
    if(shadowVertexProjected.w != 1.0){
        // only relevant for perspective, not orthogonal
        shadowVertexProjected += vec4(Normal.xyz*shadowBias*(shadowVertexProjected.z * 2.0*texSize.z),0);
    }

    shadowUV = shadowVertexProjected / shadowVertexProjected.w;
    shadowUV.xy = shadowUV.xy* 0.5 + 0.5;

    if (shadowUV.x > 1.0 || shadowUV.y > 1.0 || shadowUV.x < 0.0 || shadowUV.y < 0.0 || shadowUV.z > 1.0 || shadowUV.z < -1.0)
        return 1.0;// limits of light frustum

    float objDepth;

    objDepth =  -  shadowZ.z;
    objDepth =  (objDepth - depthRange.x)* depthRange.w;// linearize (aka map z to near..far to 0..1)

    return getShadowedTermUnified(shadowUV.xy, objDepth, tex, texSize, shadowBias, VsmEpsilon, exponent, exponent1);

}
// end shadows
