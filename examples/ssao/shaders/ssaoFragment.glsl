/**
 * Implementation of the Scalable Ambient Obscurance algorithm
 * describes in http://graphics.cs.williams.edu/papers/SAOHPG12/McGuire12SAO.pdf
 */

# ifdef GL_ES
    precision highp float;
# endif

# extension GL_OES_standard_derivatives : enable

// Updates the fallof function accordingly
// but the cost is higher due to the inversesqrt
# define HIGH_QUALITY 1

/*
    1,  1,  1,  2,  3,  2,  5,  2,  3,  2,  // 0
    3,  3,  5,  5,  3,  4,  7,  5,  5,  7,  // 1
    9,  8,  5,  5,  7,  7,  7,  8,  5,  8,  // 2
    11, 12,  7, 10, 13,  8, 11,  8,  7, 14,  // 3
    11, 11, 13, 12, 13, 19, 17, 13, 11, 18,  // 4
    19, 11, 11, 14, 17, 21, 15, 16, 17, 18,  // 5
    29, 21, 19, 27, 31, 29, 21, 18, 17, 29,  // 7
    13, 17, 11, 17, 19, 18, 25, 18, 19, 19,  // 6
    31, 31, 23, 18, 25, 26, 25, 23, 19, 34,  // 8
    19, 27, 21, 25, 39, 29, 17, 21, 27, 29}; // 9
*/
# define NB_SAMPLES 11
// Should be a number from the array defined above
// with index equals to NB_SAMPLES
# define NB_SPIRAL_TURNS 3.0

// Constant used to scale the depth view value
// that is given to the blur pass
# define FAR_PLANE 1000.0
# define EPSILON 0.001
# define MIN_RADIUS 2.0

# define MAX_MIP_LEVEL 5
// Determines at which point we should switch mip level
// if number is too small (~3) will lead to flashing (bad variance as many taps give same pixel)
// if number is too high, mip level are not used well and the cache is not used efficiently
# define LOG_MAX_OFFSET 4

uniform vec2 RenderSize;

/**
 * Contains information to compute
 * the point in camera space
 * -2.0f / (width*P[0][0])
 * -2.0f / (height*P[1][1])
 * (1.0f - P[0][2]) / P[0][0]
 * (1.0f + P[1][2]) / P[1][1])
 */
uniform vec4 uProjectionInfo;
// The height in pixels of a 1m object if viewed from 1m away
// scale = -2.0 * Math.tan( verticalFov * 0.5 );
// projScale = viewportHeight / scale;
uniform float uProjScale;

uniform float uRadius;
uniform float uRadius2;

uniform float uIntensityDivRadius6;
uniform float uIntensity;

uniform float uBias;

uniform sampler2D uDepthTexture;
uniform sampler2D uMipmap0;
uniform sampler2D uMipmap1;
uniform sampler2D uMipmap2;
uniform sampler2D uMipmap3;
uniform sampler2D uMipmap4;

uniform float uNear;
uniform float uFar;

float decodeFloatRGBA( vec4 rgba ) {
   return dot( rgba, vec4(1.0, 1.0/255.0, 1.0/65025.0, 1.0/16581375.0) );
}

void encodeFloatToVec3( float v, out vec3 p ) {
   p = vec3(1.0, 255.0, 65025.0) * v;
   p = fract(p);
   p -= p.yzz * vec3(1.0/255.0,1.0/255.0,1.0/255.0);
}

float zValueFromScreenSpacePosition(vec2 ssPosition) {

    vec2 texCoord = (ssPosition + vec2(0.5)) / RenderSize;
    float d = decodeFloatRGBA(texture2D(uDepthTexture, texCoord));

    // return (uNear * uFar) / (d * (uNear - uFar) + uFar);
    return uNear + (uFar - uNear) * d;
}

vec3 reconstructCSPosition(vec2 ssP, float z) {
    return vec3((ssP.xy * uProjectionInfo.xy + uProjectionInfo.zw) * z, z);
}

