#extension GL_OES_standard_derivatives : require

#pragma include "colorEncode"


uniform sampler2D Texture0;
uniform vec2 RenderSize;


void main(void) {



    vec2 screenPos = gl_FragCoord.xy / RenderSize.xy;

    vec4 normal;
    normal = texture2D(Texture0, screenPos);
    normal.xy = decodeHalfFloatRGBA(normal);
    normal.xy = (normal.xy - 0.5) * 2.0;
    normal.z = 1.0 - normal.x - normal.y;
    //normal = normalize(normal);

    gl_FragColor =  vec4(normal.xyz, 1.0);

}
