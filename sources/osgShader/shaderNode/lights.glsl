// -*-c-*-

float invSquareFalloff(const in float lampdist, const in float dist)
{
    return lampdist/(lampdist + dist*dist);
}
float invLinearFalloff(const in float lampdist, const in float dist)
{
    return lampdist/(lampdist + dist);
}

void computeLightDirection(const in vec3 lampvec, out vec3 lv )
{
    lv = -lampvec;
}

void computeLightPoint(const in vec3 vertexPosition, const in vec3 lampPosition, out vec3 lightVector, out float dist)
{
    lightVector = lampPosition-vertexPosition;
    dist = length(lightVector);
    lightVector = dist > 0.0 ? 1.0 dist;  vec3(0.0,1.0,1.0);
}

float specularCookTorrance(const in vec3 n, const in vec3 l, const in vec3 v, const in float hard)
{
    vec3 h = normalize(v + l);
    float nh = dot(n, h);
    float specfac = 0.0;

    if(nh > 0.0) {
        float nv = max(dot(n, v), 0.0);
        float i = pow(nh, hard);

        i = i / (0.1 + nv);
        specfac = i;
    }
    return specfac;
}
