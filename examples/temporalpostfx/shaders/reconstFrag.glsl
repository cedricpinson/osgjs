
#pragma include "colorEncode.glsl"


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


float getDepth(const in float depth, const in vec2 nearFar)
{
    return depth;

     float zf = nearFar[0];
     float zn = nearFar[1];
     return   zn  * zf / (depth * zn - zf + zf);

    float zNear = nearFar.x;
    float zFar = nearFar.y;
    return (2.0 * zNear) / (zFar + zNear - depth * (zFar - zNear));

}

uniform mat4 ProjectionMatrix;

uniform sampler2D Texture0;
uniform vec2 RenderSize;
uniform vec4 renderSize;
uniform vec2 NearFar;

void main(void) {

    vec2 screenPos = gl_FragCoord.xy / RenderSize.xy;

   vec4 projInfo = vec4(-2.0 / (RenderSize.x*ProjectionMatrix[0][0]),
           -2.0 / (RenderSize.y*ProjectionMatrix[1][1]),
          ( 1.0 - ProjectionMatrix[0][2]) / ProjectionMatrix[0][0],
          ( 1.0 + ProjectionMatrix[1][2]) / ProjectionMatrix[1][1]);


   vec3 Position = getPosition(screenPos, Texture0, projInfo);

//   gl_FragColor = vec4( Position.xyz, 1.0);

   gl_FragColor = vec4( vec3(getDepth(Position.z, NearFar)), 1.0);
   //gl_FragColor = vec4( vec3(Position.z), 1.0);

}
