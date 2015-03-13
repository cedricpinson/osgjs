#extension GL_OES_standard_derivatives : require

#pragma include "colorEncode"

varying vec4 FragNormal;
varying vec4 FragPosition;
varying vec4 WorldPosition;


void main(void) {

#ifdef _WorldDerivative
    // http://www.enkisoftware.com/devlogpost-20150131-1-Normal_generation_in_the_pixel_shader.html
    vec3 CameraPosition = vec3(0.0,0.0,0.0); // but sample here doesn't have a camera pos...
    vec3 worldPrecise = WorldPosition.xyz - CameraPosition.xyz;

   vec3 ScreenNormalWorld = normalize(cross(dFdx(worldPrecise.xyz), dFdy(worldPrecise.xyz)));
   gl_FragColor = encodeHalfFloatRGBA(vec2(ScreenNormalWorld.xy * 0.5 + 0.5));
#endif

#ifdef _ViewDerivative
   vec3 ScreenNormalView = normalize(cross(dFdx(FragPosition.xyz), dFdy(FragPosition.xyz)));
   gl_FragColor = encodeHalfFloatRGBA(vec2(ScreenNormalView.xy * 0.5 + 0.5));
#endif


#ifdef _MeshNormalView
   vec3 NormalView = normalize(FragNormal.xyz);
   gl_FragColor = encodeHalfFloatRGBA(vec2(NormalView.xy * 0.5 + 0.5));
#endif
}
