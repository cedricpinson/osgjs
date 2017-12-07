#pragma include "shadowLinearSoft.glsl"

float getShadowPCF(
    const in sampler2D depths,
    const in vec2 size,
    const in vec2 uv,
    const in float compare,
    const in vec2 biasPCF,
    const in vec4 clampDimension
    OPT_ARG_outDistance
    OPT_ARG_jitter) {

     float res = 0.0;

     res += texture2DShadowLerp(depths, size, uv + biasPCF, compare, clampDimension OPT_INSTANCE_ARG_outDistance OPT_INSTANCE_ARG_jitter);


#if defined(_PCFx1)

#else

    float dx0 = -size.x;
    float dy0 = -size.y;
    float dx1 = size.x;
    float dy1 = size.y;

#define TSF(o1,o2) texture2DShadowLerp(depths, size, uv + vec2(o1, o2) + biasPCF, compare, clampDimension OPT_INSTANCE_ARG_outDistance OPT_INSTANCE_ARG_jitter)

    res += TSF(dx0, dx0);
    res += TSF(dx0, .0);
    res += TSF(dx0, dx1);

#if defined(_PCFx4)

    res /=4.0;

#elif defined(_PCFx9)
    res += TSF(.0, dx0);
    res += TSF(.0, dx1);

    res += TSF(dx1, dx0);
    res += TSF(dx1, .0);
    res += TSF(dx1, dx1);


    res /=9.0;

#elif defined(_PCFx25)

    float dx02 = 2.0*dx0;
    float dy02 = 2.0*dy0;
    float dx2 = 2.0*dx1;
    float dy2 = 2.0*dy1;

    // complete row above
    res += TSF(dx0, dx02);
    res += TSF(dx0, dx2);

    res += TSF(.0, dx02);
    res += TSF(.0, dx2);

    res += TSF(dx1, dx02);
    res += TSF(dx1, dx2);

    // two new col
    res += TSF(dx02, dx02);
    res += TSF(dx02, dx0);
    res += TSF(dx02, .0);
    res += TSF(dx02, dx1);
    res += TSF(dx02, dx2);

    res += TSF(dx2, dx02);
    res += TSF(dx2, dx0);
    res += TSF(dx2, .0);
    res += TSF(dx2, dx1);
    res += TSF(dx2, dx2);


    res/=25.0;

#endif

#undef TSF

#endif
    return res;
}
/////// end Tap
