#pragma DECLARE_FUNCTION
vec3 morphing(
        const in vec4 weights,
        const in vec3 vertex,
        const in vec3 target0) {

    return mix(vertex, target0, weights[0]);
}

#pragma DECLARE_FUNCTION
vec3 morphing(
        const in vec4 weights,
        const in vec3 vertex,
        const in vec3 target0,
        const in vec3 target1) {

    vec3 vecOut = vertex * (1.0 - ( weights[0] + weights[1]));
    vecOut += target0 * weights[0];
    vecOut += target1 * weights[1];
    return vecOut;
}

#pragma DECLARE_FUNCTION
vec3 morphing(
        const in vec4 weights,
        const in vec3 vertex,
        const in vec3 target0,
        const in vec3 target1,
        const in vec3 target2) {
  
    vec3 vecOut = vertex * (1.0 - ( weights[0] + weights[1] + weights[2]));
    vecOut += target0 * weights[0];
    vecOut += target1 * weights[1];
    vecOut += target2 * weights[2];
    return vecOut;
}

#pragma DECLARE_FUNCTION
vec3 morphing(
        const in vec4 weights,
        const in vec3 vertex,
        const in vec3 target0,
        const in vec3 target1,
        const in vec3 target2,
        const in vec3 target3) {

    vec3 vecOut = vertex * (1.0 - ( weights[0] + weights[1] + weights[2] + weights[3]));
    vecOut += target0 * weights[0];
    vecOut += target1 * weights[1];
    vecOut += target2 * weights[2];
    vecOut += target3 * weights[3];
    return vecOut;
}
