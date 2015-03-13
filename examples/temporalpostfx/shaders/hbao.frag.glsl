#extension GL_OES_standard_derivatives : require

#pragma include "colorEncode"

#define PI 3.1415926535897932384626433832795


uniform sampler2D Texture0;

uniform vec2 RenderSize;
uniform mat4 ProjectionMatrix;
uniform vec2 NearFar;



/*vec2 snapUV(vec2 uv) {
  vec2 temp = uv * viewportResolution;
  temp = floor(temp) + step(vec2(0.5), ceil(temp));

  return temp * (1.0 / viewportResolution);
}*/



/** Morgan McGuire Deep G-buffer
    Reconstruct camera-space P.xyz from screen-space S = (x, y) in
    pixels and camera-space z < 0.  Assumes that the upper-left pixel center
    is at (0.5, 0.5) [but that need not be the location at which the sample tap
    was placed!]

    Costs 3 MADD.  Error is on the order of 10^3 at the far plane, partly due to z precision.

 projInfo = vec4(-2.0f / (RenderSize;X*P[0][0]),
          -2.0f / (RenderSize;Y*P[1][1]),
          ( 1.0f - P[0][2]) / P[0][0],
          ( 1.0f + P[1][2]) / P[1][1])

    where P is the projection matrix that maps camera space points
    to [-1, 1] x [-1, 1].  That is, Camera::getProjectUnit().
*/
vec3 reconstructCSPosition(vec2 S, float z, vec4 projInfo) {
    return vec3((S.xy * projInfo.xy + projInfo.zw) * z, z);
}

vec3 getPosition(const vec2 uv, const sampler2D tex, const vec4 projInfo)
{
  float depth = decodeFloatRGBA(texture2D(tex, uv));
  vec3 Position = reconstructCSPosition(uv, depth, projInfo);
  return Position;

}

vec3 hash32(in vec2 p)
{
    p  = fract(p * vec2(5.3983, 5.4427));
    p += dot(p.yx, p.xy +  vec2(21.5351, 14.3137));
    return fract(vec3(p.x * p.y * 95.4337, p.x * p.y * 97.597, p.x * p.y * 93.8365));
}


// reconstructs view-space unit normal from view-space position
vec3 reconstructNormalVS(const in vec3 positionVS) {
    return normalize(vec3(dFdx(positionVS.z) * 500.0, dFdy(positionVS.z) * 500.0, 1.0)) ;

    // return normalize(cross(dFdx(positionVS), dFdy(positionVS)));
}



// sampling radius is in view space
#define SAMPLING_RADIUS 15.0
#define NUM_SAMPLE_DIRECTIONS 16
// sampling step is in texture space
#define SAMPLING_STEP 0.08
#define NUM_SAMPLE_STEPS 16
#define THRESHOLD 0.1
#define SCALE 1.0
#define NOISE_SCALE 0.1
#define TANGENT_BIAS 0.2
#define FOV ((60.0 * PI) / 180.0)
/*
#define APPLY_ATTENUATION     true
*/

void main() {
  const float TWO_PI = 2.0 * PI;

   vec2 vUV = gl_FragCoord.xy / RenderSize.xy;

   vec4 projInfo = vec4(-2.0 / (RenderSize.x*ProjectionMatrix[0][0]),
           -2.0 / (RenderSize.y*ProjectionMatrix[1][1]),
          ( 1.0 - ProjectionMatrix[0][2]) / ProjectionMatrix[0][0],
          ( 1.0 + ProjectionMatrix[1][2]) / ProjectionMatrix[1][1]);

   vec3 originVS = getPosition(vUV, Texture0, projInfo);
   vec3 normalVS = reconstructNormalVS(originVS);
   normalVS = normalize(normalVS);

  float radiusSS = 0.0; // radius of influence in screen space
  float radiusWS = 0.0; // radius of influence in world space

  radiusSS = SAMPLING_RADIUS;

  vec4 temp0 = vec4(projInfo.zw, -1.0, 1.0);
  vec3 out0  = temp0.xyz;
  vec4 temp1 = vec4(radiusSS * projInfo.x + projInfo.z, projInfo.w, -1.0, 1.0);
  vec3 out1  = temp1.xyz;

  //  too large of a world-space radius; attempt to combat this issue by
  // clamping the world-space radius based on the screen-space radius' projection
  radiusWS = min(tan(radiusSS * FOV / 2.0) * originVS.y / 2.0, length(out1 - out0));

  // early out: radius < pixel
  if (radiusSS < 1.0 / RenderSize.x) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    return;
  }

  const float theta = TWO_PI / float(NUM_SAMPLE_DIRECTIONS);
  float cosTheta = cos(theta);
  float sinTheta = sin(theta);

  // matrix to create the sample directions
  mat2 deltaRotationMatrix = mat2(cosTheta, -sinTheta, sinTheta, cosTheta);

  // step vector in view space
  vec2 deltaUV = vec2(1.0, 0.0) * (radiusSS / (float(NUM_SAMPLE_DIRECTIONS * NUM_SAMPLE_STEPS) + 1.0));


  // we don't want to sample to the perimeter of R since those samples would be
  // omitted by the distance attenuation (W(R) = 0 by definition)
  // Therefore we add a extra step and don't use the last sample.
  vec3 sampleNoise    = hash32(vUV * NOISE_SCALE);
  sampleNoise.xy      = sampleNoise.xy * 2.0 - vec2(1.0);
  mat2 rotationMatrix = mat2(sampleNoise.x, -sampleNoise.y,
                             sampleNoise.y,  sampleNoise.x);

  // apply a random rotation to the base step vector
  deltaUV = rotationMatrix * deltaUV;

  float jitter = sampleNoise.z;
  float occlusion = 0.0;

  for (int i = 0; i < NUM_SAMPLE_DIRECTIONS; ++i) {
    // incrementally rotate sample direction
    deltaUV = deltaRotationMatrix * deltaUV;

    vec2 sampleDirUV = deltaUV;
    float oldAngle   = SAMPLING_STEP;

    for (int j = 0; j < NUM_SAMPLE_STEPS; ++j) {
      vec2 sampleUV     = vUV + (jitter + float(j)) * sampleDirUV;
      vec3 sampleVS     = getPosition(sampleUV, Texture0, projInfo);
      vec3 sampleDirVS  = (sampleVS - originVS);

      // angle between fragment tangent and the sample
      float gamma = (PI / 2.0) - acos(dot(normalVS, normalize(sampleDirVS)));

      if (gamma > oldAngle)
      {
        float value = sin(gamma) - sin(oldAngle);
//#define APPLY_ATTENUATION 1
#ifdef APPLY_ATTENUATION
        // distance between original and sample points
        float attenuation = clamp(1.0 - pow(length(sampleDirVS) / radiusWS, 2.0), 0.0, 1.0);
        occlusion += attenuation * value;
#else
        occlusion += value;
#endif
        oldAngle = gamma;
      }
    }
  }

  occlusion = 1.0 - occlusion / float(NUM_SAMPLE_DIRECTIONS);
  occlusion = clamp(pow(occlusion, 1.0 + SCALE), 0.0, 1.0);
  gl_FragColor = vec4(occlusion, occlusion, occlusion, 1.0);
}
