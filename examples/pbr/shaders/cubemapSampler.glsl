#pragma include "colorSpace.glsl"

vec3 textureCubeRGBE(const in samplerCube tex, const in vec3 uv) {
    vec4 rgbe = textureCube(tex, uv );
    return RGBEToRGB( rgbe );
}


vec3 scaleDirection(const in float scale, const in vec3 dirIn)
{
    vec3 dir = dirIn;
    float M = max(max(abs(dir.x), abs(dir.y)), abs(dir.z));
    if (abs(dir.x) != M) dir.x *= scale;
    if (abs(dir.y) != M) dir.y *= scale;
    if (abs(dir.z) != M) dir.z *= scale;
    return dir;
}

vec3 textureCubemapLod(const in samplerCube tex, const in vec3 dir, const in float lod )
{
#ifdef CUBEMAP_LOD
    vec4 rgba = textureCubeLodEXT( tex, dir, lod );
#else
    vec4 rgba = textureCube( tex, dir );
#endif
#ifdef FLOAT
    return rgba.rgb;
#endif
#ifdef RGBE
    return RGBEToRGB( rgba );
#endif
#ifdef RGBM
    return RGBMToRGB( rgba );
#endif
#ifdef LUV
    return LUVToRGB( rgba );
#endif
}

vec3 textureCubemap(const in samplerCube tex, const in vec3 dir )
{
    vec4 rgba = textureCube( tex, dir );
#ifdef FLOAT
    return rgba.rgb;
#endif
#ifdef RGBE
    return RGBEToRGB( rgba );
#endif
#ifdef RGBM
    return RGBMToRGB( rgba );
#endif
#ifdef LUV
    return LUVToRGB( rgba );
#else
    return rgba.rgb;
#endif
}



vec3 cubemapSeamlessFixDirection(const in vec3 direction, const in float scale )
{
    vec3 dir = direction;
    // http://seblagarde.wordpress.com/2012/06/10/amd-cubemapgen-for-physically-based-rendering/
    float M = max(max(abs(dir.x), abs(dir.y)), abs(dir.z));

    if (abs(dir.x) != M) dir.x *= scale;
    if (abs(dir.y) != M) dir.y *= scale;
    if (abs(dir.z) != M) dir.z *= scale;

    return dir;
}

vec3 textureCubeLodEXTFixed(const in samplerCube tex, const in vec3 direction, const in float lodInput )
{

    float lod = min( uEnvironmentLodRange[0], lodInput );

    // http://seblagarde.wordpress.com/2012/06/10/amd-cubemapgen-for-physically-based-rendering/
    float scale = 1.0 - exp2(lod) / uEnvironmentSize[0];
    vec3 dir = cubemapSeamlessFixDirection( direction, scale);

    return textureCubemapLod( tex, dir, lod ).rgb;
}


// seamless cubemap for background ( no lod )
vec3 textureCubeFixed(const in samplerCube tex, const in vec3 direction )
{
    // http://seblagarde.wordpress.com/2012/06/10/amd-cubemapgen-for-physically-based-rendering/
    float scale = 1.0 - 1.0 / uEnvironmentSize[0];
    vec3 dir = cubemapSeamlessFixDirection( direction, scale);
    return textureCubemap( tex, dir );
}
