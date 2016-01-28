varying vec3 osg_FragNormal;
varying vec2 osg_FragTexCoord0;

uniform sampler2D normalMap;

vec3 textureNormal(const in vec3 rgb) {
    vec3 n = normalize((rgb-vec3(0.5)));
    return n;
}

void main(void) {

    vec3 normal = normalize(osg_FragNormal);
    vec2 uv = osg_FragTexCoord0.xy;

    vec3 normalTexel = texture2D( normalMap, uv ).rgb;
//    vec3 realNormal = textureNormal( normalTexel );
    vec3 realNormal = normalTexel;

    vec3 lightDirection = normalize( vec3( 0.5, 0.5, 1.0) );
    vec3 result = vec3(0.1) + dot(realNormal, lightDirection) * vec3( 0.8 );
//    vec3 result = vec3(0.1) + dot(normal, lightDirection) * vec3( 0.8 );

    gl_FragColor = vec4( result, 1.0 );
}
