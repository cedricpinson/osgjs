#ifdef GL_ES
precision highp float;
#endif

varying vec2 FragTexCoord0;
varying vec4 FragNormal;
varying vec4 FragPosition;

uniform sampler2D Texture0;
uniform sampler2D Texture2;
uniform samplerCube Texture6;

uniform vec4 renderSize;

float Fresnel(float NdotL, float fresnelBias, float fresnelPow)
{
  float facing = (1.0 - NdotL);
  return max(fresnelBias + (1.0 - fresnelBias) * pow(facing, fresnelPow), 0.0);
}

void main (void)
{
  vec2 vProj = gl_FragCoord.xy * renderSize.zw;
  //vec2 vProj = gl_FragCoord.xy / gl_FragCoord.w;

  //vec3 pos  = normalize(FragPosition.xyz / FragPosition.w);
  vec3 eyeDir  = normalize(FragPosition.xyz);
  vec3 norm = normalize(FragNormal.xyz);

  float refractiveIndex = 1.5;// 1.40 glass refraction index
  vec3 refractDir = refract(eyeDir, norm, 1.0 / refractiveIndex);

//  vec3 refractDir = refract(eyedir, norm, 1.40);
//  refractDir = normalize(  refractDir);

  vec3 refractedCol = texture2D(Texture2, vProj + refractDir.xy * 0.1).rgb;

  vec3 diffuse = texture2D(Texture0, FragTexCoord0).rgb;



  vec3 reflectDir = reflect(eyeDir, norm);
  vec3 reflectCol = textureCube(Texture6, reflectDir.xyz).rgb;

  float EyedotN = max(dot(eyeDir.xyz, refractDir.xyz), 0.0);
  //float EyedotN = max(dot(norm.xyz, pos.xyz), 0.0);
  //float EyedotN = max(dot(pos.xyz, norm.xyz), 0.0);

  // float fresnel = clamp(Fresnel(EyedotN, 0.4, 5.0), 0.0, 1.0);
  float fresnel = Fresnel(EyedotN, 0.2, 5.0);

  // Lerp between 1 and diffuse for glass transparency
  diffuse.xyz = clamp(0.1 + diffuse.xyz * 0.9, 0.0, 1.0);
  reflectCol.xyz = clamp(0.1 + reflectCol.xyz * 0.9, 0.0, 1.0);

  // Final output blends reflection and refraction using Fresnel term
  gl_FragColor.rgb = refractedCol * diffuse * (1.0 - fresnel) + reflectCol * fresnel;
  //gl_FragColor.rgb = refractedCol * diffuse * fresnel + (1.0-fresnel) * vec3(0.1,0.1,0.1);




  //gl_FragColor.rgb = mix(refractedCol, diffuse, 0.1);
  //   gl_FragColor.rgb = refractedCol;
  //gl_FragColor.rgb = reflectCol;

  gl_FragColor.a = 1.0;

}
