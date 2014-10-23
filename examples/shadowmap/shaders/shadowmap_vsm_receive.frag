#ifdef GL_ES
precision highp float;
#endif

uniform float Light0_uniform_enable;
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

uniform float Light1_uniform_enable;
uniform vec4 Light1_uniform_position;
uniform vec3 Light1_uniform_direction;
uniform mat4 Light1_uniform_matrix;
uniform mat4 Light1_uniform_invMatrix;
uniform float Light1_uniform_constantAttenuation;
uniform float Light1_uniform_linearAttenuation;
uniform float Light1_uniform_quadraticAttenuation;
uniform vec4 Light1_uniform_ambient;
uniform vec4 Light1_uniform_diffuse;
uniform vec4 Light1_uniform_specular;
uniform float Light1_uniform_spotCutOff;
uniform float Light1_uniform_spotBlend;

uniform float Light2_uniform_enable;
uniform vec4 Light2_uniform_position;
uniform vec3 Light2_uniform_direction;
uniform mat4 Light2_uniform_matrix;
uniform mat4 Light2_uniform_invMatrix;
uniform float Light2_uniform_constantAttenuation;
uniform float Light2_uniform_linearAttenuation;
uniform float Light2_uniform_quadraticAttenuation;
uniform vec4 Light2_uniform_ambient;
uniform vec4 Light2_uniform_diffuse;
uniform vec4 Light2_uniform_specular;
uniform float Light2_uniform_spotCutOff;
uniform float Light2_uniform_spotBlend;

uniform vec4 Shadow_MapSize0;
uniform vec4 Shadow_MapSize1;
uniform vec4 Shadow_MapSize2;

uniform vec4 Shadow_DepthRange0;
uniform vec4 Shadow_DepthRange1;
uniform vec4 Shadow_DepthRange2;

uniform sampler2D Texture0;
uniform sampler2D Texture1;
uniform sampler2D Texture2;
uniform sampler2D Texture3;

uniform float bias;
uniform float VsmEpsilon;
uniform float exponent;

varying vec4 Shadow_VertexProjected0;
varying vec4 Shadow_VertexProjected1;
varying vec4 Shadow_VertexProjected2;

varying vec4 Shadow_Z0;
varying vec4 Shadow_Z1;
varying vec4 Shadow_Z2;

uniform float debug;


uniform float ArrayColorEnabled;

uniform vec4 MaterialAmbient;
uniform vec4 MaterialDiffuse;
uniform vec4 MaterialSpecular;
uniform vec4 MaterialEmission;
uniform float MaterialShininess;

uniform vec4 Camera_uniform_position;

varying vec4 VertexColor;
varying vec3 FragNormal;
varying vec3 FragVector;
varying vec2 FragTexCoord0;

#pragma include "common.frag"
#pragma include "shadow.glsl"


float computeShadowTerm(in vec4 shadowVertexProjected, in vec4 shadowZ, 
  in sampler2D tex, in vec4 texSize, in vec4 depthRange, 
  in vec3 lightPos, in float N_Dot_L, in vec3 Normal){

    vec4 shadowUV;

	//normal offset aka Exploding Shadow Receivers
    float shadowMapTexelSize = shadowVertexProjected.z * 2.0*texSize.z;
    shadowVertexProjected -= vec4(Normal.xyz*bias*shadowMapTexelSize,0);
	
    shadowUV = shadowVertexProjected / shadowVertexProjected.w;
    shadowUV.xy = shadowUV.xy* 0.5 + 0.5;

     // outside light frustum, ignore
    if (shadowUV.x >= 1.0 || shadowUV.y >= 1.0 || shadowUV.x <= 0.0 || shadowUV.y <= 0.0)
     return 1.0;// turn to 0.0 in order to show limits of light frustum,

    vec4 depth =  texture2D(tex, shadowUV.xy);
    vec2 moments = depth.xy;
    float objDepth;
    //#define NUM_STABLE
    #ifndef NUM_STABLE
      objDepth = -shadowZ.z;
      objDepth =  (objDepth - depthRange.x)* depthRange.w;// linerarize (aka map z to near..far to 0..1)
      objDepth =   clamp(objDepth, 0.0, 1.0);
    #else
      objDepth =  length(lightPos.xyz - shadowZ.xyz );
      objDepth =  (objDepth - depthRange.x)* depthRange.w;// linerarize (aka map z to near..far to 0..1)
      objDepth =   clamp(objDepth, 0.0, 1.0);

    #endif

    float shadowBias = 0.005*tan(acos(N_Dot_L)); // cosTheta is dot( n, l ), clamped between 0 and 1
    shadowBias = clamp(shadowBias, 0.0, bias);

    // Chebyshev inequality
    return ChebyshevUpperBound(moments, objDepth, shadowBias, VsmEpsilon);
}

