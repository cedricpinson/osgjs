// http://www.paulinternet.nl/?page=bicubic
float cubicInterpolation(in float t, float v0, float v1, float v2, float v3) {
	// Cubic Hermite spline
	// http://en.wikipedia.org/wiki/Bicubic_interpolation
/*	mat4 M = {
		 0.0,  2.0,  0.0,  0.0,
		-1.0,  0.0,  1.0,  0.0,
		 2.0, -5.0,  4.0, -1.0,
		-1.0,  3.0, -3.0,  1.0
	};
	return 0.5 * dot(vec4(1, t, t*t, t*t*t), mul(M, vec4(v0, v1, v2, v3)));*/

	// Uniform cubic B-splines
	// http://en.wikipedia.org/wiki/B-spline#Cubic_B-Spline
	mat4 M =  mat4(
		-1.0,  3.0, -3.0,  1.0,
		 3.0, -6.0,  3,  0.0,
		-3.0,  0.0,  3,  0.0,
		 1.0,  4.0,  1.0,  0.0
	);
	return (1.0/6.0) * dot(vec4(t*t*t, t*t, t, 1), mul(M, vec4(v0, v1, v2, v3)));
}

// The straight forward implementation of bi-cubic interpolation
float bicubicInterpolation(in vec2 uv, in sampler2D tex, in vec2 texSize) {
	vec2 w = 1.0 / texSize;
	vec2 f = frac(uv * texSize);

	float v1 = cubicInterpolation(f.x,
		tex2D(tex, vec2(uv.x - w.x,   uv.y - w.y)).x,
		tex2D(tex, vec2(uv.x,         uv.y - w.y)).x,
		tex2D(tex, vec2(uv.x + w.x,   uv.y - w.y)).x,
		tex2D(tex, vec2(uv.x + 2*w.x, uv.y - w.y)).x);

	float v2 = cubicInterpolation(f.x,
		tex2D(tex, vec2(uv.x - w.x,   uv.y)).x,
		tex2D(tex, vec2(uv.x,         uv.y)).x,
		tex2D(tex, vec2(uv.x + w.x,   uv.y)).x,
		tex2D(tex, vec2(uv.x + 2*w.x, uv.y)).x);

	float v3 = cubicInterpolation(f.x,
		tex2D(tex, vec2(uv.x - w.x,   uv.y + w.y)).x,
		tex2D(tex, vec2(uv.x,         uv.y + w.y)).x,
		tex2D(tex, vec2(uv.x + w.x,   uv.y + w.y)).x,
		tex2D(tex, vec2(uv.x + 2*w.x, uv.y + w.y)).x);

	float v4 = cubicInterpolation(f.x,
		tex2D(tex, vec2(uv.x - w.x,   uv.y + 2*w.y)).x,
		tex2D(tex, vec2(uv.x,         uv.y + 2*w.y)).x,
		tex2D(tex, vec2(uv.x + w.x,   uv.y + 2*w.y)).x,
		tex2D(tex, vec2(uv.x + 2*w.x, uv.y + 2*w.y)).x);

	return cubicInterpolation(f.y, v1, v2, v3, v4);
}

// Improved bi-cubic interpolation that only need 4 texture fetch instead of 16
// From the paper: Accuracy of GPU-based B-Spline evaluation
// http://www.dannyruijters.nl/cubicinterpolation/
// http://http.developer.nvidia.com/GPUGems2/gpugems2_chapter20.html
float bicubicInterpolationFast(in vec2 uv, in sampler2D tex, in vec2 texSize) {
	vec2 rec_nrCP = 1.0/texSize;
	vec2 coord_hg = uv * texSize-0.5;
	vec2 index = floor(coord_hg);

	vec2 f = coord_hg - index;
	mat4 M =  mat4(
		-1.0,  3.0, -3.0,  1.0,
		 3.0, -6.0,  3,  0.0,
		-3.0,  0.0,  3,  0.0,
		 1.0,  4.0,  1,  0.0
	);
	M /= 6.0;

	vec4 wx = mul(vec4(f.x*f.x*f.x, f.x*f.x, f.x, 1), M);
	vec4 wy = mul(vec4(f.y*f.y*f.y, f.y*f.y, f.y, 1), M);
	vec2 w0 = vec2(wx.x, wy.x);
	vec2 w1 = vec2(wx.y, wy.y);
	vec2 w2 = vec2(wx.z, wy.z);
	vec2 w3 = vec2(wx.w, wy.w);

	vec2 g0 = w0 + w1;
	vec2 g1 = w2 + w3;
	vec2 h0 = w1 / g0 - 1;
	vec2 h1 = w3 / g1 + 1;

	vec2 coord00 = index + h0;
	vec2 coord10 = index + vec2(h1.x,h0.y);
	vec2 coord01 = index + vec2(h0.x,h1.y);
	vec2 coord11 = index + h1;

	coord00 = (coord00 + 0.5) * rec_nrCP;
	coord10 = (coord10 + 0.5) * rec_nrCP;
	coord01 = (coord01 + 0.5) * rec_nrCP;
	coord11 = (coord11 + 0.5) * rec_nrCP;

	float tex00 = tex2D(tex, coord00).x;
	float tex10 = tex2D(tex, coord10).x;
	float tex01 = tex2D(tex, coord01).x;
	float tex11 = tex2D(tex, coord11).x;

	tex00 = lerp(tex01, tex00, g0.y);
	tex10 = lerp(tex11, tex10, g0.y);
	return lerp(tex10, tex00, g0.x);
}

// http://freespace.virgin.net/hugo.elias/models/m_perlin.htm
float cosInterpolate(in vec2 uv, in sampler2D tex, in vec2 texSize) {
	vec2 pixelSize = 1.0 / texSize;
	vec2 pixelCenterOffset = fmod(uv, pixelSize);
	pixelCenterOffset /= pixelSize;
	vec2 uvtl = uv;
	vec2 uvtr = vec2(uv + vec2(pixelSize.x, 0));
	vec2 uvbl = vec2(uv + vec2(0, pixelSize.y));
	vec2 uvbr = vec2(uv + pixelSize);

	float vtl = tex2D(tex, uvtl).x;
	float vtr = tex2D(tex, uvtr).x;
	float vbl = tex2D(tex, uvbl).x;
	float vbr = tex2D(tex, uvbr).x;

	vec2 f = frac(uv * texSize);
	f = f * 3.1415926536;
	f = (1.0 - cos(f)) * 0.5;

	float vx = lerp(vtl, vtr, f.x);
	float vy = lerp(vbl, vbr, f.x);
	return lerp(vx, vy, f.y);
}