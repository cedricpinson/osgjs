



//#if defined(__PREPROCESSOR_) && SHADER_NAME == //CompilerOSGJS_MaterialShadowReceive0_PCF_1Tap4texFetch_false_falseShadowReceive1_PCF_1Tap4texFetch_false_falseShadowReceive2_PCF_1Tap4texFetch_false_falseLight0SPOTtrueLight1SPOTtrueLight2SPOTtrueTextureTexture_0_5121Texture_1_5121Texture_2_5121
//#define _TEXTURELESS
//#endif

#ifndef _TEXTURELESS 

#define textureRGB( tex, uv) texture2D(tex, uv.xy ).rgb
#define textureRGBA( tex,  uv) texture2D(tex, uv.xy ).rgba
#define textureIntensity(tex, uv) texture2D(tex, uv).r
#define textureAlpha( tex, uv) texture2D(tex, uv.xy ).a

#else

#define textureRGB( tex, uv) vec3(1.0*gl_FragCoord.x, 0.5, 1.0*gl_FragCoord.y)
#define textureRGBA( tex,  uv) vec4(1.0*gl_FragCoord.y, 0.5, 1.0*gl_FragCoord.x, 1.0)
#define textureIntensity(tex, uv) .5 + 0.1 * gl_FragCoord.x
#define textureAlpha( tex, uv) 1.0 - 0.1 * gl_FragCoord.y

#endif
