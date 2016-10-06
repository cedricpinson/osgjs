varying vec3 vViewVertex;
varying vec3 vViewNormal;
varying vec4 vViewTangent;
varying vec2 vTexCoord0;
varying vec3 vLocalVertex;


void computeTangentFrame( const in vec4 tangent, const in vec3 normal,
                          out vec3 tangentx,
                          out vec3 tangenty
    ) {

    // Build local referential
#ifdef NO_TANGENT
    vec3 upVector = abs(normal.z) < 0.999 ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0);
    tangentX = normalize( cross( upVector, normal ) );
    tangentY = cross( normal, tangentX );

#else

    vec3 tang = normalize(tangent.xyz);
    vec3 binormal = tangent.w * cross(normal, tang);
    tangentx = normalize(tang - normal*dot(tang, normal)); // local tangent
    tangenty = normalize(binormal  - normal*dot(binormal, normal)  - tang*dot(binormal, tangentx)); // local bitange
#endif

}

void main() {

    //vectors used for importance sampling
    vec3 tangentX, tangentY;

    vec3 N = normalize(vViewNormal);
    vec3 E = normalize(vViewVertex);

    computeTangentFrame(vViewTangent, N, tangentX, tangentY );
    // vec3 N = normalize(vViewNormal);
    // mat3 environmentTransform = getEnvironmentTransfrom ( uEnvironmentTransform );

    // vec3 E = normalize(vViewVertex);
    // vec3 V = -E;
    // vec3 H = N;
    // vec3 L = normalize(2.0 * dot(V, H) * H - V);

    // vec3 direction = environmentTransform * L;


    gl_FragColor = vec4( vViewTangent.xyz, 1.0);
}
