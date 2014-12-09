
#pragma include "floatrgbacodec.glsl"

float getSingleFloatFromTex(sampler2D depths, vec2 uv){
      #ifndef _FLOATTEX
       return  DecodeFloatRGBA(texture2D(depths, uv));
      #else
        return texture2D(depths, uv).x;
      #endif
}

 vec2 getDoubleFloatFromTex(sampler2D depths, vec2 uv){
      #ifndef _FLOATTEX
        return DecodeHalfFloatRGBA(texture2D(depths, uv));
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
float ChebychevInequality (vec2 moments, float t)
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

float ChebyshevUpperBound(vec2 moments, float mean, float bias, float minVariance)
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
    // One-tailed Chebyshev
    return clamp(max(p, pMax), 0.0, 1.0);
}
// end VSM
////////////////////////////////////////////////

////////////////////////////////////////////////
// PCF
#define lerp(_x, _y, _s) (_x + _s*(_y-_x))


float bicubicInterpolationFast(in vec2 uv, in sampler2D tex, in vec4 texSize) {
  vec2 rec_nrCP = texSize.zw;
  vec2 coord_hg = uv * texSize.xy-0.5;
  vec2 index = floor(coord_hg);

  vec2 f = coord_hg - index;
  mat4 M =  mat4(
    -1.0,  3.0, -3.0,  1.0,
     3.0, -6.0,  3,  0.0,
    -3.0,  0.0,  3,  0.0,
     1.0,  4.0,  1,  0.0
  );
  M /= 6.0;

  vec4 wx = vec4(f.x*f.x*f.x, f.x*f.x, f.x, 1.0) * M;
  vec4 wy = vec4(f.y*f.y*f.y, f.y*f.y, f.y, 1.0) * M;
  vec2 w0 = vec2(wx.x, wy.x);
  vec2 w1 = vec2(wx.y, wy.y);
  vec2 w2 = vec2(wx.z, wy.z);
  vec2 w3 = vec2(wx.w, wy.w);

  vec2 g0 = w0 + w1;
  vec2 g1 = w2 + w3;
  vec2 h0 = w1 / g0 - 1.0;
  vec2 h1 = w3 / g1 + 1.0;

  vec2 coord00 = index + h0;
  vec2 coord10 = index + vec2(h1.x,h0.y);
  vec2 coord01 = index + vec2(h0.x,h1.y);
  vec2 coord11 = index + h1;

  coord00 = (coord00 + 0.5) * rec_nrCP;
  coord10 = (coord10 + 0.5) * rec_nrCP;
  coord01 = (coord01 + 0.5) * rec_nrCP;
  coord11 = (coord11 + 0.5) * rec_nrCP;

      #ifndef _FLOATTEX
  float tex00 = getSingleFloatFromTex(tex, coord00);
  float tex10 = getSingleFloatFromTex(tex, coord10);
  float tex01 = getSingleFloatFromTex(tex, coord01);
  float tex11 = getSingleFloatFromTex(tex, coord11);
      #else
  float tex00 = texture2D(tex, coord00).x;
  float tex10 = texture2D(tex, coord10).x;
  float tex01 = texture2D(tex, coord01).x;
  float tex11 = texture2D(tex, coord11).x;
      #endif

  tex00 = lerp(tex01, tex00, g0.y);
  tex10 = lerp(tex11, tex10, g0.y);

  return lerp(tex10, tex00, g0.x);
}

float texture2DCompare(sampler2D depths, vec2 uv, float compare, float gbias){

    float depth = getSingleFloatFromTex(depths, uv);
    return step(compare, depth - gbias);

}

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

float PCFLerp(sampler2D depths, vec4 size, vec2 uv, float compare, float gbias){

    float result = 0.0;
    for(int x=-1; x<=1; x++){
        for(int y=-1; y<=1; y++){
            vec2 off = vec2(x,y)*size.zw;
            result += texture2DShadowLerp(depths, size, uv+off, compare, gbias);
        }
    }
    return result/9.0;

}

