#pragma include "sampleLUT.glsl"

uniform sampler2D TextureLUT;

vec4 colorBalance() {
	vec3 color = TEXTURE_2D_TextureInput(gTexCoord).rgb;

	if(gl_FragCoord.x < 256.0 && gl_FragCoord.y < 16.0) {
		return texture2D(TextureLUT, vec2(gl_FragCoord.x / 256.0, gl_FragCoord.y / 16.0));
	}

	return vec4(sampleLUT(color.rgb, TextureLUT), 1.0);
}
