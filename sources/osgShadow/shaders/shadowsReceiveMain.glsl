
// 0 for early out
bool earlyOut = false;

// Calculate shadow amount
float shadow = 1.0;

if(!lighted) {
    shadow = 0.0;
    earlyOut = true;
}

if (depthRange.x == depthRange.y) {
    earlyOut = true;
}

vec4 shadowVertexEye;
vec4 shadowNormalEye;
float shadowReceiverZ = 0.0;
vec4 shadowVertexProjected;
vec2 shadowUV;
float N_Dot_L;

if(!earlyOut) {
    
    shadowVertexEye =  shadowViewMatrix *  vec4(vertexWorld, 1.0);

    vec3 shadowLightDir = vec3(0.0, 0.0, 1.0); // in shadow view light is camera
    vec4 normalFront = vec4( (gl_FrontFacing ? normalWorld : -normalWorld), 0.0);
    shadowNormalEye =  shadowViewMatrix * normalFront;
    N_Dot_L = dot(shadowNormalEye.xyz, shadowLightDir); 

    if (N_Dot_L <= 0.0) {
      shadow = 1.0;
      earlyOut = true;
    }
    
    if(!earlyOut) {
        
#ifdef _NORMAL_OFFSET
        
        // http://www.dissidentlogic.com/old/images/NormalOffsetShadows/GDC_Poster_NormalOffset.png
        float normalOffsetScale = clamp(1.0  - N_Dot_L, 0.0 , 1.0);

        normalOffsetScale *= abs((shadowVertexEye.z - depthRange.x) * depthRange.w) * max(shadowProjectionMatrix[0][0], shadowProjectionMatrix[1][1]);

        normalOffsetScale *= normalBias*depthRange.w;

        shadowNormalEye =  shadowViewMatrix *  (normalFront * normalOffsetScale);
    
        shadowVertexProjected = shadowProjectionMatrix * (shadowVertexEye + shadowNormalEye);
            
#else
    
        shadowVertexProjected = shadowProjectionMatrix * shadowVertexEye;
    
#endif

        if (shadowVertexProjected.w < 0.0) {
            earlyOut = true; // notably behind camera
        }
    
    }
    
    
    
    if(!earlyOut) {
       
        shadowUV.xy = shadowVertexProjected.xy / shadowVertexProjected.w;
        shadowUV.xy = shadowUV.xy * 0.5 + 0.5;// mad like

        if(any(bvec4 ( shadowUV.x > 1., shadowUV.x < 0., shadowUV.y > 1., shadowUV.y < 0.))) {
            earlyOut = true;// limits of light frustum
        }
                         
        // most precision near 0, make sure we are near 0 and in [0,1]
        shadowReceiverZ = - shadowVertexEye.z;        
        shadowReceiverZ =  (shadowReceiverZ - depthRange.x)* depthRange.w;
                
        if(shadowReceiverZ < 0.0) {
            earlyOut = true; // notably behind camera
        }
        
    }
     
}
    



// pcf pbias to add on offset
vec2 shadowBiasPCF = vec2(0.);

#ifdef GL_OES_standard_derivatives


//#define _RECEIVERPLANEDEPTHBIAS
#ifdef _RECEIVERPLANEDEPTHBIAS
vec2 biasUV;

vec3 texCoordDY = dFdx(shadowVertexEye.xyz);
vec3 texCoordDX = dFdy(shadowVertexEye.xyz);

biasUV.x = texCoordDY.y * texCoordDX.z - texCoordDX.y * texCoordDY.z;
biasUV.y = texCoordDX.x * texCoordDY.z - texCoordDY.x * texCoordDX.z;
biasUV *= 1.0 / ((texCoordDX.x * texCoordDY.y) - (texCoordDX.y * texCoordDY.x));

// Static depth biasing to make up for incorrect fractional sampling on the shadow map grid
float fractionalSamplingError = dot(vec2(1.0, 1.0) * shadowTextureSize.zw, abs(biasUV));
float receiverDepthBias = min(fractionalSamplingError, 0.01);

shadowBiasPCF.x = biasUV.x;
shadowBiasPCF.y = biasUV.y;


shadowReceiverZ += receiverDepthBias;

#else

shadowBiasPCF.x = clamp(dFdx(shadowReceiverZ)* shadowTextureSize.z, -1.0, 1.0 );
shadowBiasPCF.y = clamp(dFdy(shadowReceiverZ)* shadowTextureSize.w, -1.0, 1.0 );

#endif
#endif


vec4 clampDimension;

#ifdef _ATLAS_SHADOW
 
shadowUV.xy  = ((shadowUV.xy * shadowMapSize.zw ) + shadowMapSize.xy) / shadowTextureSize.xy;

// clamp uv bias/filters by half pixel to avoid point filter on border
clampDimension.xy = shadowMapSize.xy + vec2(0.5);
clampDimension.zw = (shadowMapSize.xy + shadowMapSize.zw) - vec2(0.5);

clampDimension = clampDimension / (shadowTextureSize.xyxy);


#else

clampDimension = vec4(0.0, 0.0, 1.0, 1.0);

#endif


// now that derivatives is done
// and we don't access any mipmapped/texgrad texture
// we can early out
// see http://teknicool.tumblr.com/post/77263472964/glsl-dynamic-branching-and-texture-samplers
if (earlyOut) return shadow;

// depth bias: fighting shadow acne (depth imprecsion z-fighting)
float shadowBias = 0.0;




// cosTheta is dot( n, l ), clamped between 0 and 1
//float shadowBias = 0.005*tan(acos(N_Dot_L));
// same but 4 cycles instead of 15
shadowBias += 0.05 *  sqrt( 1. -  N_Dot_L*N_Dot_L) / clamp(N_Dot_L, 0.0005,  1.0);

//That makes sure that plane perpendicular to light doesn't flicker due to
//selfshadowing and 1 = dot(Normal, Light) using a min bias
shadowBias = clamp(shadowBias, 0.00005,  2.0*bias);

// shadowZ must be clamped to [0,1]
// otherwise it's not comparable to
// shadow caster depth map
// which is clamped to [0,1]
// Not doing that makes ALL shadowReceiver > 1.0 black
// because they ALL becomes behind any point in Caster depth map
shadowReceiverZ = clamp(shadowReceiverZ, 0., 1. - shadowBias);

shadowReceiverZ -= shadowBias;

// Now computes Shadow

shadow = getShadowPCF(tex, shadowTextureSize, shadowUV, shadowReceiverZ, shadowBiasPCF, clampDimension);



return shadow;

