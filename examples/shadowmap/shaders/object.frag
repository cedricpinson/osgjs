#ifdef GL_ES
precision highp float;
#endif
varying vec4 VertexColor;
uniform float ArrayColorEnabled;
vec4 fragColor;
varying vec2 FragTexCoord0;
uniform sampler2D Texture0;
uniform sampler2D Texture1;
uniform float map;
vec4 texColor0;
uniform float rimPower;
uniform float rimIntensity;
uniform float rimOffset;
uniform vec4 rimColor;
uniform vec4 MaterialAmbient;
uniform vec4 MaterialDiffuse;
uniform vec4 MaterialSpecular;
uniform vec4 MaterialEmission;
uniform float MaterialShininess;
varying vec3 FragNormal;
varying vec3 FragEyeVector;
varying vec3 FragTexCoord1;

uniform vec4 Light0_uniform_position;
uniform vec3 Light0_uniform_direction;
uniform mat4 Light0_uniform_matrix;
uniform mat4 Light0_uniform_invMatrix;
uniform float Light0_uniform_constantAttenuation;
uniform float Light0_uniform_linearAttenuation;
uniform float Light0_uniform_quadraticAttenuation;
uniform vec4 Light0_uniform_ambient;
uniform vec4 Light0_uniform_diffuse;
uniform vec4 Light0_uniform_specular;
uniform float Light0_uniform_spotCutOff;
uniform float Light0_uniform_spotBlend;

float getLightAttenuation(vec3 lightDir, float constant, float linear, float quadratic) {
    float d = length(lightDir);
    float att = 1.0 / ( constant + linear*d + quadratic*d*d);
    return att;
}
vec4 computeLightContribution(vec4 materialAmbient,
                              vec4 materialDiffuse,
                              vec4 materialSpecular,
                              float materialShininess,
                              vec4 lightAmbient,
                              vec4 lightDiffuse,
                              vec4 lightSpecular,
                              vec3 normal,
                              vec3 eye,
                              vec3 lightDirection,
                              vec3 lightSpotDirection,
                              float lightCosSpotCutoff,
                              float lightSpotBlend,
                              float lightAttenuation)
{
    vec3 L = lightDirection;
    vec3 N = normal;
    float NdotL = max(dot(L, N), 0.0);
    float halfTerm = NdotL;
    vec4 ambient = lightAmbient;
    vec4 diffuse = vec4(0.0);
    vec4 specular = vec4(0.0);
    float spot = 0.0;

    if (NdotL > 0.0) {
        vec3 E = eye;
        vec3 R = reflect(-L, N);
        float RdotE = pow( max(dot(R, E), 0.0), materialShininess );

        vec3 D = lightSpotDirection;
        spot = 1.0;
        if (lightCosSpotCutoff > 0.0) {
          float cosCurAngle = dot(-L, D);
          if (cosCurAngle < lightCosSpotCutoff) {
             spot = 0.0;
          } else {
             if (lightSpotBlend > 0.0)
               spot = cosCurAngle * smoothstep(0.0, 1.0, (cosCurAngle-lightCosSpotCutoff)/(lightSpotBlend));
          }
        }
        diffuse = lightDiffuse * ((halfTerm));
        specular = lightSpecular * RdotE;
    }

    return (materialAmbient*ambient + (materialDiffuse*diffuse + materialSpecular*specular) * spot) * lightAttenuation;
}

float linearrgb_to_srgb1(const in float c)
{
  float v = 0.0;
  if(c < 0.0031308) {
    if ( c > 0.0)
      v = c * 12.92;
  } else {
    v = 1.055 * pow(c, 1.0/2.4) - 0.055;
  }
  return v;
}

