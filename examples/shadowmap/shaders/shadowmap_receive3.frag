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


#pragma include "floatrgbacodec.glsl"
#pragma include "common.frag"
#pragma include "shadow.glsl"

float bicubicInterpolationFast(in vec2 uv, in sampler2D tex, in vec4 texSize) {
  vec2 rec_nrCP = texSize.zw;
  vec2 coord_hg = uv * texSize.xy-0.5;
  vec2 index = floor(coord_hg);

  vec2 f = coord_hg - index;
  mat4 M =  mat4(
    -1.0,  3.0, -3.0,  1.0,
     3.0, -6.0,  3,  0.0,
    -3.0,  0.0,  3,  0.0,
     1.0,  4.0,  1,  0.0
  );
  M /= 6.0;

  vec4 wx = vec4(f.x*f.x*f.x, f.x*f.x, f.x, 1.0) * M;
  vec4 wy = vec4(f.y*f.y*f.y, f.y*f.y, f.y, 1.0) * M;
  vec2 w0 = vec2(wx.x, wy.x);
  vec2 w1 = vec2(wx.y, wy.y);
  vec2 w2 = vec2(wx.z, wy.z);
  vec2 w3 = vec2(wx.w, wy.w);

  vec2 g0 = w0 + w1;
  vec2 g1 = w2 + w3;
  vec2 h0 = w1 / g0 - 1.0;
  vec2 h1 = w3 / g1 + 1.0;

  vec2 coord00 = index + h0;
  vec2 coord10 = index + vec2(h1.x,h0.y);
  vec2 coord01 = index + vec2(h0.x,h1.y);
  vec2 coord11 = index + h1;

  coord00 = (coord00 + 0.5) * rec_nrCP;
  coord10 = (coord10 + 0.5) * rec_nrCP;
  coord01 = (coord01 + 0.5) * rec_nrCP;
  coord11 = (coord11 + 0.5) * rec_nrCP;

      #ifndef _FLOATTEX
  float tex00 = DecodeFloatRGBA(texture2D(tex, coord00));
  float tex10 = DecodeFloatRGBA(texture2D(tex, coord10));
  float tex01 = DecodeFloatRGBA(texture2D(tex, coord01));
  float tex11 = DecodeFloatRGBA(texture2D(tex, coord11));
      #else
  float tex00 = texture2D(tex, coord00).x;
  float tex10 = texture2D(tex, coord10).x;
  float tex01 = texture2D(tex, coord01).x;
  float tex11 = texture2D(tex, coord11).x;
      #endif

  tex00 = lerp(tex01, tex00, g0.y);
  tex10 = lerp(tex11, tex10, g0.y);

  return lerp(tex10, tex00, g0.x);
}

 float texture2DCompare(sampler2D depths, vec2 uv, float compare, float gbias){
      #ifndef _FLOATTEX
        float depth = DecodeFloatRGBA(texture2D(depths, uv));
      #else
        float depth = texture2D(depths, uv).x;
      #endif
    return step(compare, depth - gbias);
}

float texture2DShadowLerp(sampler2D depths, vec4 size, vec2 uv, float compare, float gbias){
    vec2 texelSize = vec2(1.0)*size.zw;
    vec2 f = fract(uv*size.xy+0.5);
    vec2 centroidUV = floor(uv*size.xy+0.5)*size.zw;

    float lb = texture2DCompare(depths, centroidUV+texelSize*vec2(0.0, 0.0), compare, gbias);
    float lt = texture2DCompare(depths, centroidUV+texelSize*vec2(0.0, 1.0), compare, gbias);
    float rb = texture2DCompare(depths, centroidUV+texelSize*vec2(1.0, 0.0), compare, gbias);
    float rt = texture2DCompare(depths, centroidUV+texelSize*vec2(1.0, 1.0), compare, gbias);
    float a = mix(lb, lt, f.y);
    float b = mix(rb, rt, f.y);
    float c = mix(a, b, f.x);
    return c;
}

