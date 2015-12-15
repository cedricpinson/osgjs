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

//uniform vec2 uHammersleySamples[NB_SAMPLES];

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
uniform int uNormalAA;
uniform int uSpecularPeak;
uniform int uOcclusionHorizon;

#pragma include "sphericalHarmonics.glsl"
#pragma include "colorSpace.glsl"


// From Sebastien Lagarde Moving Frostbite to PBR page 69
// We have a better approximation of the off specular peak
// but due to the other approximations we found this one performs better.
// N is the normal direction
// R is the mirror vector
// This approximation works fine for G smith correlated and uncorrelated
vec3 getSpecularDominantDir(const in vec3 N, const in vec3 R, const in float realRoughness)
{
    vec3 dominant;
    if ( uSpecularPeak == 1 ) {
        float smoothness = 1.0 - realRoughness;
        float lerpFactor = smoothness * (sqrt(smoothness) + realRoughness);
        // The result is not normalized as we fetch in a cubemap
        dominant = mix(N, R, lerpFactor);
    } else {
        dominant = R;
    }
    return dominant;
}


float occlusionHorizon( const in vec3 R, const in vec3 normal)
{
    if ( uOcclusionHorizon == 0)
        return 1.0;

// http://marmosetco.tumblr.com/post/81245981087
// TODO we set a min value (10%) to avoid pure blackness (in case of pure metal)
    float factor = clamp( 1.0 + 1.3 * dot(R, normal), 0.1, 1.0 );
    return factor * factor;
}


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

    // from sebastien lagarde - frosbite paper
    // and https://placeholderart.wordpress.com/2015/07/28/implementation-notes-runtime-environment-map-filtering-for-image-based-lighting/
    float maxLod = float(uEnvironmentLodRange[1]);
    float textureSize = float(uEnvironmentSize[0]);
    float ds = 1.0/ ( float(NB_SAMPLES) * pdf );
    float dp = 4.0 * PI / ( 6.0 * textureSize * textureSize );

    // Original paper suggest biasing the mip to improve the results
    const float mipmapBias = 1.0;
    float lod = max( 0.5 * log2(ds/dp) + mipmapBias, 0.0 );

    //return textureCubeLodEXTFixed(uEnvironmentCube, direction, lod );
    return textureCubemapLod( uEnvironmentCube, direction, lod ).rgb;
#else
    return vec3(1.0,0.0,1.0);
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

float adjustRoughness( const in float roughness, const in vec3 normal ) {
    // Based on The Order : 1886 SIGGRAPH course notes implementation (page 21 notes)
    float normalLen = length(normal*2.0-1.0);
    if ( normalLen < 1.0) {
        float normalLen2 = normalLen * normalLen;
        float kappa = ( 3.0 * normalLen -  normalLen2 * normalLen )/( 1.0 - normalLen2 );
        // http://www.frostbite.com/2014/11/moving-frostbite-to-pbr/
        // page 91 : they use 0.5/kappa instead
        return min(1.0, sqrt( roughness * roughness + 1.0/kappa ));
    }
    return roughness;
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
        vec3 realNormal = textureNormal( normalTexel );
        normal = computeNormalFromTangentSpaceNormalMap( tangent, normal, realNormal );
    }
#endif

    float roughness = texture2D( roughnessMap, uv ).r;
    //roughness = 0.142857;
#ifdef GLOSSINESS
    roughness = 1.0 - roughness;
#endif

    roughness = max( minRoughness , roughness );
    float ao = 1.0;

#ifdef NORMAL
    if ( uNormalAA == 1 ) {
        roughness = adjustRoughness( roughness, normalTexel);
    }
#endif

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