#pragma include "light.frag"


void main(void) {
    vec4 fragColor = VertexColor;
    vec4 diffuse = (debug == 0.0) ? vec4(1.0, 1.0, 1.0, 1.0) : texture2D(Texture0, FragTexCoord0.xy);
    if (diffuse.x != 0.0 && diffuse.y != 0.0 && diffuse.z != 0.0)
      fragColor *= diffuse;


    vec3 normal = FragNormal;
    if (!gl_FrontFacing)
    {
      //back facing
       normal = -normal;
    }
	normal = normalize(normal);

  vec3 eyeVector = normalize(Camera_uniform_position.xyz - FragVector.xyz);
   

  vec4 lightColor = vec4(0.0, 0.0, 0.0, 0.0);
  const vec4 nullColor = vec4(0.0, 0.0, 0.0, 0.0);

 lightColor +=  Light0_uniform_enable == 0.0 ? nullColor :
                      ComputeLigthShadow(Light0_uniform_position, Light0_uniform_direction, FragVector,
                       normal,  eyeVector,
                       MaterialAmbient,  MaterialDiffuse,  MaterialSpecular,  MaterialShininess,
                       Light0_uniform_ambient,  Light0_uniform_diffuse,  Light0_uniform_specular,
                       Light0_uniform_constantAttenuation, Light0_uniform_linearAttenuation, Light0_uniform_quadraticAttenuation,
                       Light0_uniform_spotCutOff,  Light0_uniform_spotBlend,
                       Shadow_VertexProjected0, Shadow_Z0, Texture1, Shadow_MapSize0, Shadow_DepthRange0);


 lightColor +=  Light1_uniform_enable == 0.0 ? nullColor :
                      ComputeLigthShadow(Light1_uniform_position, Light1_uniform_direction, FragVector,
                        normal,  eyeVector,
                       MaterialAmbient,  MaterialDiffuse,  MaterialSpecular,  MaterialShininess,
                       Light1_uniform_ambient,  Light1_uniform_diffuse,  Light1_uniform_specular,
                       Light1_uniform_constantAttenuation, Light1_uniform_linearAttenuation, Light1_uniform_quadraticAttenuation,
                       Light1_uniform_spotCutOff,  Light1_uniform_spotBlend,
                       Shadow_VertexProjected1, Shadow_Z1, Texture2, Shadow_MapSize1, Shadow_DepthRange1);


 lightColor +=  Light2_uniform_enable == 0.0 ? nullColor :
                      ComputeLigthShadow(Light2_uniform_position, Light2_uniform_direction, FragVector,
                        normal,  eyeVector,
                       MaterialAmbient,  MaterialDiffuse,  MaterialSpecular,  MaterialShininess,
                       Light2_uniform_ambient,  Light2_uniform_diffuse,  Light2_uniform_specular,
                       Light2_uniform_constantAttenuation, Light2_uniform_linearAttenuation, Light2_uniform_quadraticAttenuation,
                       Light2_uniform_spotCutOff,  Light2_uniform_spotBlend,
                       Shadow_VertexProjected2, Shadow_Z2, Texture3, Shadow_MapSize2, Shadow_DepthRange2);

    fragColor = linearrgb_to_srgb(MaterialEmission +  fragColor * vec4(lightColor.xyz, 1.0));

    gl_FragColor = fragColor;
}