vec3 getPosition(ivec2 ssP) {

    vec2 ssP_float = vec2(ssP);
    return reconstructCSPosition(ssP_float + vec2(0.5), zValueFromScreenSpacePosition(ssP_float));
}

vec3 reconstructNormal(vec3 c) {
    return normalize(cross(dFdy(c), dFdx(c)));
}

/**
 * Computes the unit vector associated to a sample.
 * The unit vector defines the direction in which the tap
 * will occur in the depth texture.
 */
vec2 computeOffsetUnitVec(int sampleNumber, float randomAngle, out float screenSpaceRadius) {

    float alpha = (float(sampleNumber) + 0.5) * (1.0 / float(NB_SAMPLES));
    float angle = alpha * (NB_SPIRAL_TURNS * 6.28) + randomAngle;

    screenSpaceRadius = alpha;
    return vec2(cos(angle), sin(angle));
}

int getMipLevel(float ssR) {
    return int(clamp(floor(log2(ssR)) - float(LOG_MAX_OFFSET), 0.0, float(MAX_MIP_LEVEL)));
}

/**
 * Reconstructs tap location to a view-space point.
 * This version uses several mipmaps bound as texture units
 */
vec3 getOffsetedPixelPos(ivec2 ssC, vec2 unitOffset, float screenSpaceRadius) {

    int mipLevel = getMipLevel(screenSpaceRadius);

    ivec2 ssP = ivec2(screenSpaceRadius * unitOffset) + ssC;
    vec2 ssP_float = vec2(ssP);

    float d = 0.0;
    if (mipLevel == 1)
        d = decodeFloatRGBA(texture2D(uMipmap0, (ssP_float + vec2(0.5)) / RenderSize));
    else if (mipLevel == 2)
        d = decodeFloatRGBA(texture2D(uMipmap1, (ssP_float + vec2(0.5)) / RenderSize));
    else if (mipLevel == 3)
        d = decodeFloatRGBA(texture2D(uMipmap2, (ssP_float + vec2(0.5)) / RenderSize));
    else if (mipLevel == 4)
        d = decodeFloatRGBA(texture2D(uMipmap3, (ssP_float + vec2(0.5)) / RenderSize));
    else if (mipLevel == 5)
        d = decodeFloatRGBA(texture2D(uMipmap4, (ssP_float + vec2(0.5)) / RenderSize));
    else
        d = decodeFloatRGBA(texture2D(uDepthTexture, (ssP_float + vec2(0.5)) / RenderSize));

    return reconstructCSPosition(ssP_float + vec2(0.5), uNear + (uFar - uNear) * d);
}

/**
 * Reconstructs tap location to a view-space point.
 * This version uses several mipmaps generated automatically by the call glGenerateMipmaps
 */
// vec3 getOffsetedPixelPos(ivec2 ssC, vec2 unitOffset, float screenSpaceRadius) {

//     int mipLevel = getMipLevel(screenSpaceRadius);

//     ivec2 ssP = ivec2(screenSpaceRadius * unitOffset) + ssC;
//     vec2 ssP_float = vec2(ssP);

//     float d = decodeFloatRGBA(texture2DLodEXT(uDepthTexture, (ssP_float + vec2(0.25)) / RenderSize, float(mipLevel)));

//     vec3 P;
//     P.z = uNear + (uFar - uNear) * d;
//     // Offset to pixel center
//     P = reconstructCSPosition((ssP_float + vec2(0.5)), P.z);

//     // DEBUG
//     // if (mipLevel == 3)
//     //     return reconstructCSPosition((vec2(ssP) + vec2(0.5)), 0.0);
//     // END DEBUG
//     return P;
// }

/**
 * Reconstructs tap location to a view-space point.
 * This version does not use mipmap levels.
 */
// vec3 getOffsetedPixelPos(ivec2 ssC, vec2 unitOffset, float screenSpaceRadius) {

