#pragma include "math.glsl"
#pragma include "colorSpace.glsl"


vec2 computeUVForMipmap( const in float level, const in vec2 uv, const in float size, const in float maxLOD ) {

    // width for level
    float widthForLevel = exp2( maxLOD-level);

    // the height locally for the level in pixel
    // to opimitize a bit we scale down the v by two in the inputs uv
    float heightForLevel = widthForLevel * 0.5;


#if 0
    float texelSize = 1.0 / size;

    float resizeX = (widthForLevel - 2.0) * texelSize;
    float resizeY = (heightForLevel - 2.0) * texelSize;

    float uvSpaceLocalX = texelSize + uv.x * resizeX;
    float uvSpaceLocalY = texelSize + uv.y * resizeY;

    uvSpaceLocalY += (size - widthForLevel ) / size;

    return vec2( uvSpaceLocalX, uvSpaceLocalY);

#else
    // compact version
    float texelSize = 1.0/size;
    vec2 uvSpaceLocal =  vec2(1.0) + uv * vec2(widthForLevel - 2.0, heightForLevel - 2.0);
    uvSpaceLocal.y += size - widthForLevel;
    return uvSpaceLocal * texelSize;
#endif

}

//for y up
vec2 normalToPanoramaUVY( const in vec3 dir )
{
    float n = length(dir.xz);

    // to avoid bleeding the max(-1.0,dir.x / n) is needed
    vec2 pos = vec2( (n>0.0000001) ? max(-1.0,dir.x / n) : 0.0, dir.y);

    // fix edge bleeding
    if ( pos.x > 0.0 ) pos.x = min( 0.999999, pos.x );

    pos = acos(pos)*INV_PI;

    pos.x = (dir.z > 0.0) ? pos.x*0.5 : 1.0-(pos.x*0.5);

    // shift u to center the panorama to -z
    pos.x = mod(pos.x-0.25+1.0, 1.0 );
    pos.y = 1.0-pos.y;
    return pos;
}


// for z up
vec2 normalToPanoramaUVZ( const in vec3 dir )
{
    float n = length(dir.xy);

    // to avoid bleeding the max(-1.0,dir.x / n) is needed
    vec2 pos = vec2( (n>0.0000001) ? max(-1.0,dir.x / n) : 0.0, dir.z);

    // fix edge bleeding
    if ( pos.x > 0.0 ) pos.x = min( 0.999999, pos.x );

    pos = acos(pos)*INV_PI;

    // to avoid bleeding the limit must be set to 0.4999999 instead of 0.5
    pos.x = (dir.y > 0.0) ? pos.x*0.5 : 1.0-(pos.x*0.5);

    // shift u to center the panorama to -y
    pos.x = mod(pos.x-0.25+1.0, 1.0 );
    pos.y = 1.0-pos.y;
    return pos;
}

#define normalToPanoramaUV normalToPanoramaUVY


vec3 texturePanorama(const in sampler2D texture, const in vec2 uv)
{
    vec4 rgba = texture2D(texture, uv );
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

vec3 texturePanoramaLod(const in sampler2D texture,
                         const in vec2 size ,
                         const in vec3 direction,
                         const in float lodInput,
                         const in float maxLOD ) {

    float lod = min( maxLOD, lodInput );
    vec2 uvBase = normalToPanoramaUV( direction );

    // // we scale down v here because it avoid to do twice in sub functions
    // uvBase.y *= 0.5;

    float lod0 = floor(lod);
    vec2 uv0 = computeUVForMipmap(lod0, uvBase, size.x, maxLOD );
    vec3 texel0 = texturePanorama( texture, uv0.xy);

    float lod1 = ceil(lod);
    vec2 uv1 = computeUVForMipmap(lod1, uvBase, size.x, maxLOD );
    vec3 texel1 = texturePanorama( texture, uv1.xy);

    return mix(texel0, texel1, fract( lod ) );
}
