

#pragma include "shadowLinearSoft.glsl"

float getShadowPCF(sampler2D depths, vec4 size, vec2 uv, float compare, float gbias){

    float result = 0.0;

#if defined(_PCFx4)
    result += texture2DShadowLerp(depths, size, uv, compare, gbias);

#elif defined(_PCFx9)

    for(int x=-1; x<=1; x++){
        for(int y=-1; y<=1; y++){
            vec2 off = vec2(x,y)*size.zw;
            result += texture2DShadowLerp(depths, size, uv+off, compare, gbias);
        }
    }
    result /=9.0;

#elif defined(_PCFx25)

    for(int x=-2; x<=2; x++){
        for(int y=-2; y<=2; y++){
            vec2 off = vec2(x,y)*size.zw;
            result += texture2DShadowLerp(depths, size, uv+off, compare, gbias);
        }
    }
    result/=25.0;

    result += texture2DShadowLerp(depths, size, uv, compare, gbias);

#endif
    return result;
}
/////// end Tap
