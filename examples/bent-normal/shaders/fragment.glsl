varying vec3 osg_FragNormal;
varying vec2 osg_FragTexCoord0;

uniform sampler2D normalMap;

vec3 textureNormal(const in vec3 rgb) {
    vec3 n = normalize((rgb-vec3(0.5)));
    return n;
}

float linearrgb_to_srgb1(const in float c, const in float gamma)
{
    float v = 0.0;
    if(c < 0.0031308) {
        if ( c > 0.0)
            v = c * 12.92;
    } else {
        v = 1.055 * pow(c, 1.0/ gamma) - 0.055;
    }
    return v;
}

// coding style should be camel case except for acronyme like SRGB or HDR
vec4 linearTosRGB(const in vec4 col_from)
{
    float gamma = 2.4;
    vec4 col_to;
    col_to.r = linearrgb_to_srgb1(col_from.r, gamma);
    col_to.g = linearrgb_to_srgb1(col_from.g, gamma);
    col_to.b = linearrgb_to_srgb1(col_from.b, gamma);
    col_to.a = col_from.a;
    return col_to;
}

void main(void) {

    vec3 normal = normalize(osg_FragNormal);
    vec2 uv = osg_FragTexCoord0.xy;

    vec3 normalTexel = texture2D( normalMap, uv ).rgb;
//    vec3 realNormal = textureNormal( normalTexel );
    vec3 realNormal = normalTexel;
//    vec3 realNormal = normal;

    vec3 lightDirection = normalize( vec3( 0.5, 0.5, 1.0) );
    vec3 result = vec3(0.1) + dot(realNormal, lightDirection) * vec3( 0.8 );
//    vec3 result = vec3(0.1) + dot(normal, lightDirection) * vec3( 0.8 );


    gl_FragColor = linearTosRGB( vec4( result, 1.0 ) );
}
