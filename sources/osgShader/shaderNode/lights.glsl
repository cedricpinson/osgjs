////////////////
// ATTENUATION
/////////////
float getLightAttenuation(const in float dist, const in float constant, const in float linear, const in float quadratic)
{
    return 1.0 / ( constant + linear*dist + quadratic*dist*dist );
}
//
// LIGTHING EQUATION TERMS
///
void specularCookTorrance(const in vec3 n, const in vec3 l, const in vec3 v, const in float hard, const in vec3 materialSpecular, const in vec3 lightSpecular, out vec3 specularContrib)
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
    specularContrib = specfac*materialSpecular*lightSpecular;
}

void lambert(const in float ndl,  const in vec3 materialDiffuse, const in vec3 lightDiffuse, out vec3 diffuseContrib)
{
    diffuseContrib = ndl*materialDiffuse*lightDiffuse;
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
    const in vec3 eyeVector,

    //const in vec4 Material_uniform_ambient,
    //const in vec4 Material_uniform_diffuse,
    //const in vec4 Material_uniform_specular,
    //const in float Material_uniform_shininess,

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
    vec3 lightVector = lightSpotPosition - eyeVector;
    float dist = length(lightVector);
    // compute attenuation
    float attenuation = getLightAttenuation(dist, lightAttenuation.x, lightAttenuation.y, lightAttenuation.z);
    if (attenuation <= 0.0)
    {
        // compute direction
        vec3 lightDirection = dist > 0.0 ? lightVector / dist :  vec3( 0.0, 1.0, 0.0 );
        if (lightCosSpotCutoff > 0.0 && lightSpotBlend > 0.0)
        {
            //compute lightSpotBlend
          float cosCurAngle = dot(-lightDirection, lightSpotDirection);
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
                    float shadowContrib;
                    // isShadowed = computeShadow(shadowContrib)
                    if (!isShadowed){
                        vec3 diffuseContrib;
                        lambert(NdotL, Material_uniform_diffuse.rgb, lightDiffuse.rgb, diffuseContrib);
                        vec3 specularContrib;
                        specularCookTorrance(normal, lightDirection, eyeVector, Material_uniform_shininess, Material_uniform_specular.rgb, lightSpecular.rgb, specularContrib.rgb);
                        return vec4(lightAmbient.rgb*Material_uniform_ambient.rgb + attenuation*spotblend*diffuseContrib.rgb*specularContrib.rgb*shadowContrib, 1.0);
                    }
                }
            }
        }
    }
    return vec4(0.0);
}


vec4 computeSunLightShading(

                            const in vec3 normal,
                            const in vec3 eyeVector,

                            //const in vec4 Material_uniform_ambient,
                            //const in vec4 Material_uniform_diffuse,
                            //const in vec4 Material_uniform_specular,
                            //const in float Material_uniform_shininess,

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
      float shadowContrib;
      // isShadowed = computeShadow(shadowContrib)
      if (!isShadowed)
        {
          vec3 diffuseContrib;
          lambert(NdotL, Material_uniform_diffuse.rgb, lightDiffuse.rgb, diffuseContrib);
          vec3 specularContrib;
          specularCookTorrance(normal, lightDirection, eyeVector, Material_uniform_shininess, Material_uniform_specular.rgb, lightSpecular.rgb, specularContrib.rgb);
          return vec4(lightAmbient.rgb*Material_uniform_ambient.rgb + diffuseContrib.rgb*specularContrib.rgb*shadowContrib, 1.0);
        }
    }
  return vec4(0.0);
}

vec4 computePointLightShading(
                              const in vec3 normal,
                              const in vec3 eyeVector,

                              // const in vec4 Material_uniform_ambient,
                              // const in vec4 Material_uniform_diffuse,
                              // const in vec4 Material_uniform_specular,
                              // const in float Material_uniform_shininess,
                              // const in float u_vertexPosition,

                              const in vec4 lightAmbient,
                              const in vec4 lightDiffuse,
                              const in vec4 lightSpecular,
                              const in vec4 lightPosition,
                              const in vec4 lightAttenuation
                              )
{
  // compute dist
  vec3 lightVector = lightPosition.xyz - eyeVector;
  float dist = length(lightVector);
  // compute attenuation
  float attenuation = getLightAttenuation(dist, lightAttenuation.x, lightAttenuation.y, lightAttenuation.z);
  if (attenuation <= 0.0)
    {
      // compute direction
      vec3 lightDirection = dist > 0.0 ? lightVector / dist :  vec3( 0.0, 1.0, 0.0 );
      // compute NdL
      float NdotL = dot(lightDirection, normal);
      if (NdotL > 0.0)
        {
          bool isShadowed = false;
          // compute shadowing term here.
          float shadowContrib = 1.0;
          // isShadowed = computeShadow(shadowContrib)
          if (!isShadowed){
            vec3 diffuseContrib;
            lambert(NdotL, Material_uniform_diffuse.rgb, lightDiffuse.rgb, diffuseContrib);
            vec3 specularContrib;
            specularCookTorrance(normal, lightDirection, eyeVector, Material_uniform_shininess, Material_uniform_specular.rgb, lightSpecular.rgb, specularContrib.rgb);
            return vec4(lightAmbient.rgb*Material_uniform_ambient.rgb + attenuation*spotblend*diffuseContrib.rgb*specularContrib.rgb*shadowContrib, 1.0);
          }
        }
    }
  return vec4(0.0);
}