float PCF(sampler2D tex, vec4 shadowMapSize, vec2 shadowUV, float shadowZ, float gbias, float exponent, float exponent1) {

    vec2 o = shadowMapSize.zw;
    float shadowed = 0.0;

    vec2 fetch[16];
    fetch[0] = shadowUV.xy + vec2(-1.5, -1.5)*o;
    fetch[1] = shadowUV.xy + vec2(-0.5, -1.5)*o;
    fetch[2] = shadowUV.xy + vec2(0.5, -1.5)*o;
    fetch[3] = shadowUV.xy + vec2(1.5, -1.5)*o;
    fetch[4] = shadowUV.xy + vec2(-1.5, -0.5)*o;
    fetch[5] = shadowUV.xy + vec2(-0.5, -0.5)*o;
    fetch[6] = shadowUV.xy + vec2(0.5, -0.5)*o;
    fetch[7] = shadowUV.xy + vec2(1.5, -0.5)*o;
    fetch[8] = shadowUV.xy + vec2(-1.5, 0.5)*o;
    fetch[9] = shadowUV.xy + vec2(-0.5, 0.5)*o;
    fetch[10] = shadowUV.xy + vec2(0.5, 0.5)*o;
    fetch[11] = shadowUV.xy + vec2(1.5, 0.5)*o;
    fetch[12] = shadowUV.xy + vec2(-1.5, 1.5)*o;
    fetch[13] = shadowUV.xy + vec2(-0.5, 1.5)*o;
    fetch[14] = shadowUV.xy + vec2(0.5, 1.5)*o;
    fetch[15] = shadowUV.xy + vec2(1.5, 1.5)*o;

      #if defined( _ESM )
        //http://research.edm.uhasselt.be/tmertens/papers/gi_08_esm.pdf
         float depthScale = exponent1;
         float over_darkening_factor = exponent;
         float receiver = depthScale*shadowZ- gbias;
      #endif

    for(int i = 0; i < 16; i++) {
      //#define _BICUBIC 1
      #ifdef _BICUBIC
        float zz = bicubicInterpolationFast(fetch[i], tex, shadowMapSize);
      #else
        float zz = getSingleFloatFromTex(tex, fetch[i]);
      #endif
      #if defined( _ESM )
        zz = exp(over_darkening_factor * (zz - receiver));
        zz = clamp(zz, 0.0, 1.0);
      #else
        shadowed += step(shadowZ - gbias , zz);
      #endif
     }
    shadowed = shadowed / 16.0;
    return shadowed;

}
// end PCF
////////////////////////////////////////////////

////////////////////////////////////////////////
// ESM
float ESM_Fetch(sampler2D tex, vec4 shadowMapSize, vec2 shadowUV, float shadowZ, float gbias, float exponent, float exponent1) {

    //http://research.edm.uhasselt.be/tmertens/papers/gi_08_esm.pdf
    //http://pixelstoomany.wordpress.com/2008/06/12/a-conceptually-simpler-way-to-derive-exponential-shadow-maps-sample-code/
    //
    vec2 o = shadowMapSize.zw;
    float shadowed = 0.0;

    vec2 unnormalized = shadowUV * shadowMapSize.xy;
    vec2 fractional = fract(unnormalized);
    unnormalized = floor(unnormalized);

    vec4 occluder4;
    occluder4.x = getSingleFloatFromTex(tex, (unnormalized + vec2( -0.5,  0.5 ))* shadowMapSize.zw );
    occluder4.y = getSingleFloatFromTex(tex, (unnormalized + vec2( 0.5,   0.5 ))* shadowMapSize.zw );
    occluder4.z = getSingleFloatFromTex(tex, (unnormalized + vec2( 0.5,  -0.5 ))* shadowMapSize.zw );
    occluder4.w = getSingleFloatFromTex(tex, (unnormalized + vec2( -0.5, -0.5 ))* shadowMapSize.zw );

    vec2 fetch[5];;
    fetch[1] = shadowUV.xy + vec2(-1.5, -1.5)*o;
    fetch[2] = shadowUV.xy + vec2(-0.5, -1.5)*o;
    fetch[3] = shadowUV.xy + vec2(0.5, -1.5)*o;
    fetch[4] = shadowUV.xy + vec2(1.5, -1.5)*o;

    float depthScale = exponent1;
    float over_darkening_factor = exponent;
    float receiver = depthScale*shadowZ- gbias;


    float occluder = (occluder4.w + (occluder4.x - occluder4.w) * fractional.y);
    occluder = occluder + ((occluder4.z + (occluder4.y - occluder4.z) * fractional.y) - occluder)*fractional.x;

    return exp(over_darkening_factor * ( occluder - receiver ));
}
// end ESM
////////////////////////////////////////////////
//EVSM

