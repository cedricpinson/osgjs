
// require:
// uniform int uEnvironmentMaxLod
// samplerCube uEnvironmentCube
// uniform sampler2D uIntegrateBRDF;
// #pragma include "sphericalHarmonics.glsl"


// frostbite, lagarde paper p67
// http://www.frostbite.com/wp-content/uploads/2014/11/course_notes_moving_frostbite_to_pbr.pdf
float linRoughnessToMipmap( float roughnessLinear )
{
    //return roughnessLinear;
    return sqrt(roughnessLinear);
}

vec3 prefilterEnvMap( float roughnessLinear, const in vec3 R )
{
#ifdef CUBEMAP_LOD

    float lod = linRoughnessToMipmap(roughnessLinear) * uEnvironmentLodRange[1]; //( uEnvironmentMaxLod - 1.0 );
    //return textureCubeLodEXT( uEnvironmentCube, R, lod ).rgb;
    return textureCubeLodEXTFixed( uEnvironmentCube, R, lod );

#else

    float lod = linRoughnessToMipmap(roughnessLinear) * uEnvironmentLodRange[1];

    vec2 uvBase = normalToPanoramaUV( R );
    vec3 texel = texturePanoramaLod( uEnvironment,
                                     uEnvironmentSize,
                                     R,
                                     lod,
                                     uEnvironmentLodRange[0] );
    return texel;
#endif
}

vec2 integrateBRDF( float r, float NoV )
{
    vec4 rgba = texture2D( uIntegrateBRDF, vec2(NoV, r ) );

    const float div = 1.0/65535.0;
    float b = (rgba[3] * 65280.0 + rgba[2] * 255.0);
    float a = (rgba[1] * 65280.0 + rgba[0] * 255.0);

    return vec2( a, b ) * div;
}

// https://www.unrealengine.com/blog/physically-based-shading-on-mobile
vec3 integrateBRDFApprox( const in vec3 specular, float roughness, float NoV )
{
    const vec4 c0 = vec4( -1, -0.0275, -0.572, 0.022 );
    const vec4 c1 = vec4( 1, 0.0425, 1.04, -0.04 );
    vec4 r = roughness * c0 + c1;
    float a004 = min( r.x * r.x, exp2( -9.28 * NoV ) ) * r.x + r.y;
    vec2 AB = vec2( -1.04, 1.04 ) * a004 + r.zw;
    return specular * AB.x + AB.y;
}

vec3 approximateSpecularIBL( const in vec3 specularColor,
                             float rLinear,
                             const in vec3 N,
                             const in vec3 V )
{
    float roughnessLinear = max( rLinear, 0.0);
    float NoV = clamp( dot( N, V ), 0.0, 1.0 );
    vec3 R = normalize( (2.0 * NoV ) * N - V);


    // From Sebastien Lagarde Moving Frostbite to PBR page 69
    // so roughness = linRoughness * linRoughness
    vec3 dominantR = getSpecularDominantDir( N, R, roughnessLinear*roughnessLinear );

    vec3 dir = environmentTransform * dominantR;
    vec3 prefilteredColor = prefilterEnvMap( roughnessLinear, dir );


    // marmoset tricks
    prefilteredColor *= occlusionHorizon( dominantR, osg_FragNormal );

#ifdef MOBILE
    return uBrightness * prefilteredColor * integrateBRDFApprox( specularColor, roughnessLinear, NoV );
#else
    vec2 envBRDF = integrateBRDF( roughnessLinear, NoV );
    return uBrightness * prefilteredColor * ( specularColor * envBRDF.x + envBRDF.y );
#endif
}


vec3 computeIBL_UE4( const in vec3 normal,
                     const in vec3 view,
                     const in vec3 albedo,
                     const in float roughness,
                     const in vec3 specular)
{

    vec3 color = vec3(0.0);
    if ( albedo != color ) { // skip if no diffuse
        color += uBrightness * albedo * evaluateDiffuseSphericalHarmonics(normal,
                                                                          view );
    }

    color += approximateSpecularIBL(specular,
                                    roughness,
                                    normal,
                                    view);

    return color;
}
