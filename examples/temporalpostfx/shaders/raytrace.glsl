// -*- glsl -*-
// Copyright (c) 2014, Morgan McGuire and Michael Mara
// All rights reserved.
//
// From McGuire and Mara, Efficient GPU Screen-Space Ray Tracing,
// Journal of Computer Graphics Techniques, 2014
//
// This software is open source under the "BSD 2-clause license":
//
//    Redistribution and use in source and binary forms, with or
//    without modification, are permitted provided that the following
//    conditions are met:
//
//    1. Redistributions of source code must retain the above
//    copyright notice, this list of conditions and the following
//    disclaimer.
//
//    2. Redistributions in binary form must reproduce the above
//    copyright notice, this list of conditions and the following
//    disclaimer in the documentation and/or other materials provided
//    with the distribution.
//
//    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND
//    CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
//    INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
//    MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
//    DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
//    CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
//    SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//    LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF
//    USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
//    AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
//    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
//    IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
//    THE POSSIBILITY OF SUCH DAMAGE.

vec3 computeClipInfo(float zn, float zf) {
    // if (zf == -INF) {
    //     return vec3(zn, -1.0f, +1.0f);
    // } else {
    return vec3(zn  * zf, zn - zf, zf);
    // }
}

/** Given an OpenGL depth buffer value on [0, 1] and description of the projection
    matrix's clipping planes, computes the camera-space (negative) z value.
    See also computeClipInfo in the above*/
float reconstructCSZ(float depthBufferValue, vec3 clipInfo) {
    return clipInfo[0] / (depthBufferValue * clipInfo[1] + clipInfo[2]);
}


void swap(inout float a, inout float b) {
    float temp = a;
    a = b;
    b = temp;
}


float distanceSquared(vec2 a, vec2 b) {
    a -= b;
    return dot(a, a);
}

float getDepth(const in sampler2D tex, const in vec2 uv)
{
    // floor uv ?
    float depth = decodeFloatRGBA(texture2D(tex, uv));

    return depth;
}

