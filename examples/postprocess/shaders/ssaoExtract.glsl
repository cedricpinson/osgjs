#pragma include "colorEncode.glsl"

uniform sampler2D TextureDepth;
uniform sampler2D TextureDepth1;
uniform sampler2D TextureDepth2;
uniform sampler2D TextureDepth3;
uniform sampler2D TextureDepth4;
uniform sampler2D TextureDepth5;

uniform vec2 uTextureOutputSize;

uniform float uSsaoRadius;
uniform float uSsaoIntensity;
uniform float uSsaoBias;
uniform vec4 uSsaoProjectionInfo;
uniform float uSsaoProjectionScale;
uniform int uSsaoMipmap;

uniform vec2 uNearFar;

#define NB_SAMPLES 11
// Constant used to scale the depth view value that is given to the blur pass
#define MIN_RADIUS 1.0
#define NB_SPIRAL_TURNS 3.0

float zValueFromScreenSpacePosition(const in float depth) {
    return uNearFar.x + (uNearFar.y - uNearFar.x) * depth;
}

vec3 reconstructCSPosition(const in vec2 ssP, const in float z) {
    return vec3((ssP.xy * uSsaoProjectionInfo.xy + uSsaoProjectionInfo.zw) * z, z);
}

vec3 getPosition(const in vec2 uv) {
    return reconstructCSPosition(uv * uTextureOutputSize, zValueFromScreenSpacePosition(decodeFloatRGBA(TEXTURE_2D_TextureDepth(uv))));
}

#define MAX_MIP_LEVEL 5
// Determines at which point we should switch mip level
// if number is too small (~3) will lead to flashing (bad variance as many taps give same pixel)
// if number is too high, mip level are not used well and the cache is not used efficiently
#define LOG_MAX_OFFSET 3

vec3 getOffsetedPixelPos(
    const in vec2 uv,
    const in vec2 unitOffset,
    const in float screenSpaceRadius) {

    int mipLevel = int(clamp(floor(log2(screenSpaceRadius)) - float(LOG_MAX_OFFSET), 0.0, float(MAX_MIP_LEVEL)));
    vec2 uvOff = uv + floor(screenSpaceRadius * unitOffset) / uTextureOutputSize;

    if(uSsaoMipmap == 0){
        mipLevel = 0;
    }

    float d;
    if (mipLevel == 1) d = zValueFromScreenSpacePosition(decodeFloatRGBA(TEXTURE_2D_TextureDepth1(uvOff)));
    else if (mipLevel == 2) d = zValueFromScreenSpacePosition(decodeFloatRGBA(TEXTURE_2D_TextureDepth2(uvOff)));
    else if (mipLevel == 3) d = zValueFromScreenSpacePosition(decodeFloatRGBA(TEXTURE_2D_TextureDepth3(uvOff)));
    else if (mipLevel == 4) d = zValueFromScreenSpacePosition(decodeFloatRGBA(TEXTURE_2D_TextureDepth4(uvOff)));
    else if (mipLevel == 5) d = zValueFromScreenSpacePosition(decodeFloatRGBA(TEXTURE_2D_TextureDepth5(uvOff)));
    else d = zValueFromScreenSpacePosition(decodeFloatRGBA(TEXTURE_2D_TextureDepth(uvOff)));

    return reconstructCSPosition(uvOff * uTextureOutputSize, d);
}

float nrand(const in vec3 uvt) {
  vec3 p3 = fract(uvt * 443.8975);
  p3 += dot(p3, p3.yzx + 19.19);
  return fract((p3.x + p3.y) * p3.z);
}

#define PIOVER8 0.39269908169
vec3 unpackNormal1(const in float pack1) {
    float pack8 = floor(pack1 * 255.0);
    float th = PIOVER8 * float(pack8 / 16.0);
    float len = sqrt(mod(float(pack8), 16.0) / 15.001);
    vec2 nv = vec2(cos(th), sin(th)) * len;
    return -vec3(nv.x, nv.y, sqrt(max(0.0, 1.0 - nv.x * nv.x - nv.y * nv.y)));
}

