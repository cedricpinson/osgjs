// approximation such as http://chilliant.blogspot.fr/2012/08/srgb-approximations-for-hlsl.html
// introduced slightly darker colors and more slight banding in the darks.

// so we stick with the reference implementation (except we don't check if color >= 0.0):
// https://www.khronos.org/registry/gles/extensions/EXT/EXT_sRGB.txt
#define LIN_SRGB(x) x < 0.0031308 ? x * 12.92 : 1.055 * pow(x, 1.0/2.4) - 0.055
#define SRGB_LIN(x) x < 0.04045 ? x * (1.0 / 12.92) : pow((x + 0.055) * (1.0 / 1.055), 2.4)

#pragma DECLARE_FUNCTION
float linearTosRGB(const in float color) { return LIN_SRGB(color); }

#pragma DECLARE_FUNCTION
vec3 linearTosRGB(const in vec3 color) { return vec3(LIN_SRGB(color.r), LIN_SRGB(color.g), LIN_SRGB(color.b)); }

#pragma DECLARE_FUNCTION
vec4 linearTosRGB(const in vec4 color) { return vec4(LIN_SRGB(color.r), LIN_SRGB(color.g), LIN_SRGB(color.b), color.a); }

#pragma DECLARE_FUNCTION NODE_NAME:sRGBToLinear
float sRGBToLinear(const in float color) { return SRGB_LIN(color); }

#pragma DECLARE_FUNCTION NODE_NAME:sRGBToLinear
vec3 sRGBToLinear(const in vec3 color) { return vec3(SRGB_LIN(color.r), SRGB_LIN(color.g), SRGB_LIN(color.b)); }

#pragma DECLARE_FUNCTION NODE_NAME:sRGBToLinear
vec4 sRGBToLinear(const in vec4 color) { return vec4(SRGB_LIN(color.r), SRGB_LIN(color.g), SRGB_LIN(color.b), color.a); }

//http://graphicrants.blogspot.fr/2009/04/rgbm-color-encoding.html
vec3 RGBMToRGB( const in vec4 rgba ) {
    const float maxRange = 8.0;
    return rgba.rgb * maxRange * rgba.a;
}

const mat3 LUVInverse = mat3( 6.0013, -2.700, -1.7995, -1.332, 3.1029, -5.7720, 0.3007, -1.088, 5.6268 );

vec3 LUVToRGB( const in vec4 vLogLuv ) {
    float Le = vLogLuv.z * 255.0 + vLogLuv.w;
    vec3 Xp_Y_XYZp;
    Xp_Y_XYZp.y = exp2((Le - 127.0) / 2.0);
    Xp_Y_XYZp.z = Xp_Y_XYZp.y / vLogLuv.y;
    Xp_Y_XYZp.x = vLogLuv.x * Xp_Y_XYZp.z;
    vec3 vRGB = LUVInverse * Xp_Y_XYZp;
    return max(vRGB, 0.0);
}

// http://graphicrants.blogspot.fr/2009/04/rgbm-color-encoding.html
#pragma DECLARE_FUNCTION
vec4 encodeRGBM(const in vec3 color, const in float range) {
    if(range <= 0.0) return vec4(color, 1.0);
    vec4 rgbm;
    vec3 col = color / range;
    rgbm.a = clamp( max( max( col.r, col.g ), max( col.b, 1e-6 ) ), 0.0, 1.0 );
    rgbm.a = ceil( rgbm.a * 255.0 ) / 255.0;
    rgbm.rgb = col / rgbm.a;
    return rgbm;
}

#pragma DECLARE_FUNCTION
vec3 decodeRGBM(const in vec4 color, const in float range) {
    if(range <= 0.0) return color.rgb;
    return range * color.rgb * color.a;
}

// https://twitter.com/pyalot/status/711956736639418369
// https://github.com/mrdoob/three.js/issues/10331
#pragma DECLARE_FUNCTION NODE_NAME:FrontNormal
#define _frontNormal(normal) gl_FrontFacing ? normal : -normal

#pragma DECLARE_FUNCTION NODE_NAME:Normalize
#define _normalize(vec) normalize(vec)

#pragma DECLARE_FUNCTION
vec4 preMultAlpha(const in vec3 color, const in float alpha) { return vec4(color.rgb * alpha, alpha); }

#pragma DECLARE_FUNCTION
vec4 preMultAlpha(const in vec4 color) { return vec4(color.rgb * color.a, color.a); }

#pragma DECLARE_FUNCTION
vec4 setAlpha(const in vec3 color, const in float alpha) { return vec4(color, alpha); }

#pragma DECLARE_FUNCTION
vec4 setAlpha(const in vec3 color, const in vec4 alpha) { return vec4(color, alpha.a); }
