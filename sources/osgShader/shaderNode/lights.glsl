////////////////
// ATTENUATION
/////////////
float getLightAttenuation(const in float dist, const in float constant, const in float linear, const in float quadratic)
{
    return 1.0 / ( constant + linear*dist + quadratic*dist*dist );
}
///////////////
// SPOT CUT OFF
/////
float getLightSpotCutOff()
{

}
//
// LIGTHING EQUATION TERMS
///
float specularCookTorrance(const in vec3 n, const in vec3 l, const in vec3 v, const in float hard)
{
    vec3 h = normalize(v + l);
    float nh = dot(n, h);
    float specfac = 0.0;

    if(nh > 0.0)
    {
        float nv = max(dot(n, v), 0.0);
        float i = pow(nh, hard);

        i = i / (0.1 + nv);
        specfac = i;
    }
    return specfac;
}

float lambert(const in float ndl, const in vec3 diffuse, const out vec3 diffuseContrib)
{
    diffuseContrib = ndl*diffuse;
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
//direction, dist, NDL, attenuation, compute diffuse, compute specular

vec4 computeSpotLightShading(
    const in vec3 normal,
    const in vec3 eyeVector, // varying reuse global ?
    const in vec3 vertexPosition, // varying reuse global ?

    //const in vec4 u_materialAmbient,
    //const in vec4 u_materialDiffuse,
    //const in vec4 u_materialSpecular,
    //const in float u_materialShininess,

    const in vec4 lightAmbient,
    const in vec4 lightDiffuse,
    const in vec4 lightSpecular,

    const in vec3  lightSpotDirection,
    const in vec3  lightAttenuation,
    const in vec3  lightSpotPosition,
    const in float lightCosSpotCutoff,
    const in float lightSpotBlend)
{
    // compute dist
    Vec3 lightVector = lightSpotPosition - vertexPosition;
    float dist = length(lightVector);
    // compute attenuation
    float attenuation = getLightAttenuation(dist, lightAttenuation.x, lightAttenuation.y, lightAttenuation.z);
    if (attenuation <= 0.0)
    {
        // compute direction
        vector3 lightDirection = dist > 0.0 ? lightVector / dist :  vec3( 0.0, 1.0, 0.0 );
        if (lightCosSpotCutoff > 0.0 && lightSpotBlend > 0.0)
        {
            //compute lightSpotBlend
            float cosCurAngle = dot(-LightDirection, LightSpotDirection);
            float diffAngle = cosCurAngle - lightCosSpotCutoff;
            float spot;;
            if (diffAngle < 0.0 || lightSpotBlend <= 0.0) {
                spot = 0.0;
            } else {
                spot = cosCurAngle * smoothstep(0.0, 1.0, (cosCurAngle - lightCosSpotCutoff) / (lightSpotBlend));
            }

            if (spot > 0.0)
            {
                // compute NdL
                float NdotL = dot(lightDirection, normal);
                if (NdotL > 0.0)
                {
                    bool isShadowed = false;
                    // compute shadowing term here.
                    // isShadowed = computeShadow(shadowContrib)
                    if (!isShadowed){
                        vec3 diffuseContrib;
                        lambert(NdotL, u_materialDiffuse.rgb, LightDiffuse.rgb, diffuseContrib);
                        vec3 specularContrib;
                        specularCookTorrance(normal, lightDirection, eyeVector, u_materialShininess, u_materialSpecular.rgb, lightSpecular.rgb, specularContrib)
                            return lightAmbient*u_materialAmbient + attenuation*spotblend*diffuseContrib*specularContrib*shadowContrib;
                    }
                }
            }
        }
    }
    return vec4(0.0);
}


vec4 computeSunLightShading(

                            const in vec3 normal,
                            const in vec3 eyeVector, // varying reuse global ?

                            //const in vec4 u_materialAmbient,
                            //const in vec4 u_materialDiffuse,
                            //const in vec4 u_materialSpecular,
                            //const in float u_materialShininess,

                            const in vec4 lightAmbient,
                            const in vec4 lightDiffuse,
                            const in vec4 lightSpecular,

                            const in vec3 lightDirection)
{
  // compute dist
  // compute NdL   // compute NdL
  float NdotL = dot(lightDirection, normal);
  if (NdotL > 0.0)
    {
      bool isShadowed = false;
      // compute shadowing term here.
      // isShadowed = computeShadow(shadowContrib)
      if (!isShadowed)
        {
          vec3 diffuseContrib;
          lambert(NdotL, u_materialDiffuse.rgb, lightDiffuse.rgb, diffuseContrib);
          vec3 specularContrib;
          specularCookTorrance(normal, lightDirection, eyeVector, u_materialShininess, u_materialSpecular.rgb, lightSpecular.rgb, specularContrib)
            return lightAmbient*u_materialAmbient + diffuseContrib*specularContrib*shadowContrib;
        }
    }
  return vec4(0.0);
}

vec4 computePointLightShading(
                              const in vec3 normal,
                              const in vec3 eyeVector, // varying reuse global ?
                              const in vec3 vertexPos, // varying reuse global ?

                              // const in vec4 u_materialAmbient,
                              // const in vec4 u_materialDiffuse,
                              // const in vec4 u_materialSpecular,
                              // const in float u_materialShininess,
                              // const in float u_vertexPosition,

                              const in vec4 lightAmbient,
                              const in vec4 lightDiffuse,
                              const in vec4 lightSpecular,
                              const in vec4 lightPosition,
                              const in vec4 lightAttenuation
                              )
{
  // compute dist
  Vec3 lightVector = lightPosition.xyz - vertexPos;
  float dist = length(lightVector);
  // compute attenuation
  float attenuation = getLightAttenuation(dist, lightAttenuation.x, lightAttenuation.y, lightAttenuation.z);
  if (attenuation <= 0.0)
    {
      // compute direction
      vector3 lightDirection = dist > 0.0 ? lightVector / dist :  vec3( 0.0, 1.0, 0.0 );
      // compute NdL
      float NdotL = dot(lightDirection, normal);
      if (NdotL > 0.0)
        {
          bool isShadowed = false;
          // compute shadowing term here.
          // isShadowed = computeShadow(shadowContrib)
          if (!isShadowed){
            vec3 diffuseContrib;
            lambert(NdotL, u_materialDiffuse.rgb, lightDiffuse.rgb, diffuseContrib);
            vec3 specularContrib;
            specularCookTorrance(normal, lightDirection, eyeVector, u_materialShininess, u_materialSpecular.rgb, lightSpecular.rgb, specularContrib)
              return lightAmbient*u_materialAmbient + attenuation*spotblend*diffuseContrib*specularContrib*shadowContrib;
          }
        }
    }
  return vec4(0.0);
}