vec3 unpackNormal2(const in vec2 pack2) {
    vec3 nv = pack2.rgg * 2.0 - 1.0;
    return -vec3(nv.x, nv.y, sqrt(max(0.0, 1.0 - nv.x * nv.x - nv.y * nv.y)));
}

#define SSAO_TAP_EXTRACT(id) screenSpaceRadius = (float(id) + 0.5) * (1.0 / float(NB_SAMPLES)); \
    angle = screenSpaceRadius * (NB_SPIRAL_TURNS * 6.28) + randomAngle; \
    screenSpaceRadius = max(0.75, screenSpaceRadius * ssRadius); \
    offsetUnitVec = vec2(cos(angle), sin(angle)); \
    occludingPoint = getOffsetedPixelPos(uv, offsetUnitVec, screenSpaceRadius); \
    occludingPoint -= cameraSpacePosition; \
    vv = dot(occludingPoint, occludingPoint); \
    vn = dot(occludingPoint, normal); \
    contrib += max(1.0 - vv * invRadius2, 0.0) * max((vn - uSsaoBias) * inversesqrt(vv), 0.0);

// HIGH QUALITY
// max(1.0 - vv * invRadius2, 0.0) * max((vn - uBias) * inversesqrt(vv), 0.0);
// LOWER QUALITY
// float f = max(1.0/invRadius2 - vv, 0.0);
// return f * f * f * max((vn - uBias) / (vv), 0.0);

vec4 ssaoExtract() {
    vec2 uv = gTexCoord;

    vec3 depthPacked = TEXTURE_2D_TextureDepth(uv).rgb;

    vec3 cameraSpacePosition = getPosition(uv);
    float ssRadius = -uSsaoProjectionScale * uSsaoRadius / cameraSpacePosition.z;

#ifdef SSAO_NORMAL
    vec3 normal = unpackNormal2(TEXTURE_2D_TextureDepth(uv).ba); // g buffer normal 2 component on ba
#elif defined(GL_OES_standard_derivatives) && !defined(MOBILE)
    vec3 normal = cross(dFdy(cameraSpacePosition), dFdx(cameraSpacePosition));
#else
    vec3 cam0 = getPosition(uv - vec2(1.0, 0.0) / uTextureOutputSize);
    vec3 cam1 = getPosition(uv + vec2(1.0, 0.0) / uTextureOutputSize);
    vec3 cam2 = getPosition(uv - vec2(0.0, 1.0) / uTextureOutputSize);
    vec3 cam3 = getPosition(uv + vec2(0.0, 1.0) / uTextureOutputSize);
    vec3 normal = cross(cam0 - cam1, cam3 - cam2);
#endif

    // early return background or radius too small (should be check after derivatives usage)
    if (depthPacked.x == 1.0 || ssRadius < MIN_RADIUS) {
        return vec4(depthPacked, 1.0);
    }

    normal = normalize(normal);
    float nFalloff = mix(1.0, max(0.0, 1.5 * normal.z), 0.35);

    float randomAngle = nrand(vec3(uv.xyy)) * 6.3; // needs to be > 2PI

    float invRadius2 = 1.0 / (uSsaoRadius * uSsaoRadius);
    float contrib = 0.0;

    // ---- UNROLL ----
    float vv;
    float vn;
    float screenSpaceRadius;
    float angle;
    vec3 occludingPoint;
    vec2 offsetUnitVec;
    for(int i = 0; i < NB_SAMPLES; ++i) {
        SSAO_TAP_EXTRACT(i);
    }
    // ---- UNROLL ----

    float aoValue = max(0.0, 1.0 - sqrt(contrib * nFalloff / float(NB_SAMPLES)));
    aoValue = pow(aoValue, 10.0 * uSsaoIntensity);

    vec4 aoDepth;
    aoDepth.rgb = depthPacked;
    aoDepth.a = mix(1.0, aoValue, clamp(ssRadius - MIN_RADIUS, 0.0, 1.0));

    return aoDepth;
}