vec4 linearrgb_to_srgb(const in vec4 col_from)
{
  vec4 col_to;
  col_to.r = linearrgb_to_srgb1(col_from.r);
  col_to.g = linearrgb_to_srgb1(col_from.g);
  col_to.b = linearrgb_to_srgb1(col_from.b);
  col_to.a = col_from.a;
  return col_to;
}
float srgb_to_linearrgb1(const in float c)
{
  float v = 0.0;
  if(c < 0.04045) {
    if (c >= 0.0) {
      v = c * (1.0/12.92);
    }
  } else {
    v = pow((c + 0.055)*(1.0/1.055), 2.4);
  }
 return v;
}
vec4 srgb2linear(const in vec4 col_from)
{
  vec4 col_to;
  col_to.r = srgb_to_linearrgb1(col_from.r);
  col_to.g = srgb_to_linearrgb1(col_from.g);
  col_to.b = srgb_to_linearrgb1(col_from.b);
  col_to.a = col_from.a;
  return col_to;
}

float getSphereDepth(float size, float depthScale, float sigma){
    if (size > gl_FragCoord.x && size > gl_FragCoord.y){
      float fresnel = pow(1.0, 4.0);
      float depth = depthScale * gl_FragCoord.z;
      float thickness = abs(depth);
      float sigma = sigma;
      fresnel = 1.0 - fresnel;
      return fresnel * exp(-sigma * thickness);
    }
    return 1.0;
}

void main(void) {
  fragColor = VertexColor;
  texColor0 = srgb2linear(texture2D( Texture0, FragTexCoord0.xy*15.0 ));

  vec2 longitudeLatitude;
  longitudeLatitude.x = (atan(FragTexCoord1.y, FragTexCoord1.x) / 3.1415926 + 1.0) * 0.5;
  float phi = atan(sqrt(FragTexCoord1.y*FragTexCoord1.y + FragTexCoord1.x*FragTexCoord1.x) / FragTexCoord1.z);
  phi = 0.5+phi/3.14;
  longitudeLatitude.y = (phi > 0.5) ? 1.0-phi+0.5 : 0.5-phi;
  vec4 texColor1 = srgb2linear(texture2D( Texture1, longitudeLatitude.xy ));

  //texColor1 = vec4(0.25, 0.3, 0.6, 0.5);
  fragColor = fragColor * mix(texColor0, vec4(0.0, 0.0, 0.0, 1.0), texColor1.a);

  vec3 normal = normalize(FragNormal);
  if (!gl_FrontFacing)
  {//back facing
     normal = -normal;
  }
  vec3 eyeVector = normalize(-FragEyeVector);
  vec4 lightColor = MaterialEmission;

  vec3 Light0_lightEye = vec3(Light0_uniform_matrix * Light0_uniform_position);
  vec3 Light0_lightDir;
  if (Light0_uniform_position[3] == 1.0) {
    Light0_lightDir = Light0_lightEye - FragEyeVector;
  } else {
    Light0_lightDir = Light0_lightEye;
  }
  vec3 Light0_spotDirection = normalize(mat3(vec3(Light0_uniform_invMatrix[0]), vec3(Light0_uniform_invMatrix[1]), vec3(Light0_uniform_invMatrix[2]))*Light0_uniform_direction);
  float Light0_attenuation = getLightAttenuation(Light0_lightDir, Light0_uniform_constantAttenuation, Light0_uniform_linearAttenuation, Light0_uniform_quadraticAttenuation);
  Light0_lightDir = normalize(Light0_lightDir);
  lightColor += computeLightContribution(MaterialAmbient,
                                         MaterialDiffuse,
                                         MaterialSpecular,
                                         MaterialShininess,
                                         Light0_uniform_ambient,
                                         Light0_uniform_diffuse,
                                         Light0_uniform_specular,
                                         normal,
                                         eyeVector,
                                         Light0_lightDir,
                                         Light0_spotDirection,
                                         Light0_uniform_spotCutOff,
                                         Light0_uniform_spotBlend,
                                         Light0_attenuation);

  fragColor *= lightColor;
   float incidence = dot( FragNormal, eyeVector );
  vec3 rim = (pow( 1.0 - clamp(incidence, 0.0, 1.0), rimPower ) * rimIntensity + rimOffset) * rimColor.xyz;
    fragColor.xyz += rim.xyz;
  //fragColor *= getSphereDepth(6378137.0, 1.05, 30.0);
  //fragColor.a = 0.5;
  gl_FragColor = linearrgb_to_srgb(fragColor);
}