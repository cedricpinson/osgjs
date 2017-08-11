vec3 getLUTCoords3d() {
	vec2 texCoords = floor(gl_FragCoord.xy);

	vec3 coords3d;
	coords3d.x = mod(texCoords.x, 16.0);
	coords3d.y = texCoords.y;
	coords3d.z = floor(texCoords.x / 16.0);

	coords3d /= 15.0;
	coords3d.y = 1.0 - coords3d.y;
	return coords3d;
}

//https://github.com/EpicGames/UnrealEngine/blob/release/Engine/Shaders/Private/PostProcessCommon.ush#L187
vec3 sampleLUT(const in vec3 color, const in sampler2D lut) {
	vec3 coords = vec3(color.r, 1.0 - color.g, color.b) * 15.0 / 16.0 + 0.5 / 16.0;

	float nearestZ = floor(coords.z * 16.0 - 0.5);

	float u = (coords.x + nearestZ) / 16.0;
	float v = coords.y;

	vec3 sample0 = texture2D(lut, vec2(u, v)).rgb;
	vec3 sample1 = texture2D(lut, vec2(u + 1.0 / 16.0, v)).rgb;

	float mixFactor = coords.z * 16.0 - 0.5 - nearestZ;
	return mix(sample0, sample1, mixFactor);
}