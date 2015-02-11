#define PI 3.1415926535897932384626433832795
#define PI_2 (2.0*3.1415926535897932384626433832795)
#define INV_PI 1.0/PI
#define INV_LOG2 1.4426950408889634073599246810019

uniform mat4 uEnvironmentTransform;

#ifdef CUBEMAP_LOD
uniform samplerCube uEnvironmentCube;
#extension GL_EXT_shader_texture_lod : enable
#endif

#ifdef PANORAMA
uniform sampler2D uEnvironment;
#endif

uniform vec2 uEnvironmentSize;
uniform vec2 uEnvironmentLodRange;
uniform float uLod;

uniform float uBrightness;

#ifdef UE4
uniform sampler2D uIntegrateBRDF; // ue4
#endif

uniform vec3 uEnvironmentSphericalHarmonics[9];

uniform vec2 uHammersleySamples[NB_SAMPLES];

varying vec3 osg_FragEye;
varying vec3 osg_FragNormal;
varying vec2 osg_FragTexCoord0;
varying vec4 osg_FragTangent;

mat3 environmentTransform;

uniform sampler2D albedoMap;
uniform sampler2D roughnessMap;
uniform sampler2D normalMap;
uniform sampler2D specularMap;
uniform sampler2D aoMap;
uniform int uFlipNormalY;

#pragma include "sphericalHarmonics.glsl"
#pragma include "colorSpace.glsl"

vec3 evaluateDiffuseSphericalHarmonics( const in vec3 N,
                                        const in vec3 V ) {

    return sphericalHarmonics( uEnvironmentSphericalHarmonics, environmentTransform * N );
}


// I dont know where it comes from, it's from substance shaders
float distortion(vec3 Wn)
{
    // Computes the inverse of the solid angle of the (differential) pixel in
    // the environment map pointed at by Wn
    float sinT = sqrt(1.0-Wn.y*Wn.y);
    return sinT;
}
float computeLODPanorama(const in vec3 Ln, float p, const in int nbSamples, const in float maxLod )
{
    return max(0.0, (maxLod) - 0.5*(log(float(nbSamples)) + log( p * distortion(Ln) )) * INV_LOG2);
}

#ifdef CUBEMAP_LOD

#pragma include "cubemapSampler.glsl"

float computeLODCubemap( float p, const in int nbSamples, const in float maxLod)
{
    // from sebastien lagarde - frosbite paper
    float ds = 1.0/ ( float(nbSamples) * p );
    float dp = 4.0 * PI / ( 6.0 * uEnvironmentSize[0] * uEnvironmentSize[0] );

    float lod = 0.5 * log2(ds/dp);
    return clamp(lod, 0.0, maxLod);
}
#endif


#ifdef PANORAMA
#pragma include "panoramaSampler.glsl"

vec3 getTexelPanorama( const in vec3 dir, const in float lod ) {
    vec2 uvBase = normalToPanoramaUV( dir );
    vec3 texel = texturePanoramaLod( uEnvironment,
                                     uEnvironmentSize,
                                     dir,
                                     lod,
                                     uEnvironmentLodRange[0] );
    return texel;
}

vec3 getReferenceTexelEnvironment( const in vec3 dirLocal, const in float lod ) {
    vec3 direction = environmentTransform * dirLocal;
    return getTexelPanorama( direction, lod );
}

#endif

vec3 getReferenceTexelEnvironmentLod( const in vec3 dirLocal, const in float pdf ) {

    vec3 direction = environmentTransform * dirLocal;

#ifdef CUBEMAP_LOD

    float lod = computeLODCubemap( pdf, int(NB_SAMPLES), uEnvironmentLodRange[0]);
    return textureCubeLodEXTFixed(uEnvironmentCube, direction, lod );

#else

    //float lod = computeLODPanorama(direction, pdf, int(NB_SAMPLES), uEnvironmentLodRange[0] );
    float lod = computeLODPanorama(direction, pdf, int(NB_SAMPLES), uEnvironmentLodRange[1] );
    return getTexelPanorama( direction, lod );
#endif
}

#ifdef UE4
#pragma include "pbr_ue4.glsl"
#endif




#ifdef IMPORTANCE_SAMPLING
#pragma include "pbr.glsl"
#endif

mat3 getEnvironmentTransfrom( mat4 transform ) {
    vec3 x = vec3(transform[0][0], transform[1][0], transform[2][0]);
    vec3 y = vec3(transform[0][1], transform[1][1], transform[2][1]);
    vec3 z = vec3(transform[0][2], transform[1][2], transform[2][2]);
    mat3 m = mat3(x,y,z);
    return m;
}

vec3 computeNormalFromTangentSpaceNormalMap(const in vec4 tangent, const in vec3 normal, const in vec3 texnormal)
{
    vec3 tang = vec3(0.0,1.0,0.0);
    if (length(tangent.xyz) != 0.0) {
        tang = normalize(tangent.xyz);
    }
    vec3 B = -tangent.w * cross(normal, tang);
    vec3 outnormal = texnormal.x*tang + texnormal.y*B + texnormal.z*normal;
    return normalize(outnormal);
}

vec3 textureNormal(const in vec3 rgb) {
    vec3 n = normalize((rgb-vec3(0.5)));
    n[1] = (uFlipNormalY == 1) ? -n[1] : n[1];
    return n;
}


void main(void) {

    vec3 normal = normalize(osg_FragNormal);
    vec3 eye = normalize(osg_FragEye);
    vec4 tangent = osg_FragTangent;
    vec2 uv = osg_FragTexCoord0.xy;

    environmentTransform = getEnvironmentTransfrom( uEnvironmentTransform );

    const vec3 dielectricColor = vec3(0.04);
    float minRoughness = 1.e-4;

    vec4 albedoSource = texture2D( albedoMap, uv ).rgba;
    vec3 albedo = sRGBToLinear( albedoSource.rgb, DefaultGamma );

#ifdef NORMAL
    vec3 normalTexel = texture2D( normalMap, uv ).rgb;
    if ( length(normalTexel) > 0.0001 ) {
        normalTexel = textureNormal( normalTexel );
        normal = computeNormalFromTangentSpaceNormalMap( tangent, normal, normalTexel );
    }
#endif

    float roughness = texture2D( roughnessMap, uv ).r;
    //roughness = 0.142857;
#ifdef GLOSSINESS
    roughness = 1.0 - roughness;
#endif

    roughness = max( minRoughness , roughness );
    float ao = 1.0;

#ifdef AO
    ao = texture2D( aoMap, uv ).r;
#endif

    vec3 specular;

#ifdef SPECULAR
    specular = sRGBToLinear( texture2D( specularMap, osg_FragTexCoord0 ), DefaultGamma ).rgb;
#else
    float metallic = texture2D( specularMap, uv ).r;
    vec3 albedoReduced = albedo * (1.0 - metallic);
    specular = mix( dielectricColor, albedo, metallic);
    albedo = albedoReduced;
#endif

    vec3 resultIBL;
#ifdef IMPORTANCE_SAMPLING
    resultIBL = computeIBL( tangent, normal, -eye, albedo, roughness, specular );
#else
    resultIBL = computeIBL_UE4( normal, -eye, albedo, roughness, specular );
#endif
    vec4 result = vec4( resultIBL, 1.0);

    gl_FragColor = linearTosRGB(result, DefaultGamma );
}
