// -*-c-*-

#define DefaultGamma 2.4

// deprecated prefer the version at the beginning of the file
float srgb_to_linearrgb1(const in float c, const in float gamma)
{
    float v = 0.0;
    if ( c < 0.04045 ) {
        if ( c >= 0.0 )
            v = c * ( 1.0 / 12.92 );
    } else {
        v = pow( ( c + 0.055 ) * ( 1.0 / 1.055 ), gamma );
    }
    return v;
}
vec4 srgb2linearrgb_vec4(const in vec4 col_from)
{
    vec4 col_to;
    col_to.r = srgb_to_linearrgb1(col_from.r, DefaultGamma);
    col_to.g = srgb_to_linearrgb1(col_from.g, DefaultGamma);
    col_to.b = srgb_to_linearrgb1(col_from.b, DefaultGamma);
    col_to.a = col_from.a;
    return col_to;
}
vec3 srgb2linearrgb_vec3(const in vec3 col_from)
{
    vec3 col_to;
    col_to.r = srgb_to_linearrgb1(col_from.r, DefaultGamma);
    col_to.g = srgb_to_linearrgb1(col_from.g, DefaultGamma);
    col_to.b = srgb_to_linearrgb1(col_from.b, DefaultGamma);
    return col_to;
}
float linearrgb_to_srgb1(const in float c, const in float gamma)
{
    float v = 0.0;
    if(c < 0.0031308) {
        if ( c > 0.0)
            v = c * 12.92;
    } else {
        v = 1.055 * pow(c, 1.0/ gamma) - 0.055;
    }
    return v;
}

vec3 linearrgb2srgb_vec3(const in vec3 col_from, const in float gamma)
{
    vec3 col_to;
    col_to.r = linearrgb_to_srgb1(col_from.r, gamma);
    col_to.g = linearrgb_to_srgb1(col_from.g, gamma);
    col_to.b = linearrgb_to_srgb1(col_from.b, gamma);
    return col_to;
}

vec4 linearrgb2srgb_vec4(const in vec4 col_from, const in float gamma)
{
    vec4 col_to;
    col_to.r = linearrgb_to_srgb1(col_from.r, gamma);
    col_to.g = linearrgb_to_srgb1(col_from.g, gamma);
    col_to.b = linearrgb_to_srgb1(col_from.b, gamma);
    col_to.a = col_from.a;
    return col_to;
}


void mtex_nspace_tangent(const in vec4 tangent, const in vec3 normal, const in vec3 texnormal, out vec3 outnormal)
{
    vec3 tang = vec3(0.0,1.0,0.0);
    if (length(tangent.xyz) != 0.0) {
        tang = normalize(tangent.xyz);
    }
    vec3 B = tangent.w * cross(normal, tang);
    outnormal = texnormal.x*tang + texnormal.y*B + texnormal.z*normal;
    outnormal = normalize(outnormal);
}


vec2 normalToSphericalUV( const in vec3 n )
{
    float PI = 3.14159265358979323846264;
    float EPS = 1e-5;

    // acos is defined [ -1: 1 ]
    // atan( x , y ) require to have |y| > 0

    // when n.y is amlost 1.0 it means that the normal is aligned on axis y
    // so instead of fixing numerical issue we can directly return the supposed
    // uv value
    if ( n.y > (1.0-EPS) ) {
        return vec2( 0.5, 0.0);
    } else if ( n.y < -(1.0-EPS) ) {
        return vec2( 1.0, 1.0);
    }

    float yaw = acos(n.y) / PI;
    float pitch;
    float y = n.z;
    if ( abs( y ) < EPS )
        y = EPS;
    pitch = ( atan(n.x, y) + PI) / (2.0 * PI);

    return vec2( pitch, yaw );
}

vec3 computeAndRotateReflectionVector(const in mat4 transform, const in vec3 view, const in vec3 normal)
{
    vec3 lv = reflect(-view, normal);
    lv = normalize(lv);
    vec3 x = vec3(transform[0][0], transform[1][0], transform[2][0]);
    vec3 y = vec3(transform[0][1], transform[1][1], transform[2][1]);
    vec3 z = vec3(transform[0][2], transform[1][2], transform[2][2]);
    mat3 m = mat3(x,y,z);
    return m*lv;
}

// coding style should be camel case except for acronyme like SRGB or HDR
vec4 linearTosRGB(const in vec4 col_from, const in float gamma)
{
    vec4 col_to;
    col_to.r = linearrgb_to_srgb1(col_from.r, gamma);
    col_to.g = linearrgb_to_srgb1(col_from.g, gamma);
    col_to.b = linearrgb_to_srgb1(col_from.b, gamma);
    col_to.a = col_from.a;
    return col_to;
}

float sRGBToLinear(const in float c, const in float gamma)
{
    float v = 0.0;
    if ( c < 0.04045 ) {
        if ( c >= 0.0 )
            v = c * ( 1.0 / 12.92 );
    } else {
        v = pow( ( c + 0.055 ) * ( 1.0 / 1.055 ), gamma );
    }
    return v;
}
vec4 sRGBToLinear(const in vec4 col_from, const in float gamma)
{
    vec4 col_to;
    col_to.r = sRGBToLinear(col_from.r, gamma);
    col_to.g = sRGBToLinear(col_from.g, gamma);
    col_to.b = sRGBToLinear(col_from.b, gamma);
    col_to.a = col_from.a;
    return col_to;
}
vec3 sRGBToLinear(const in vec3 col_from, const in float gamma)
{
    vec3 col_to;
    col_to.r = sRGBToLinear(col_from.r, gamma);
    col_to.g = sRGBToLinear(col_from.g, gamma);
    col_to.b = sRGBToLinear(col_from.b, gamma);
    return col_to;
}
