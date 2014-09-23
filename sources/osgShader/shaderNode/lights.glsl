////////////////
// ATTENUATION
/////////////
float getLightAttenuation(const in float dist, const in vec4 lightAttenuation)
{
    // lightAttenuation(constantEnabled, linearEnabled, quadraticEnabled)
    // TODO find a vector alu instead of 4 scalar
    float constant = lightAttenuation.x;
    float linear = lightAttenuation.y*dist;
    float quadratic = lightAttenuation.z*dist*dist;
    return 1.0 / ( constant + linear + quadratic );
}
//
// LIGTHING EQUATION TERMS
///
void specularCookTorrance(const in vec3 n, const in vec3 l, const in vec3 v, const in float hard, const in vec3 materialSpecular, const in vec3 lightSpecular, out vec3 specularContrib)
{
    vec3 h = normalize(v + l);
    float nh = dot(n, h);
    float specfac = 0.0;

    if(nh > 0.0) {
        float nv = max( dot(n, v), 0.0 );
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
////////////////////////
/// Main func
///////////////////////

/// for each light
//direction, dist, NDL, attenuation, compute diffuse, compute specular

vec4 computeSpotLightShading(
    const in vec3 normal,
    const in vec3 eyeVector,

    const in vec4 materialAmbient,
    const in vec4 materialDiffuse,
    const in vec4 materialSpecular,
    const in float materialShininess,

    const in vec4 lightAmbient,
    const in vec4 lightDiffuse,
    const in vec4 lightSpecular,

    const in vec3  lightSpotDirection,
    const in vec4  lightAttenuation,
    const in vec4  lightSpotPosition,
    const in float lightCosSpotCutoff,
    const in float lightSpotBlend,

    const in mat4 lightMatrix,
    const in mat4 lightInvMatrix)
{
    vec3 lightEye = vec3(lightMatrix * lightSpotPosition);
    vec3 lightDir;
    lightDir = lightEye - FragEyeVector;
    // compute dist
    float dist = length(lightDir);
    // compute attenuation
    float attenuation = getLightAttenuation(dist, lightAttenuation);
    if (attenuation != 0.0)
    {
        // compute direction
        lightDir = dist > 0.0 ? lightDir / dist :  vec3( 0.0, 1.0, 0.0 );
        if (lightCosSpotCutoff > 0.0)
        {
            //compute lightSpotBlend
            vec3 lightSpotDirectionEye = normalize(mat3(vec3(lightInvMatrix[0]), vec3(lightInvMatrix[1]), vec3(lightInvMatrix[2]))*lightSpotDirection);

            float cosCurAngle = dot(-lightDir, lightSpotDirectionEye);
            float diffAngle = cosCurAngle - lightCosSpotCutoff;
            float spot = 1.0;
            if ( diffAngle < 0.0 ) {
                spot = 0.0;
            } else {
                if ( lightSpotBlend > 0.0 )
                    spot = cosCurAngle * smoothstep(0.0, 1.0, (cosCurAngle - lightCosSpotCutoff) / (lightSpotBlend));
            }

            if (spot > 0.0)
            {
                // compute NdL
                float NdotL = dot(lightDir, normal);
                if (NdotL > 0.0)
                {

                    vec3 diffuseContrib;
                    lambert(NdotL, materialDiffuse.rgb, lightDiffuse.rgb, diffuseContrib);
                    vec3 specularContrib;
                    specularCookTorrance(normal, lightDir, eyeVector, materialShininess, materialSpecular.rgb, lightSpecular.rgb, specularContrib.rgb);
                    return vec4(lightAmbient.rgb*materialAmbient.rgb + spot*attenuation*(diffuseContrib.rgb+specularContrib.rgb), 1.0);

                }
            }
        }
    }
    return vec4(lightAmbient.rgb*materialAmbient.rgb, 1.0);
}



vec4 computePointLightShading(
    const in vec3 normal,
    const in vec3 eyeVector,

    const in vec4 materialAmbient,
    const in vec4 materialDiffuse,
    const in vec4 materialSpecular,
    const in float materialShininess,

    const in vec4 lightAmbient,
    const in vec4 lightDiffuse,
    const in vec4 lightSpecular,

    const in vec4 lightPosition,
    const in vec4 lightAttenuation,

    const in mat4 lightMatrix,
    const in mat4 lightInvMatrix)
{

    vec3 lightEye =  vec3(lightMatrix * lightPosition);
    vec3 lightDir;
    lightDir = lightEye - FragEyeVector;
    float dist = length(lightDir);
    // compute dist
    // compute attenuation
    float attenuation = getLightAttenuation(dist, lightAttenuation);
    if (attenuation != 0.0)
    {
        // compute direction
        lightDir = dist > 0.0 ? lightDir / dist :  vec3( 0.0, 1.0, 0.0 );
        // compute NdL
        float NdotL = dot(lightDir, normal);
        if (NdotL > 0.0)
        {
            bool isShadowed = false;
            // compute shadowing term here.
            float shadowContrib = 1.0;
            // isShadowed = computeShadow(shadowContrib)
            if (!isShadowed)
            {
                vec3 diffuseContrib;
                lambert(NdotL, materialDiffuse.rgb, lightDiffuse.rgb, diffuseContrib);
                vec3 specularContrib;
                specularCookTorrance(normal, lightDir, eyeVector, materialShininess, materialSpecular.rgb, lightSpecular.rgb, specularContrib.rgb);
                return vec4(lightAmbient.rgb*materialAmbient.rgb + attenuation*shadowContrib*(diffuseContrib.rgb+specularContrib.rgb), 1.0);
            }
        }
    }
    return vec4(lightAmbient.rgb*materialAmbient.rgb, 1.0);
}

vec4 computeSunLightShading(

    const in vec3 normal,
    const in vec3 eyeVector,

    const in vec4 materialAmbient,
    const in vec4 materialDiffuse,
    const in vec4 materialSpecular,
    const in float materialShininess,

    const in vec4 lightAmbient,
    const in vec4 lightDiffuse,
    const in vec4 lightSpecular,

    const in vec4 lightPosition,

    const in mat4 lightMatrix,
    const in mat4 lightInvMatrix)
{

    vec3 lightDir = normalize( vec3(lightMatrix * lightPosition ) );
    // compute dist
    // compute NdL   // compute NdL
    float NdotL = dot(lightDir, normal);
    if (NdotL > 0.0)
    {
        bool isShadowed = false;
        // compute shadowing term here.
        float shadowContrib = 1.0;
        // isShadowed = computeShadow(shadowContrib)
        if (!isShadowed)
        {
            vec3 diffuseContrib;
            lambert(NdotL, materialDiffuse.rgb, lightDiffuse.rgb, diffuseContrib);
            vec3 specularContrib;
            specularCookTorrance(normal, lightDir, eyeVector, materialShininess, materialSpecular.rgb, lightSpecular.rgb, specularContrib.rgb);
            return vec4(lightAmbient.rgb*materialAmbient.rgb + shadowContrib*(diffuseContrib.rgb+specularContrib.rgb), 1.0);
        }
    }
    return vec4(lightAmbient.rgb*materialAmbient.rgb, 1.0);
}
