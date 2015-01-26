// EVSM

#pragma include "vsm.glsl"

// Convert depth to EVSM coefficients
// Input depth should be in [0, 1]
vec2 warpDepth(float depth, vec2 exponents)
{
    float pos =  exp( exponents.x * depth);
    float neg = -exp(-exponents.y * depth);
    return vec2(pos, neg);
}

// _EVSM