float PCFLerp(sampler2D depths, vec4 size, vec2 uv, float compare, float gbias){
    float result = 0.0;
    for(int x=-1; x<=1; x++){
        for(int y=-1; y<=1; y++){
            vec2 off = vec2(x,y)*size.zw;
            result += texture2DShadowLerp(depths, size, uv+off, compare, gbias);
        }
    }
    return result/9.0;
}
float PCF(sampler2D tex, vec4 shadowMapSize, vec2 shadowUV, float shadowZ, float gbias, float exponent) {
    vec2 o = shadowMapSize.zw;
    float shadowed = 0.0;

    vec2 fetch[16];
    fetch[0] = shadowUV.xy + vec2(-1.5, -1.5)*o;
    fetch[1] = shadowUV.xy + vec2(-0.5, -1.5)*o;
    fetch[2] = shadowUV.xy + vec2(0.5, -1.5)*o;
    fetch[3] = shadowUV.xy + vec2(1.5, -1.5)*o;
    fetch[4] = shadowUV.xy + vec2(-1.5, -0.5)*o;
    fetch[5] = shadowUV.xy + vec2(-0.5, -0.5)*o;
    fetch[6] = shadowUV.xy + vec2(0.5, -0.5)*o;
    fetch[7] = shadowUV.xy + vec2(1.5, -0.5)*o;
    fetch[8] = shadowUV.xy + vec2(-1.5, 0.5)*o;
    fetch[9] = shadowUV.xy + vec2(-0.5, 0.5)*o;
    fetch[10] = shadowUV.xy + vec2(0.5, 0.5)*o;
    fetch[11] = shadowUV.xy + vec2(1.5, 0.5)*o;
    fetch[12] = shadowUV.xy + vec2(-1.5, 1.5)*o;
    fetch[13] = shadowUV.xy + vec2(-0.5, 1.5)*o;
    fetch[14] = shadowUV.xy + vec2(0.5, 1.5)*o;
    fetch[15] = shadowUV.xy + vec2(1.5, 1.5)*o;

    for(int i = 0; i < 16; i++) {
      //#define _BICUBIC 1
      #ifdef _BICUBIC
        float zz = bicubicInterpolationFast(fetch[i], tex, shadowMapSize);
      #else
            #ifndef _FLOATTEX
              float zz = DecodeFloatRGBA(texture2D(tex, fetch[i]));
            #else
              float zz = texture2D(tex, fetch[i]).x;
            #endif;
      #endif
      #if defined( _ESM )
        //http://research.edm.uhasselt.be/tmertens/papers/gi_08_esm.pdf
        float c = exponent;
        zz = exp(-c * (shadowZ  - gbias - zz));
        //shadow = zz < 0.0? (0.0) : (1.0);
        //shadowed += clamp(zz, 0.0, 1.0);
        shadowed += smoothstep(0.0, 1.0, zz);
      #else
        shadowed += step(shadowZ - gbias , zz);
      #endif
     }
    shadowed = shadowed / 16.0;
    return shadowed;
}


