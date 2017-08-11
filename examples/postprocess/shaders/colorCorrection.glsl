#pragma include "sampleLUT.glsl"

uniform sampler2D TextureLut;

vec4 colorCorrection(const in vec4 color) {
	return vec4(sampleLUT(color.rgb, TextureLut), 1.0);
}
