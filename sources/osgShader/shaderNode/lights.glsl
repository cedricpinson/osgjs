// -*-c-*-
////////////////
// ATTENUATION
/////////////
float invSquareFalloff(const in float lampdist, const in float dist)
{
    return lampdist/(lampdist + dist*dist);
}
float invLinearFalloff(const in float lampdist, const in float dist)
{
    return lampdist/(lampdist + dist);
}

float getLightAttenuation(vec3 lightDir, float constant, float linear, float quadratic) {

    float d = length(lightDir);
    float att = 1.0 / ( constant + linear*d + quadratic*d*d);
    return att;
}
///////////////
// SPOT CUT OFF
/////

//
// LIGTHING EQUATION TERMS
///

float specularCookTorrance(const in vec3 n, const in vec3 l, const in vec3 v, const in float hard)
{
    vec3 h = normalize(v + l);
    float nh = dot(n, h);
    float specfac = 0.0;

    if(nh > 0.0) {
        float nv = max(dot(n, v), 0.0);
        float i = pow(nh, hard);

        i = i / (0.1 + nv);
        specfac = i;
    }
    return specfac;
}

float lambert(const in float ndl, const in vec3 diffuse)
{
  return ndl*diffuse;
}

float specularCookTorrance(const in vec3 n, const in vec3 l, const in vec3 v, const in float hard)
{
  vec3 h = normalize(v + l);
  float nh = dot(n, h);
  float specfac = 0.0;

  if(nh > 0.0) {
    float nv = max(dot(n, v), 0.0);
    float i = pow(nh, hard);

    i = i / (0.1 + nv);
    specfac = i;
  }
  return specfac;
}
/////////
/// UTILS
/////////

void computeLightDirection(const in vec3 lampvec, out vec3 lv )
{
    lv = -lampvec;
}

void computeLightPoint(const in vec3 vertexPosition, const in vec3 lampPosition, out vec3 lightVector, out float dist)
{
    lightVector = lampPosition-vertexPosition;
    dist = length(lightVector);
    lightVector = dist > 0.0 ? lightVector / dist :  vec3( 0.0, 1.0, 1.0 );
}

////////////////////////
/// Main func
///////////////////////

/// for each light
//direction, distance, NDL, attenuation, compute diffuse, compute specular

vec4 computeSunLightShading(
                            vec4 materialAmbient,
                            vec4 materialDiffuse,
                            vec4 materialSpecular,
                            float materialShininess,

                            vec4 lightAmbient,
                            vec4 lightDiffuse,
                            vec4 lightSpecular,

                            vec3 normal,
                            vec3 eyeVector,

                            vec3 lightDirection)
{

  // compute distance
  // compute NdL
  float NdotL = max(dot(lightDirection, normal), 0.0);
  if (NdotL != 0.0)
    {
      bool isShadowed = false;
      // compute shadowing term here.
      // isShadowed = computeShadow(shadowContrib)
      if (!isShadowed)
        {
          computeDiffuse(diffuseContrib);
          computeSpecular(specularContrib);
          return lightAmbient*MaterialAmbient + diff*spec*shadowContrib;
        }
    }
}

vec4 computePointLightShading(
                              vec4 materialAmbient,
                              vec4 materialDiffuse,
                              vec4 materialSpecular,
                              float materialShininess,

                              vec4 lightAmbient,
                              vec4 lightDiffuse,
                              vec4 lightSpecular,

                              vec3 normal,
                              vec3 eyeVector,

                              vec3 lightDirection)
{
  distance = computeDistance();
  // compute attenuation
  float attenutation = computeAttenuation();
  if (attenuation != 0.0 )
    {
      Direction = computeDir
        // compute NdL
        float NdotL = max(dot(lightDirection, normal), 0.0);
      if (NdotL != 0.0)
        {
          bool isShadowed = false;
          // compute shadowing term here.
          // isShadowed = computeShadow(shadowContrib)
          if (!isShadowed){
            computeDiffuse(diffuseContrib);
            computeSpecular(specularContrib);
            return lightAmbient*MaterialAmbient + attenuation*diff*spec*shadowContrib;
          }
        }
    }
  return vec4(0.0)
}

vec4 computeSpotLightShading(
                              vec4 materialAmbient,
                              vec4 materialDiffuse,
                              vec4 materialSpecular,
                              float materialShininess,

                              vec4 lightAmbient,
                              vec4 lightDiffuse,
                              vec4 lightSpecular,

                              vec3 normal,
                              vec3 eyeVector,

                              vec3 lightDirection,
                              float lightAttenuation,

                              vec3 lightSpotDirection,
                              float lightCosSpotCutoff,
                              float lightSpotBlend,)
{
  // compute distance
  // compute attenuation && |,k|
  if (attenuation != 0.0)
    {
      // compute direction
      // compute spot cut off
      if (lightCosSpotCutoff != 0.0)
        {
          compute lightSpotBlend
            if (lightSpotBlend != 0.0)
              {
                // compute NdL
                float NdotL = max(dot(lightDirection, normal), 0.0);
                if (NdotL != 0.0)
                  {
                    bool isShadowed = false;
                    // compute shadowing term here.
                    // isShadowed = computeShadow(shadowContrib)
                    if (!isShadowed){
                      computeDiffuse(diffuseContrib)
                        computeSpecular(specularContrib)
                        return lightAmbient*MaterialAmbient + attenuation*spotblend*diff*spec*shadowContrib;
                    }
                  }
              }
        }
    }
  return vec4(0.0)
}
