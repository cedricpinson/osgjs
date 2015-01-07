//begin shadows

#pragma include "colorEncode.glsl"

// see shadowSettings.js header for shadow algo param explanations

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

/// end Float codec
///////////////////////////////////////////////////

////////////////////////////////////////////////
// VSM
float chebychevInequality (vec2 moments, float t)
{
    // No shadow if depth of fragment is in front
    if ( t <= moments.x )
        return 1.0;

    // Calculate variance, which is actually the amount of
    // error due to precision loss from fp32 to RG/BA
    // (moment1 / moment2)
    float variance = moments.y - (moments.x * moments.x);
    variance = max(variance, 0.02);

    // Calculate the upper bound
    float d = t - moments.x;
    return variance / (variance + d * d);
}

float chebyshevUpperBound(vec2 moments, float mean, float bias, float minVariance)
{
    float d = mean - moments.x;
    if ( d <= 0.0 )
        return 1.0;
    // Compute variance
    float variance = moments.y - (moments.x * moments.x);
    variance = max(variance, minVariance);

    // Compute probabilistic upper bound
    //p represent an upper bound on the visibility percentage of the receiver. This value //attempts to estimate how much of the distribution of occluders at the surface location is //beyond the surface's distance from the light. If it is 0, then there is no probability //that the fragment is partially lit, so it will be fully in shadow. If it is a value in the //[0, 1] range, it represent the penumbrae value of the shadow edge.
    float p = smoothstep(mean - bias, mean, moments.x);

    // Remove the [0, Amount] tail and linearly rescale (Amount, 1].
    /// light bleeding when shadows overlap.

    float pMax = smoothstep(0.2, 1.0, variance / (variance + d*d));
    // One-tailed chebyshev
    return clamp(max(p, pMax), 0.0, 1.0);
}
// end VSM
////////////////////////////////////////////////

////////////////////////////////////////////////
// PCF
// simulation of texture2Dshadow glsl call on HW
float texture2DCompare(sampler2D depths, vec2 uv, float compare, float gbias){

    float depth = getSingleFloatFromTex(depths, uv);
    return step(compare, depth - gbias);

}

// simulates linear fetch like texture2d shadow
float texture2DShadowLerp(sampler2D depths, vec4 size, vec2 uv, float compare, float gbias){

    vec2 texelSize = vec2(1.0)*size.zw;
    vec2 f = fract(uv*size.xy+0.5);
    vec2 centroidUV = floor(uv*size.xy+0.5)*size.zw;

    float lb = texture2DCompare(depths, centroidUV+texelSize*vec2(0.0, 0.0), compare, gbias);
    float lt = texture2DCompare(depths, centroidUV+texelSize*vec2(0.0, 1.0), compare, gbias);
    float rb = texture2DCompare(depths, centroidUV+texelSize*vec2(1.0, 0.0), compare, gbias);
    float rt = texture2DCompare(depths, centroidUV+texelSize*vec2(1.0, 1.0), compare, gbias);
    float a = mix(lb, lt, f.y);
    float b = mix(rb, rt, f.y);
    float c = mix(a, b, f.x);
    return c;

}

// pcf
float pcfLerp(sampler2D depths, vec4 size, vec2 uv, float compare, float gbias){

    float result = 0.0;

#if defined(_PCFx4)
    result += texture2DShadowLerp(depths, size, uv, compare, gbias);

#elif defined(_PCFx9)

    for(int x=-1; x<=1; x++){
        for(int y=-1; y<=1; y++){
            vec2 off = vec2(x,y)*size.zw;
            result += texture2DShadowLerp(depths, size, uv+off, compare, gbias);
        }
    }
    result /=9.0;

#elif defined(_PCFx25)

    for(int x=-2; x<=2; x++){
        for(int y=-2; y<=2; y++){
            vec2 off = vec2(x,y)*size.zw;
            result += texture2DShadowLerp(depths, size, uv+off, compare, gbias);
        }
    }
    result/=25.0;

    result += texture2DShadowLerp(depths, size, uv, compare, gbias);

#endif
    return result;
}

