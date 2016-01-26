varying vec3 osg_FragNormal;
varying vec2 osg_FragTexCoord0;

uniform sampler2D normalMap;

vec3 textureNormal(const in vec3 rgb) {
    vec3 n = normalize((rgb-vec3(0.5)));
    n[1] = (uFlipNormalY == 1) ? -n[1] : n[1];
    return n;
}

void main(void) {

    vec3 normal = normalize(osg_FragNormal);
    vec2 uv = osg_FragTexCoord0.xy;

    vec3 normalTexel = texture2D( normalMap, uv ).rgb;
    if ( length(normalTexel) > 0.0001 ) {
        vec3 realNormal = textureNormal( normalTexel );
        normal = computeNormalFromTangentSpaceNormalMap( tangent, normal, realNormal );
    }

    gl_FragColor = result;
}
