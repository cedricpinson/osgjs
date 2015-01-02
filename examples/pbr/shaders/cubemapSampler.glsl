#pragma include "colorSpace.glsl"

vec3 textureCubeRGBE(const in samplerCube texture, const in vec3 uv) {
    vec4 rgbe = textureCube(texture, uv );
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

vec3 textureCubemap(const in samplerCube texture, const in vec3 dir, const in float lod )
{
    vec4 rgba = textureCubeLodEXT( texture, dir, lod );
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


vec3 textureCubeLodEXTFixed(const in samplerCube texture, const in vec3 direction, const in float lodInput )
{

    // level 9 = 512 - 9*2 / 512
    // (512 - (2.0*MaxLod - lod )) / 512;

    vec3 dir = direction;
    float lod = min( uEnvironmentLodRange[0], lodInput );

#if 1 //def FLOAT_CUBEMAP_SEAMLESS

    float lod0 = floor( lod );
    float lod1 = ceil( lod );

    vec2 lodx = vec2(lod0, lod1);
    float invSize = 2.0/uEnvironmentSize[0];

    // compute a scale factor for seamless cubemap
    // the max 0.5 it's because we dont want to
    // to have a scale of 0 for lower mipmap
    // must stop before 2x2 pixel mipamp or
    // need to max(0.5, scale) to avoid scale of 0
    vec2 scale = max( vec2(0.5), (vec2(1.0) - exp2(lodx) * invSize ) );

    float M = max(max(abs(dir.x), abs(dir.y)), abs(dir.z));

    vec3 dir0 = dir;
    vec3 dir1 = dir;
    if (abs(dir.x) != M) dir0.x *= scale[0];
    if (abs(dir.y) != M) dir0.y *= scale[0];
    if (abs(dir.z) != M) dir0.z *= scale[0];

    if (abs(dir.x) != M) dir1.x *= scale[1];
    if (abs(dir.y) != M) dir1.y *= scale[1];
    if (abs(dir.z) != M) dir1.z *= scale[1];


    vec3 p0,p1;

    p1 = textureCubemap( texture, dir1, lod1 ).rgb;
    p0 = textureCubemap( texture, dir0, lod0 ).rgb;

    float f = fract(lod);
    return mix(p0,p1, f);

#else

    return textureCubemap( texture, dir, lod );

#endif
}