/**
   \param csOrigin Camera-space ray origin, which must be
   within the view volume and must have z < -0.01 and project within the valid screen rectangle
   \param csDirection Unit length camera-space ray direction
   \param projectToPixelMatrix A projection matrix that maps to pixel coordinates (not [-1, +1] normalized device coordinates)
   \param csZBuffer The depth or camera-space Z buffer, depending on the value of \a csZBufferIsHyperbolic
   \param csZBufferSize Dimensions of csZBuffer
   \param csZThickness Camera space thickness to ascribe to each pixel in the depth buffer
   \param csZBufferIsHyperbolic True if csZBuffer is an OpenGL depth buffer, false (faster) if
   csZBuffer contains (negative) "linear" camera space z values. Const so that the compiler can evaluate the branch based on it at compile time
   \param clipInfo See G3D::Camera documentation
   \param nearPlaneZ Negative number
   \param stride Step in horizontal or vertical pixels between samples. This is a float
   because integer math is slow on GPUs, but should be set to an integer >= 1
   \param jitterFraction  Number between 0 and 1 for how far to bump the ray in stride units
   to conceal banding artifacts
   \param maxSteps Maximum number of iterations. Higher gives better images but may be slow
   \param maxRayTraceDistance Maximum camera-space distance to trace before returning a miss
   \param hitPixel Pixel coordinates of the first intersection with the scene
   \param csHitvec Camera space location of the ray hit
   Single-layer
*/
bool traceScreenSpaceRay1(vec3            csOrigin,
                          vec3            csDirection,
                          mat4            projectToPixelMatrix,
                          sampler2D       csZBuffer,
                          vec2          csZBufferSize,
                          float           csZThickness,
                          vec3          clipInfo,
                          float           nearPlaneZ,
                          float           stride,
                          float           jitterFraction,
                          float           maxSteps,
                          in float        maxRayTraceDistance,
                          out vec2        hitPixel,
                          out vec3        csHitvec) {

    // Clip ray to a near plane in 3D (doesn't have to be *the* near plane, although that would be a good idea)
    float rayLength = ((csOrigin.z + csDirection.z * maxRayTraceDistance) > nearPlaneZ) ?
        (nearPlaneZ - csOrigin.z) / csDirection.z :
        maxRayTraceDistance;
    vec3 csEndvec = csDirection * rayLength + csOrigin;

    // Project into screen space
    vec4 H0 = projectToPixelMatrix * vec4(csOrigin, 1.0);
    vec4 H1 = projectToPixelMatrix * vec4(csEndvec, 1.0);

    // There are a lot of divisions by w that can be turned into multiplications
    // at some minor precision loss...and we need to interpolate these 1/w values
    // anyway.
    //
    // Because the caller was required to clip to the near plane,
    // this homogeneous division (projecting from 4D to 2D) is guaranteed
    // to succeed.
    float k0 = 1.0 / H0.w;
    float k1 = 1.0 / H1.w;

    // Switch the original vecs to values that interpolate linearly in 2D
    vec3 Q0 = csOrigin * k0;
    vec3 Q1 = csEndvec * k1;

    // Screen-space endvecs
    vec2 P0 = H0.xy * k0;
    vec2 P1 = H1.xy * k1;

    // [Optional clipping to frustum sides here]

    // Initialize to off screen
    hitPixel = vec2(-1.0, -1.0);


    // If the line is degenerate, make it cover at least one pixel
    // to avoid handling zero-pixel extent as a special case later
    P1 += vec2((distanceSquared(P0, P1) < 0.0001) ? 0.01 : 0.0);

    vec2 delta = P1 - P0;

    // Permute so that the primary iteration is in x to reduce
    // large branches later
    bool permute = false;
    if (abs(delta.x) < abs(delta.y)) {
        // More-vertical line. Create a permutation that swaps x and y in the output
        permute = true;

        // Directly swizzle the inputs
        delta = delta.yx;
        P1 = P1.yx;
        P0 = P0.yx;
    }

    // From now on, "x" is the primary iteration direction and "y" is the secondary one

    float stepDirection = sign(delta.x);
    float invdx = stepDirection / delta.x;
    vec2 dP = vec2(stepDirection, invdx * delta.y);

    // Track the derivatives of Q and k
    vec3 dQ = (Q1 - Q0) * invdx;
    float   dk = (k1 - k0) * invdx;

    // Scale derivatives by the desired pixel stride
    dP *= stride; dQ *= stride; dk *= stride;

    // Offset the starting values by the jitter fraction
    P0 += dP * jitterFraction; Q0 += dQ * jitterFraction; k0 += dk * jitterFraction;

    // Slide P from P0 to P1, (now-homogeneous) Q from Q0 to Q1, and k from k0 to k1
    vec3 Q = Q0;
    float  k = k0;

    // We track the ray depth at +/- 1/2 pixel to treat pixels as clip-space solid
    // voxels. Because the depth at -1/2 for a given pixel will be the same as at
    // +1/2 for the previous iteration, we actually only have to compute one value
    // per iteration.
    float prevZMaxEstimate = csOrigin.z;
    float stepCount = 0.0;
    float rayZMax = prevZMaxEstimate, rayZMin = prevZMaxEstimate;
    float sceneZMax = rayZMax + 1e4;

    // P1.x is never modified after this vec, so pre-scale it by
    // the step direction for a signed comparison
    float end = P1.x * stepDirection;

    // We only advance the z field of Q in the inner loop, since
    // Q.xy is never used until after the loop terminates.

    vec2 P = P0;
    for (int kStep= 0; kStep < 1000; kStep++) {

        if (!(((P.x * stepDirection) <= end) &&
             (stepCount < maxSteps) &&
             ((rayZMax < sceneZMax - csZThickness) ||
              (rayZMin > sceneZMax)) &&
              (sceneZMax != 0.0)))
            return false;

        hitPixel = permute ? P.yx : P;

        // The depth range that the ray covers within this loop
        // iteration.  Assume that the ray is moving in increasing z
        // and swap if backwards.  Because one end of the interval is
        // shared between adjacent iterations, we track the previous
        // value and then swap as needed to ensure correct ordering
        rayZMin = prevZMaxEstimate;

        // Compute the value at 1/2 pixel into the future
        rayZMax = (dQ.z * 0.5 + Q.z) / (dk * 0.5 + k);
        prevZMaxEstimate = rayZMax;
        if (rayZMin > rayZMax) { swap(rayZMin, rayZMax); }

        // Camera-space z of the background
        //sceneZMax = texelFetch(csZBuffer, int2(hitPixel), 0).r;
        sceneZMax = getDepth(csZBuffer, hitPixel);

        // depth buffer basic 0.1 hyperbolic opengl itis.
        //sceneZMax = reconstructCSZ(sceneZMax, clipInfo);

        P += dP; Q.z += dQ.z; k += dk; stepCount += 1.0;

    } // pixel on ray

    Q.xy += dQ.xy * stepCount;
    csHitvec = Q * (1.0 / k);

    // Matches the new loop condition:
    return (rayZMax >= sceneZMax - csZThickness) && (rayZMin <= sceneZMax);
}
