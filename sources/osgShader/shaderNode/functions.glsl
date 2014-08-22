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
  vec4 col_to;
  vec3 v = vec3(0.0);
  if(all(lessThan(c.rgb, vec3(0.0031308))))
  {
    if ( all(greaterThan(c.rgb, vec3(0.0))))
    {
      v = c.rgb * vec3(12.92);
    }
  }
  else
  {
    v = 1.055 * pow(c.rgb, vec3(1.0/gamma)) - vec3(0.055);
  }
  return v.rgb;
}

vec4 linearTosRGB(const in vec4 c, const in float gamma)
{
  vec4 col_to;
  vec3 v = vec3(0.0);
  if(all(lessThan(c.rgb, vec3(0.0031308))))
  {
    if ( all(greaterThan(c.rgb, vec3(0.0))))
    {
      v = c.rgb * vec3(12.92);
    }
  }
  else
  {
    v = 1.055 * pow(c.rgb, vec3(1.0/gamma)) - vec3(0.055);
  }
  return vec4(v.rgb, c.a);
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