//     ivec2 ssP = ivec2(screenSpaceRadius * unitOffset) + ssC;
//     vec2 ssP_float = vec2(ssP);

//     return reconstructCSPosition(vec2(ssP) + vec2(0.5), zValueFromScreenSpacePosition(ssP_float));
// }

/**
 * Computes the AO contribution for a single tap.
 * The HIGH_QUALITY macro allows to smooth the AO
 * and spread darken corners.
 */
float fallOffMethod0(float vv, float vn, vec3 normal) {

    #   if HIGH_QUALITY

        float invRadius2 = 1.0 / uRadius2;
        float f = max(1.0 - vv * invRadius2, 0.0);
        return f * max((vn - uBias) * inversesqrt(EPSILON + vv), 0.0);

    #   else

        float f = max(uRadius2 - vv, 0.0);
        return f * f * f * max((vn - uBias) / (EPSILON + vv), 0.0);

    #   endif
}

float rand(vec2 co)
{
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt= dot(co.xy ,vec2(a,b));
    highp float sn= mod(dt,3.14);
    return fract(sin(sn) * c);
}

void main( void ) {

    ivec2 ssC = ivec2(gl_FragCoord.xy);

    vec3 cameraSpacePosition = getPosition(ssC);
    vec3 normal = reconstructNormal(cameraSpacePosition);

    float randomAngle = rand(gl_FragCoord.xy / vec2(RenderSize)) * 6.28;
    float ssRadius = - uProjScale * uRadius / max(cameraSpacePosition.z, EPSILON);

    // EARLY RETURN
    // Impossible to compute AO, too few pixels concerned by the radius
    if (ssRadius < MIN_RADIUS ) {
        gl_FragColor = vec4(1.0, vec3(0.0));
        return;
    }

    float contrib = 0.0;
    for (int i = 0; i < NB_SAMPLES; ++i) {

        float screenSpaceRadius;
        vec2 offsetUnitVec = computeOffsetUnitVec(i, randomAngle, screenSpaceRadius);
        screenSpaceRadius = max(0.75, screenSpaceRadius * ssRadius);

        vec3 occludingPoint = getOffsetedPixelPos(ssC, offsetUnitVec, screenSpaceRadius);

        // This fixes the self occlusion created when there is no depth written
        // the offset added is mandatory because the float encoding function
        // introduces some small precision errors
        if (occludingPoint.z <= uNear + 0.01 * uRadius)
            continue;

        vec3 v = occludingPoint - cameraSpacePosition;
        float vv = dot(v, v);
        float vn = dot(v, normal);

        contrib += fallOffMethod0(vv, vn, normal) * mix(1.0, max(0.0, 1.5 * normal.z), 0.35);
    }

    # if HIGH_QUALITY
        float aoValue = pow(max(0.0, 1.0 - sqrt(contrib * (3.0 / float(NB_SAMPLES)))), uIntensity);
    # else
        float aoValue = max(0.0, 1.0 - contrib * uIntensityDivRadius6 * (5.0 / float(NB_SAMPLES)));
        aoValue = (pow(aoValue, 0.2) + 1.2 * aoValue * aoValue * aoValue * aoValue) / 2.2;
    # endif

    gl_FragColor.r = mix(1.0, aoValue, clamp(ssRadius - MIN_RADIUS, 0.0, 1.0));

    // Encodes the depth of the fragment later used in the blur pass
    encodeFloatToVec3(clamp(cameraSpacePosition.z / (uNear + (uFar - uNear)), 0.0, 1.0), gl_FragColor.gba);

    // DEBUG
    // Temporary code setting the background color after the last composer pass
    if (texture2D(uDepthTexture, gl_FragCoord.xy / RenderSize).rgba == vec4(0.0,0.0,0.0, 1.0))
        gl_FragColor.gba = vec3(0.0);
    // END DEBUG
}
