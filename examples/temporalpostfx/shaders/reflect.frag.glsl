#extension GL_OES_standard_derivatives : require

#pragma include "colorEncode"

float Fresnel(float NdotL, float fresnelBias, float fresnelPow)
{
  float facing = (1.0 - NdotL);
  return max(fresnelBias + (1.0 - fresnelBias) * pow(facing, fresnelPow), 0.0);
}

vec3 reconstructCSPosition(vec2 S, float z, vec4 projInfo) {
    return vec3((S.xy * projInfo.xy + projInfo.zw) * z, z);
}


vec3 getPosition(const vec2 uv, const sampler2D tex, const vec4 projInfo)
{
  float depth = decodeFloatRGBA(texture2D(tex, uv));
  vec3 Position = reconstructCSPosition(uv, depth, projInfo);
  return Position;

}

float getDepth(const in float depth, const in vec2 nearFar)
{
    return depth;

    float zNear = nearFar.x;
    float zFar = nearFar.y;
    return (2.0 * zNear) / (zFar + zNear - depth * (zFar - zNear));

}


// reconstructs view-space unit normal from view-space position

// reconstructs view-space unit normal from view-space position
vec3 reconstructNormalVS(const in vec3 positionVS) {
   return normalize(vec3(dFdx(positionVS.z) * 500.0, dFdy(positionVS.z) * 500.0, 1.0));
    //return normalize(cross(dFdx(positionVS), dFdy(positionVS)));
}
//Convert something in camera space to screen space
vec3 convertCameraSpaceToScreenSpace(const in vec3 cameraSpace, const in mat4 projectionMatrix)
{
  vec4 clipSpace = projectionMatrix * vec4(cameraSpace, 1);
  vec3 NDCSpace = clipSpace.xyz / clipSpace.w;
  vec3 screenSpace = 0.5 * NDCSpace + 0.5;
  return screenSpace;
}

varying vec4 FragNormal;
varying vec4 FragPosition;


vec4 ComputeReflection(const in sampler2D texDepth,
                       const in sampler2D texColor,
                       const in vec2 uv,
                       const in mat4 projectionMatrix,
                       const in vec4 projInfo,
                       const in vec4 frameSize,
    const in vec2 nearFar)
{
  //Tweakable variables
  const float initialStepAmount = .01;
  const float stepRefinementAmount = .2;
  const int maxRefinements = 6;


  //Values from textures
  vec2 screenSpacePosition2D = uv;




  //vec3 cameraSpacePosition = getPosition(uv, texDepth, projInfo);
  //vec3 cameraSpaceNormal = reconstructNormalVS(cameraSpacePosition);

  vec3 cameraSpacePosition = FragPosition.xyz;
  vec3 cameraSpaceNormal = normalize(FragNormal.xyz);


  //Screen space vector
 vec3 cameraSpaceViewDir = normalize(cameraSpacePosition);


  vec3 cameraSpaceVector = normalize(reflect(cameraSpaceViewDir,cameraSpaceNormal));

  vec3 screenSpacePosition = convertCameraSpaceToScreenSpace(cameraSpacePosition, projectionMatrix);
  vec3 cameraSpaceVectorPosition = cameraSpacePosition + cameraSpaceVector;
  vec3 screenSpaceVectorPosition = convertCameraSpaceToScreenSpace(cameraSpaceVectorPosition, projectionMatrix);
  vec3 screenSpaceVector = initialStepAmount * normalize(screenSpaceVectorPosition - screenSpacePosition);

  //Jitter the initial ray
  //float randomOffset1 = clamp(rand(gl_FragCoord.xy),0,1)/1000.0;
  //float randomOffset2 = clamp(rand(gl_FragCoord.yy),0,1)/1000.0;
  //screenSpaceVector += vec3(randomOffset1,randomOffset2,0);
  vec3 oldPosition = screenSpacePosition + screenSpaceVector;
  vec3 currentPosition = oldPosition + screenSpaceVector;

  //State
  vec4 color = vec4(0.,0.,0.,0.);
  int count = 0;
  int numRefinements = 0;


  //Ray trace!
  float error = length(screenSpaceVector);
   for(int count = 0; count < 50; count++)
    {
      //Stop ray trace when it goes outside screen space

      if(currentPosition.x < 0. || currentPosition.x > 1. ||
         currentPosition.y < 0. || currentPosition.y > 1. ||
         currentPosition.z < 0. || currentPosition.z > 1.)
        break;


      //intersections
      vec2 samplePos = currentPosition.xy;

      float currentDepth = getDepth(currentPosition.z, nearFar);

      vec3 positionNext = getPosition(samplePos, texDepth, projInfo);
      float sampleDepth = getDepth(positionNext.z, nearFar);

      float diff = currentDepth - sampleDepth;
      if(diff >= 0.0 && diff < error)
      {
        screenSpaceVector *= stepRefinementAmount;
        error *= stepRefinementAmount;
        //error = length(screenSpaceVector);

        currentPosition = oldPosition;
        numRefinements++;
        if(numRefinements >= maxRefinements)
        {
            vec3 normalAtPos = reconstructNormalVS(positionNext);
            float orientation = dot(cameraSpaceVector,normalAtPos);
            if(orientation < 0.)
            {
              float cosAngIncidence = -dot(cameraSpaceViewDir,cameraSpaceNormal);
              cosAngIncidence = clamp(1.-cosAngIncidence,0.0,1.0);
              color.rgb = texture2D(texColor, samplePos).rgb * cosAngIncidence;
              color.a = 1.0;
            }
            break;
        }
      }

      //Step ray
      oldPosition = currentPosition;
      currentPosition = oldPosition + screenSpaceVector;

  }
  return color.rgba;
}

varying vec2 FragTexCoord0;

uniform sampler2D Texture0;
uniform sampler2D Texture1;
uniform sampler2D Texture2;
uniform samplerCube Texture6;

uniform mat4 ProjectionMatrix;
uniform vec4 renderSize;
uniform vec2 NearFar;

void main (void)
{
  vec2 screenPos = gl_FragCoord.xy * renderSize.zw;

   vec4 projInfo = vec4(-2.0 / (renderSize.x*ProjectionMatrix[0][0]),
           -2.0 / (renderSize.y*ProjectionMatrix[1][1]),
          ( 1.0 - ProjectionMatrix[0][2]) / ProjectionMatrix[0][0],
          ( 1.0 + ProjectionMatrix[1][2]) / ProjectionMatrix[1][1]);


    vec3 screenSpacePosition;
    // screenSpacePosition = vec3(gl_FragCoord.xy * renderSize.zw,gl_FragCoord.z);
   screenSpacePosition = convertCameraSpaceToScreenSpace(FragPosition.xyz, ProjectionMatrix);

   vec3 position = getPosition(screenPos, Texture1, projInfo);
   vec4 reflection = vec4(0.0, 0.0, 1.0, 0.0);

   if (position.z > (screenSpacePosition.z) - 0.0001)
   {
       reflection = ComputeReflection(Texture1,
                                       Texture2,
                                       screenPos,
                                       ProjectionMatrix,
                                       projInfo,
                                      renderSize,
                                      NearFar);
       if (reflection.a == 1.0){
           gl_FragColor.rgb = reflection.rgb;
           gl_FragColor.a = 1.;
       }
       else{
           gl_FragColor.rgb = vec3(0.2,0.2,0.2);//reflection;//exture2D(Texture0, FragTexCoord0).rgb;
           gl_FragColor.a = 1.;
       }
   }



}
