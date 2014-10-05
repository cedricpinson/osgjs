#define DefaultGamma 2.2

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
  if(all(lessThan(c.rgb, vec3(0.0031308))))
  {
    if ( all(greaterThan(c.rgb, vec3(0.0))))
    {
      v = c.rgb * 12.92;
    }
  }
  else
  {
    v = 1.055 * pow(c.rgb, vec3(1.0/gamma)) - 0.055;
  }
  return v.rgb;
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
  if ( all(lessThan(c, vec3(0.04045)) )) {
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


void normalizeNormalAndEyeVector( const in vec3 inputNormal, const in vec3 inputEye, out vec3 normal, out vec3 eye )
{
    normal = normalize( inputNormal );
    eye = normalize( -inputEye );
}
