// references
// https://www.khronos.org/registry/gles/extensions/EXT/EXT_sRGB.txt

// approximation
// http://chilliant.blogspot.fr/2012/08/srgb-approximations-for-hlsl.html
float linearTosRGB(const in float c) {
    if (c >= 1.0) return 1.0;
    float S1 = sqrt(c);
    float S2 = sqrt(S1);
    float S3 = sqrt(S2);
    return 0.662002687 * S1 + 0.684122060 * S2 - 0.323583601 * S3 - 0.0225411470 * c;
}

vec3 linearTosRGB(const in vec3 c) {
    vec3 cm = min(c, 1.0);
    vec3 S1 = sqrt(cm);
    vec3 S2 = sqrt(S1);
    vec3 S3 = sqrt(S2);
    return 0.662002687 * S1 + 0.684122060 * S2 - 0.323583601 * S3 - 0.0225411470 * cm;
}

vec4 linearTosRGB(const in vec4 c) {
    vec3 cm = min(c.rgb, 1.0);
    vec3 S1 = sqrt(cm);
    vec3 S2 = sqrt(S1);
    vec3 S3 = sqrt(S2);
    return vec4(0.662002687 * S1 + 0.684122060 * S2 - 0.323583601 * S3 - 0.0225411470 * cm, c.a);
}

float sRGBToLinear(const in float c) {
    return c * (c * (c * 0.305306011 + 0.682171111) + 0.012522878);
}

vec3 sRGBToLinear(const in vec3 c) {
    return c * (c * (c * 0.305306011 + 0.682171111) + 0.012522878);
}

vec4 sRGBToLinear(const in vec4 c) {
    return vec4(c.rgb * (c.rgb * (c.rgb * 0.305306011 + 0.682171111) + 0.012522878), c.a);
}

//http://graphicrants.blogspot.fr/2009/04/rgbm-color-encoding.html
vec3 RGBMToRGB( const in vec4 rgba ) {
    const float maxRange = 8.0;
    return rgba.rgb * maxRange * rgba.a;
}

const mat3 LUVInverse = mat3( 6.0013,    -2.700,   -1.7995,
                              -1.332,    3.1029,   -5.7720,
                              0.3007,    -1.088,    5.6268 );

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
vec4 encodeRGBM(const in vec3 col, const in float range) {
    if(range <= 0.0)
        return vec4(col, 1.0);
    vec4 rgbm;
    vec3 color = col / range;
    rgbm.a = clamp( max( max( color.r, color.g ), max( color.b, 1e-6 ) ), 0.0, 1.0 );
    rgbm.a = ceil( rgbm.a * 255.0 ) / 255.0;
    rgbm.rgb = color / rgbm.a;
    return rgbm;
}

vec3 decodeRGBM(const in vec4 col, const in float range) {
    if(range <= 0.0)
        return col.rgb;
    return range * col.rgb * col.a;
}