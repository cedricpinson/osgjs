#ifdef GL_ES
precision highp float;
#endif

#define MAX_MIP_LVL 4

uniform sampler2D uPreviousTexture;

uniform vec2 RenderSize;
uniform vec2 uPreviousViewport;

vec4 zValueFromScreenSpacePosition(vec2 ssPosition) {
    vec2 texCoord = (ssPosition + vec2(0.5)) / RenderSize;
    return texture2D(uPreviousTexture, texCoord);
}

void main() {

	ivec2 ssP = ivec2(gl_FragCoord.xy);

	vec2 tap = clamp(vec2(ssP) + vec2(mod(float(ssP.y), 2.0), mod(float(ssP.x), 2.0)), vec2(0.0), uPreviousViewport - vec2(1.0));
	vec4 encodedDepth = zValueFromScreenSpacePosition(tap);
	// vec4 encodedDepth = zValueFromScreenSpacePosition(vec2(ssP));
	gl_FragColor = encodedDepth;
}