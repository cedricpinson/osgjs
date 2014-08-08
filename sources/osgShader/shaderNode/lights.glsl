////////////////
// ATTENUATION
/////////////
float getLightAttenuation(const in float distance, const in float constant, const in float linear, const in float quadratic)
{
    return 1.0 / ( constant + linear*distance + quadratic*distance*distance );
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
//direction, distance, NDL, attenuation, compute diffuse, compute specular

vec4 computeSpotLightShading(
    const in vec3 normal,
    const in vec3 eyeVector,
    const in vec3 vertexPosition,

    const in vec4 materialAmbient,
    const in vec4 materialDiffuse,
    const in vec4 materialSpecular,
    const in float materialShininess,

    const in vec4 lightAmbient,
    const in vec4 lightDiffuse,
    const in vec4 lightSpecular,

    const in vec3  lightSpotDirection,
    const in vec3  lightAttenuation,
    const in vec3  lightSpotPosition,
    const in float lightCosSpotCutoff,
    const in float lightSpotBlend)
{
    // compute distance
    Vec3 lightVector = lightSpotPosition - vertexPosition;
    float dist = length(lightVector);
    // compute attenuation
    float attenuation = getLightAttenuation(distance, lightAttenuation.x, lightAttenuation.y, lightAttenuation.z);
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
                        lamber(NdotL, MaterialDiffuse.rgb, LightDiffuse.rgb, diffuseContrib);
                        vec3 specularContrib;
                        specularCookTorrance(normal, lightDirection, LightVector, materialShininess, materialSpecular.rgb, lightSpecular.rgb, specularContrib)
                            return lightAmbient*MaterialAmbient + attenuation*spotblend*diffuseContrib*specularContrib*shadowContrib;
                    }
                }
            }
        }
    }
    return vec4(0.0);
}


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
        Direction = computeDir;
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
    return vec4(0.0);
}
