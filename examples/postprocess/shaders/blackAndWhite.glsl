float luminance(const in vec3 color) {
	return dot(color, vec3(0.299, 0.587, 0.114));
}

vec4 blackAndWhite(const in vec4 color) {
	return vec4(vec3(luminance(color.rgb)), color.a);
}