float getPCFShadow(sampler2D tex, vec4 shadowMapSize, vec2 shadowUV, float shadowZ, float gbias, float exponent0, float exponent1) {

    vec2 o = shadowMapSize.zw;
    float shadowed = 0.0;

#ifdef _PCF_BAND
    // fastest bug gives banding
#if defined(_PCFx4)

    float xPixelOffset = o.x;
    float yPixelOffset = o.y;

    float dx0 = -1.0 * xPixelOffset;
    float dy0 = -1.0 * yPixelOffset;
    float dx1 = 1.0 * xPixelOffset;
    float dy1 = 1.0 * yPixelOffset;

    vec4 shadowValues;

    // vector ops faster alu
    shadowValues.x = getSingleFloatFromTex( tex, shadowUV.xy + vec2( dx0, dy0 ) );
    shadowValues.y = getSingleFloatFromTex( tex, shadowUV.xy + vec2( dx0, dy1 ) );
    shadowValues.z = getSingleFloatFromTex( tex, shadowUV.xy + vec2( dx1, dy0 ) ) ;
    shadowValues.w = getSingleFloatFromTex( tex, shadowUV.xy + vec2( dx1, dy1 ) ) ;
    shadowValues = vec4(lessThan(vec4(shadowZ - gbias), shadowValues  ));
    shadowed = dot(shadowValues, vec4(0.25));

    // here still didn't querying the real shadow at shadowUV.
    // This could be a single func checking for branching
    // like befire going to x9, x16 or anythiong
    // or even complex "blurring"
    if (shadowed != 0.0) // we're on an edge
    {
        shadowed += (shadowZ - gbias < getSingleFloatFromTex( tex, shadowUV.xy ))  ?  1.0 : 0.0;
        shadowed *= 0.5;
    }

#elif defined(_PCFx9)

    float xPixelOffset = o.x;
    float yPixelOffset = o.y;

    float dx0 = -1.0 * xPixelOffset;
    float dy0 = -1.0 * yPixelOffset;
    float dx1 = 1.0 * xPixelOffset;
    float dy1 = 1.0 * yPixelOffset;

    mat3 shadowKernel;
    mat3 depthKernel;


    depthKernel[0][0] = getSingleFloatFromTex( tex, shadowUV.xy + vec2( dx0, dy0 ) );
    depthKernel[0][1] = getSingleFloatFromTex( tex, shadowUV.xy + vec2( dx0, 0.0 ) );
    depthKernel[0][2] = getSingleFloatFromTex( tex, shadowUV.xy + vec2( dx0, dy1 ) );
    depthKernel[1][0] = getSingleFloatFromTex( tex, shadowUV.xy + vec2( 0.0, dy0 ) );
    depthKernel[1][1] = getSingleFloatFromTex( tex, shadowUV.xy ) ;
    depthKernel[1][2] = getSingleFloatFromTex( tex, shadowUV.xy + vec2( 0.0, dy1 ) ) ;
    depthKernel[2][0] = getSingleFloatFromTex( tex, shadowUV.xy + vec2( dx1, dy0 ) ) ;
    depthKernel[2][1] = getSingleFloatFromTex( tex, shadowUV.xy + vec2( dx1, 0.0 ) ) ;
    depthKernel[2][2] = getSingleFloatFromTex( tex, shadowUV.xy + vec2( dx1, dy1 ) ) ;

    // using 4 vector ops to save ALU
    // filter is done post dept/shadow compare
    vec3 shadowZ3 = vec3( shadowZ - gbias);
    shadowKernel[0] = vec3(lessThan(shadowZ3, depthKernel[0]  ));
    shadowKernel[0] *= vec3(0.25);

    shadowKernel[1] = vec3(lessThan(shadowZ3, depthKernel[1] ));
    shadowKernel[1] *= vec3(0.25);

    shadowKernel[2] = vec3(lessThan(shadowZ3, depthKernel[2] ));
    shadowKernel[2] *= vec3(0.25);

    vec2 fractionalCoord = 1.0 - fract( shadowUV.xy );

    shadowKernel[0] = mix( shadowKernel[1], shadowKernel[0], fractionalCoord.x );
    shadowKernel[1] = mix( shadowKernel[2], shadowKernel[1], fractionalCoord.x );

    vec4 shadowValues;
    shadowValues.x = mix( shadowKernel[0][1], shadowKernel[0][0], fractionalCoord.y );
    shadowValues.y = mix( shadowKernel[0][2], shadowKernel[0][1], fractionalCoord.y );
    shadowValues.z = mix( shadowKernel[1][1], shadowKernel[1][0], fractionalCoord.y );
    shadowValues.w = mix( shadowKernel[1][2], shadowKernel[1][1], fractionalCoord.x );

    shadowed = dot( shadowValues, vec4( 1.0 ) );

#elif defined(_PCFx16)

    vec2 fetch[16];
    fetch[0] = shadowUV.xy + vec2(-2.0, -2.0)*o;
    fetch[1] = shadowUV.xy + vec2(-1.0, -2.0)*o;
    fetch[2] = shadowUV.xy + vec2(1.0, -2.0)*o;
    fetch[3] = shadowUV.xy + vec2(2.0, -2.0)*o;
    fetch[4] = shadowUV.xy + vec2(-2.0, -1.0)*o;
    fetch[5] = shadowUV.xy + vec2(-1.0, -1.0)*o;
    fetch[6] = shadowUV.xy + vec2(1.0, -1.0)*o;
    fetch[7] = shadowUV.xy + vec2(2.0, -1.0)*o;
    fetch[8] = shadowUV.xy + vec2(-2.0, 1.0)*o;
    fetch[9] = shadowUV.xy + vec2(-1.0, 1.0)*o;
    fetch[10] = shadowUV.xy + vec2(1.0, 1.0)*o;
    fetch[11] = shadowUV.xy + vec2(2.0, 1.0)*o;
    fetch[12] = shadowUV.xy + vec2(-2.0, 2.0)*o;
    fetch[13] = shadowUV.xy + vec2(-1.0, 2.0)*o;
    fetch[14] = shadowUV.xy + vec2(1.0, 2.0)*o;
    fetch[15] = shadowUV.xy + vec2(2.0, 2.0)*o;

#if defined( _ESM )
    //http://research.edm.uhasselt.be/tmertens/papers/gi_08_esm.pdf
    float depthScale = exponent1;
    float over_darkening_factor = exponent0;
    float receiver = depthScale*shadowZ- gbias;
#endif

    for(int i = 0; i < 16; i++) {

        float zz = getSingleFloatFromTex(tex, fetch[i]);
#if defined( _ESM )
        zz = exp(over_darkening_factor * (zz - receiver));
        zz = clamp(zz, 0.0, 1.0);
#else
        shadowed += step(shadowZ - gbias , zz);
#endif
    }
    shadowed = shadowed / 16.0;
#endif // pcfx16

#elif defined(_PCF_POISSON)
    // Not Good, as it needs the lerp things
    vec2 poissonDisk[64];

    poissonDisk[0] = vec2(-0.613392, 0.617481);
    poissonDisk[1] = vec2(0.170019, -0.040254);
    poissonDisk[2] = vec2(-0.299417, 0.791925);
    poissonDisk[3] = vec2(0.645680, 0.493210);
#ifdef _PCFx4
    const int kernSize = 4;
#else

    poissonDisk[4] = vec2(-0.651784, 0.717887);
    poissonDisk[5] = vec2(0.421003, 0.027070);
    poissonDisk[6] = vec2(-0.817194, -0.271096);
    poissonDisk[7] = vec2(-0.705374, -0.668203);

#ifdef _PCFx8
    const int kernSize = 8;
#else
    poissonDisk[8] = vec2(0.977050, -0.108615);
    poissonDisk[9] = vec2(0.063326, 0.142369);
    poissonDisk[10] = vec2(0.203528, 0.214331);
    poissonDisk[11] = vec2(-0.667531, 0.326090);
    poissonDisk[12] = vec2(-0.098422, -0.295755);
    poissonDisk[13] = vec2(-0.885922, 0.215369);
    poissonDisk[14] = vec2(0.566637, 0.605213);
    poissonDisk[15] = vec2(0.039766, -0.396100);

#ifdef _PCFx16
    const int kernSize = 16;
#else
    poissonDisk[16] = vec2(0.751946, 0.453352);
    poissonDisk[17] = vec2(0.078707, -0.715323);
    poissonDisk[18] = vec2(-0.075838, -0.529344);
    poissonDisk[19] = vec2(0.724479, -0.580798);
    poissonDisk[20] = vec2(0.222999, -0.215125);
    poissonDisk[21] = vec2(-0.467574, -0.405438);
    poissonDisk[22] = vec2(-0.248268, -0.814753);
    poissonDisk[23] = vec2(0.354411, -0.887570);
    poissonDisk[24] = vec2(0.175817, 0.382366);

#ifdef _PCFx25
    const int kernSize = 25;
#else
    poissonDisk[25] = vec2(0.487472, -0.063082);
    poissonDisk[26] = vec2(-0.084078, 0.898312);
    poissonDisk[27] = vec2(0.488876, -0.783441);
    poissonDisk[28] = vec2(0.470016, 0.217933);
    poissonDisk[29] = vec2(-0.696890, -0.549791);
    poissonDisk[30] = vec2(-0.149693, 0.605762);
    poissonDisk[31] = vec2(0.034211, 0.979980);
#ifdef _PCFx32
    const int kernSize = 32;
#else
    const int kernSize = 64;

    poissonDisk[32] = vec2(0.503098, -0.308878);
    poissonDisk[33] = vec2(-0.016205, -0.872921);
    poissonDisk[34] = vec2(0.385784, -0.393902);
    poissonDisk[35] = vec2(-0.146886, -0.859249);
    poissonDisk[36] = vec2(0.643361, 0.164098);
    poissonDisk[37] = vec2(0.634388, -0.049471);
    poissonDisk[38] = vec2(-0.688894, 0.007843);
    poissonDisk[39] = vec2(0.464034, -0.188818);
    poissonDisk[40] = vec2(-0.440840, 0.137486);
    poissonDisk[41] = vec2(0.364483, 0.511704);
    poissonDisk[42] = vec2(0.034028, 0.325968);
    poissonDisk[43] = vec2(0.099094, -0.308023);
    poissonDisk[44] = vec2(0.693960, -0.366253);
    poissonDisk[45] = vec2(0.678884, -0.204688);
    poissonDisk[46] = vec2(0.001801, 0.780328);
    poissonDisk[47] = vec2(0.145177, -0.898984);
    poissonDisk[48] = vec2(0.062655, -0.611866);
    poissonDisk[49] = vec2(0.315226, -0.604297);
    poissonDisk[50] = vec2(-0.780145, 0.486251);
    poissonDisk[51] = vec2(-0.371868, 0.882138);
    poissonDisk[52] = vec2(0.200476, 0.494430);
    poissonDisk[53] = vec2(-0.494552, -0.711051);
    poissonDisk[54] = vec2(0.612476, 0.705252);
    poissonDisk[55] = vec2(-0.578845, -0.768792);
    poissonDisk[56] = vec2(-0.772454, -0.090976);
    poissonDisk[57] = vec2(0.504440, 0.372295);
    poissonDisk[58] = vec2(0.155736, 0.065157);
    poissonDisk[59] = vec2(0.391522, 0.849605);
    poissonDisk[60] = vec2(-0.620106, -0.328104);
    poissonDisk[61] = vec2(0.789239, -0.419965);
    poissonDisk[62] = vec2(-0.545396, 0.538133);
    poissonDisk[63] = vec2(-0.178564, -0.596057);
#endif // 32
#endif // 25
#endif // 16
#endif // 8
#endif // 4

    for (int i = 0; i < kernSize; i++){
        float zz = texture2DShadowLerp(tex, shadowMapSize, shadowUV +  + poissonDisk[i]*o, shadowZ, -gbias);
        shadowed += step(shadowZ + gbias , zz);
    }
    shadowed /= float(kernSize);

#endif

    return shadowed;

}
// end getPCFShadow
////////////////////////////////////////////////