float getShadowedTermUnified(vec2 shadowUV, float shadowZ, sampler2D tex, vec4 shadowMapSize, float myBias) {
  //
  // Calculate shadow amount
  float shadow = 1.0;


 //#define _VSM
//#define  _ESM
//#define  _PCF
//#define _NONE
    #ifdef _NONE
      #ifndef _FLOATTEX
        float shadowDepth = DecodeFloatRGBA(texture2D(tex, shadowUV.xy));
      #else
        float shadowDepth = texture2D(tex, shadowUV.xy).x;
      #endif
        shadow = ( shadowZ - myBias > shadowDepth ) ? 0.0 : 1.0;
    #elif defined( _PCF ) ||  defined( _ESM )
      shadow = PCF(tex, shadowMapSize, shadowUV, shadowZ, myBias, exponent);
      //shadow = PCFLerp(tex, shadowMapSize, shadowUV, shadowZ, myBias);
      //shadow = (shadowZ -myBias > bicubicInterpolationFast(shadowUV, tex, shadowMapSize)) ? 0.0 : 1.0;
    #elif defined( _ESM )
      //http://research.edm.uhasselt.be/tmertens/papers/gi_08_esm.pdf
      float c = exponent;
      vec4 texel = texture2D(tex, shadowUV.xy);
      #ifndef _FLOATTEX
        float lightDistance = DecodeFloatRGBA(texel);
      #else
        float lightDistance = texel.x;
      #endif
      shadow = clamp(exp(-c * (shadowZ  - myBias - lightDistance)), 0.0, 1.0);
      shadow = (1.0 - shadow >=myBias) ? (0.0) : (1.0);
      //shadow *= 0.9;
    #elif  defined( _VSM )
      vec4 texel = texture2D(tex, shadowUV.xy);
      #ifndef _FLOATTEX
        vec2 moments = DecodeHalfFloatRGBA(texel);
      #else
        vec2 moments = texel.xy;
      #endif
      float shadowBias = myBias;
      shadow = ChebyshevUpperBound(moments, shadowZ, shadowBias, VsmEpsilon);
      //shadow = ChebychevInequality(moments, shadowZ.z);
      //shadow = (1.0 - shadow >=myBias) ? (0.0) : (1.0);

      //shadow = (1.0 - shadow >=myBias) ? (0.0) : (1.0);
      //shadow = shadow * 0.9;
    #elif  defined( _EVSM )
      vec4 texel = texture2D(tex, shadowUV.xy);
      #ifndef _FLOATTEX
        vec2 moments = DecodeHalfFloatRGBA(texel);
      #else
        vec2 moments = texel.xy;
      #endif
      evsmEpsilon = -vsmEpsilon;
      float shadowBias = myBias;
      shadow = ChebyshevUpperBound(moments, shadowZ, shadowBias, VsmEpsilon);
      //shadow = (1.0 - shadow >=myBias) ? (0.0) : (1.0);
    #endif

    return shadow;
}

float computeShadowTerm(in vec4 shadowVertexProjected, in vec4 shadowZ,
  in sampler2D tex, in vec4 texSize,
  in vec4 depthRange, in vec3 LightPosition, in float N_Dot_L, in vec3 Normal) {

    vec4 shadowUV;

	//normal offset aka Exploding Shadow Receivers
    float shadowMapTexelSize = shadowVertexProjected.z * 2.0*texSize.z;
    shadowVertexProjected -= vec4(Normal.xyz*bias*shadowMapTexelSize,0);

    shadowUV = shadowVertexProjected / shadowVertexProjected.w;
    shadowUV.xy = shadowUV.xy* 0.5 + 0.5;

    if (shadowUV.x > 1.0 || shadowUV.y > 1.0 || shadowUV.x < 0.0 || shadowUV.y < 0.0)
     return 1.0;// 0.0 to show limits of light frustum

    float objDepth;
 //#define NUM_STABLE
    #ifndef NUM_STABLE
      objDepth = -shadowZ.z;
      objDepth =  (objDepth - depthRange.x)* depthRange.w;// linerarize (aka map z to near..far to 0..1)
      objDepth =   clamp(objDepth, 0.0, 1.0);
    #else
      objDepth =  length(LightPosition.xyz - shadowZ.xyz );
      objDepth =  (objDepth - depthRange.x)* depthRange.w;// linerarize (aka map z to near..far to 0..1)
      objDepth =   clamp(objDepth, 0.0, 1.0);

    #endif


    float shadowBias = 0.005*tan(acos(N_Dot_L)); // cosTheta is dot( n, l ), clamped between 0 and 1
    shadowBias = clamp(shadowBias, 0.0, bias);

    return getShadowedTermUnified(shadowUV.xy, objDepth, tex, texSize, shadowBias);

}


#pragma include "light.frag"

void main(void) {
    vec4 fragColor;
    fragColor = VertexColor;
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