#define DefaultGamma 2.4

// coding style should be camel case except for acronyme like SRGB or HDR
float linearTosRGB(const in float c, const in float gamma)
{
  float v = 0.0;
  if(c < 0.0031308) {
    if ( c > 0.0)
      v = c * 12.92;
  } else {
    v = 1.055 * pow(c, 1.0/gamma) - 0.055;
  }
  return v;
}

vec3 linearTosRGB(const in vec3 c, const in float gamma)
{
  vec3 v = vec3(0.0);
  if(all(lessThan(c, vec3(0.0031308))))
  {
    if ( all(greaterThan(c, vec3(0.0))))
    {
      v = c * 12.92;
    }
  }
  else
  {
    v = 1.055 * pow(c, vec3(1.0/gamma)) - 0.055;
  }
  return v;
}

vec4 linearTosRGB(const in vec4 c, const in float gamma)
{
  vec4 v = vec4(0.0);
  v.a = c.a;
  if(all(lessThan(c.rgb, vec3(0.0031308))))
  {
    if ( all(greaterThan(c.rgb, vec3(0.0))))
    {
      v.rgb = c.rgb * 12.92;
    }
  }
  else
  {
    v.rgb = 1.055 * pow(c.rgb, vec3(1.0/gamma)) - 0.055;
  }
  return v;
}

float sRGBToLinear(const in float c, const in float gamma)
{
  float v = 0.0;
  if ( c < 0.04045 )
  {
    if ( c >= 0.0 )
      v = c * ( 1.0 / 12.92 );
  }
  else
  {
    v = pow( ( c + 0.055 ) * ( 1.0 / 1.055 ), gamma );
  }
  return v;
}


vec3 sRGBToLinear(const in vec3 c, const in float gamma)
{

  vec3 v = vec3(0.0);
  if ( all(lessThan(c, vec3(0.04045)) ))
  {
    if ( all(greaterThanEqual(c, vec3(0.0))) )
      {
        v = c * ( 1.0 / 12.92 );
      }
  }
  else
  {
      v = pow( ( c + 0.055 ) * ( 1.0 / 1.055 ), vec3(gamma) );
  }
  return v;
}

vec4 sRGBToLinear(const in vec4 c, const in float gamma)
{
  vec4 v = vec4(0.0);
  v.a = c.a;
  if ( all(lessThan(c.rgb, vec3(0.04045)) ))
  {
    if ( all(greaterThanEqual(c.rgb, vec3(0.0))) )
    {
      v.rgb = c.rgb * ( 1.0 / 12.92 );
    }
  }
  else
  {
     v.rgb = pow( ( c.rgb + 0.055 ) * ( 1.0 / 1.055 ), vec3(gamma) );
  }
  return v;
}

void normalizeNormalAndEyeVector( const in vec3 inputNormal, const in vec3 inputEye, out vec3 normal, out vec3 eye )
{
    normal = normalize( inputNormal );
    eye = normalize( -inputEye );
}

//http://graphicrants.blogspot.fr/2009/04/rgbm-color-encoding.html
vec3 RGBMToRGB( const in vec4 rgba )
{
    const float maxRange = 8.0;
    return rgba.rgb * maxRange * rgba.a;
}

const mat3 LUVInverse = mat3( 6.0013,    -2.700,   -1.7995,
                              -1.332,    3.1029,   -5.7720,
                              0.3007,    -1.088,    5.6268 );

vec3 LUVToRGB( const in vec4 vLogLuv )
{
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