////////////////////////////////////////////////
// ESM
float fetchESM(sampler2D tex, vec4 shadowMapSize, vec2 shadowUV, float shadowZ, float gbias, float exponent0, float exponent1) {


#if defined(_FLOATTEX) && (!defined(_FLOATLINEAR))
    // emulate bilinear filtering (not needed if webgm/GPU support filtering FP32/FP16 textures)
    vec2 unnormalized = shadowUV * shadowMapSize.xy;
    vec2 fractional = fract(unnormalized);
    unnormalized = floor(unnormalized);

    vec4 occluder4;
    occluder4.x = getSingleFloatFromTex(tex, (unnormalized + vec2( -0.5,  0.5 ))* shadowMapSize.zw );
    occluder4.y = getSingleFloatFromTex(tex, (unnormalized + vec2( 0.5,   0.5 ))* shadowMapSize.zw );
    occluder4.z = getSingleFloatFromTex(tex, (unnormalized + vec2( 0.5,  -0.5 ))* shadowMapSize.zw );
    occluder4.w = getSingleFloatFromTex(tex, (unnormalized + vec2( -0.5, -0.5 ))* shadowMapSize.zw );

    float occluder = (occluder4.w + (occluder4.x - occluder4.w) * fractional.y);
    occluder = occluder + ((occluder4.z + (occluder4.y - occluder4.z) * fractional.y) - occluder)*fractional.x;

#else
    float occluder = getSingleFloatFromTex(tex, shadowUV );
#endif

    float depthScale = exponent1;
    float over_darkening_factor = exponent0;
    float receiver = depthScale * ( shadowZ + gbias);


    return exp(over_darkening_factor * ( occluder - receiver ));
}

// end ESM
////////////////////////////////////////////////
//EVSM
#ifdef _EVSM
// Convert depth to EVSM coefficients
// Input depth should be in [0, 1]
vec2 warpDepth(float depth, vec2 exponents)
{
    // Rescale depth into [-1, 1]
    depth = 2.0  * depth - 1.0;
    float pos =  exp( exponents.x * depth);
    float neg = -exp(-exponents.y * depth);
    return vec2(pos, neg);
}

#endif // _EVSM
// end EVSM

////////////////////////////////////////////////
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

#elif defined( _PCF ) || (defined(_ESM ) && defined(_PCF ))

#if defined(_PCF_BAND) || defined(_PCF_POISSON)
    shadow = getPCFShadow(tex, shadowMapSize, shadowUV, shadowZ, myBias, exponent0, exponent1);
#elif defined(_PCF_TAP)
    shadow = pcfLerp(tex, shadowMapSize, shadowUV, shadowZ, myBias);
#endif

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
