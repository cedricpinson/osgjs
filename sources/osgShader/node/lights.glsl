#pragma include "lightCommon.glsl"

////////////////
// COOK TORRANCE
////////////////
vec3 specularCookTorrance(
        const in vec3 normal,
        const in vec3 lightDir,
        const in vec3 eyeVector,
        const in float materialShininess,
        const in vec3 materialSpecular,
        const in vec3 lightSpecular) {
  
    vec3 h = normalize(eyeVector + lightDir);
    float nh = dot(normal, h);
    float specfac = 0.0;

    if(nh > 0.0) {
        float nv = max( dot(normal, eyeVector), 0.0 );
        float i = pow(nh, materialShininess);
        i = i / (0.1 + nv);
        specfac = i;
    }
    // ugly way to fake an energy conservation (mainly to avoid super bright stuffs with low glossiness)
    float att = materialShininess > 100.0 ? 1.0 : smoothstep(0.0, 1.0, materialShininess * 0.01);
    return specfac * materialSpecular * lightSpecular * att;
}

vec3 lambert(const in float dotNL,  const in vec3 materialDiffuse, const in vec3 lightDiffuse) {
    return dotNL * materialDiffuse * lightDiffuse;
}

#pragma DECLARE_FUNCTION
void computeLightLambertCookTorrance(
        const in vec3 normal,
        const in vec3 eyeVector,
        const in float dotNL,
        const in float attenuation,

        const in vec3 materialDiffuse,
        const in vec3 materialSpecular,
        const in float materialShininess,

        const in vec3 lightDiffuse,
        const in vec3 lightSpecular,
        const in vec3 eyeLightDir,

        out vec3 diffuseOut,
        out vec3 specularOut,
        out bool lighted) {

    lighted = dotNL > 0.0;
    if (lighted == false) {
        specularOut = diffuseOut = vec3(0.0);
        return;
    }

    specularOut = attenuation * specularCookTorrance(normal, eyeLightDir, eyeVector, materialShininess, materialSpecular, lightSpecular);
    diffuseOut = attenuation * lambert(dotNL, materialDiffuse, lightDiffuse);
}

///////
// HEMI
///////
#pragma DECLARE_FUNCTION
void hemiLight(
        const in vec3 normal,
        const in vec3 eyeVector,
        const in float dotNL,
        const in float eyeLightDir,

        const in vec3 materialDiffuse,
        const in vec3 materialSpecular,
        const in float materialShininess,

        const in vec3 lightDiffuse,
        const in vec3 lightGround,

        out vec3 diffuseOut,
        out vec3 specularOut,
        out bool lighted) {

    lighted = false;
    float weight = 0.5 * dotNL + 0.5;
    diffuseOut = materialDiffuse * mix(lightGround, lightDiffuse, weight);

    // same cook-torrance as above for sky/ground
    float skyWeight = 0.5 * dot(normal, normalize(eyeVector + eyeLightDir)) + 0.5;
    float gndWeight = 0.5 * dot(normal, normalize(eyeVector - eyeLightDir)) + 0.5;
    float skySpec = pow(skyWeight, materialShininess);
    float skyGround = pow(gndWeight, materialShininess);
    float divisor = (0.1 + max( dot(normal, eyeVector), 0.0 ));
    float att = materialShininess > 100.0 ? 1.0 : smoothstep(0.0, 1.0, materialShininess * 0.01);
    
    specularOut = lightDiffuse * materialSpecular * weight * att * (skySpec + skyGround) / divisor;
}