#ifdef _EVSM
// Convert depth to EVSM coefficients
// Input depth should be in [0, 1]
vec2 WarpDepth(float depth, vec2 exponents)
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
  in float exponent, in float exponent1) {


  // Calculate shadow amount
  float shadow = 1.0;

    #ifdef _NONE

      float shadowDepth = getSingleFloatFromTex(tex, shadowUV.xy);
      shadow = ( shadowZ - myBias > shadowDepth ) ? 0.0 : 1.0;

    #elif defined( _PCF ) || (defined(_ESM ) && defined(_PCF ))

      shadow = PCF(tex, shadowMapSize, shadowUV, shadowZ, myBias, exponent, exponent1);
      //shadow = PCFLerp(tex, shadowMapSize, shadowUV, shadowZ, myBias);
      //shadow = (shadowZ -myBias > bicubicInterpolationFast(shadowUV, tex, shadowMapSize)) ? 0.0 : 1.0;
      //
      //
    #elif defined( _ESM )
      //http://research.edm.uhasselt.be/tmertens/papers/gi_08_esm.pdf
      shadow = ESM_Fetch(tex, shadowMapSize, shadowUV, shadowZ, myBias, exponent, exponent1);

    #elif  defined( _VSM )

      vec2 moments = getDoubleFloatFromTex(tex, shadowUV.xy);
      float shadowBias = myBias;
      shadow = ChebyshevUpperBound(moments, shadowZ, shadowBias, VsmEpsilon);
      //shadow = ChebychevInequality(moments, shadowZ.z);
      //shadow = (1.0 - shadow >=myBias) ? (0.0) : (1.0);

      //shadow = (1.0 - shadow >=myBias) ? (0.0) : (1.0);
      //shadow = shadow * 0.9;


    #elif  defined( _EVSM )

      vec4 occluder = getQuadFloatFromTex(tex, shadowUV.xy);
      vec2 exponents = vec2(exponent, exponent1);
      vec2 warpedDepth = WarpDepth(shadowZ, exponents);

      float g_EVSM_Derivation = VsmEpsilon;
      // Derivative of warping at depth
      vec2 depthScale = g_EVSM_Derivation * exponents * warpedDepth;
      vec2 minVariance = depthScale * depthScale;

      float evsmEpsilon = -VsmEpsilon;
      float shadowBias = myBias;

      // Compute the upper bounds of the visibility function both for x and y
      float posContrib = ChebyshevUpperBound(occluder.xz, -warpedDepth.x, shadowBias, minVariance.x);
      float negContrib = ChebyshevUpperBound(occluder.yw, warpedDepth.y,  shadowBias, minVariance.y);

      shadow = min(posContrib, negContrib);

    #endif


    return shadow;
}


vec4 computeShadow(in vec4 shadowVertexProjected,
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



    vec4 shadowUV;

    //normal offset aka Exploding Shadow Receivers
    float shadowMapTexelSize = shadowVertexProjected.z * 2.0*texSize.z;
    shadowVertexProjected -= vec4(Normal.xyz*bias*shadowMapTexelSize,0);

    shadowUV = shadowVertexProjected / shadowVertexProjected.w;
    shadowUV.xy = shadowUV.xy* 0.5 + 0.5;

    if (shadowUV.x > 1.0 || shadowUV.y > 1.0 || shadowUV.x < 0.0 || shadowUV.y < 0.0)
     return vec4(vec3(1.0), 1.0);// 0.0 to show limits of light frustum

    float objDepth;
 //#define NUM_STABLE
    #ifndef NUM_STABLE
      objDepth = -shadowZ.z;
      objDepth =  (objDepth - depthRange.x)* depthRange.w;// linearize (aka map z to near..far to 0..1)
      objDepth =   clamp(objDepth, 0.0, 1.0);
    #else
      objDepth =  length(LightPosition.xyz - shadowZ.xyz );
      objDepth =  (objDepth - depthRange.x)* depthRange.w;// linearize (aka map z to near..far to 0..1)
      objDepth =   clamp(objDepth, 0.0, 1.0);

    #endif

   float shadowBias = 0.005*tan(acos(N_Dot_L)); // cosTheta is dot( n, l ), clamped between 0 and 1
    shadowBias = clamp(shadowBias, 0.0, bias);

    //return vec4(vec3(getShadowedTermUnified(shadowUV.xy, objDepth, tex, texSize, bias)), 1.0);
    return vec4(vec3(getShadowedTermUnified(shadowUV.xy, objDepth, tex, texSize, bias, VsmEpsilon, exponent, exponent1)), 1.0);

}
// end shadows
////////////////////////////////////////////////