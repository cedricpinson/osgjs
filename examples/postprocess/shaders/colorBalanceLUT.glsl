uniform vec2 uRedControl1;
uniform vec2 uRedControl2;
uniform vec2 uGreenControl1;
uniform vec2 uGreenControl2;
uniform vec2 uBlueControl1;
uniform vec2 uBlueControl2;

//https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline
float computeKnot(const vec2 p0, const vec2 p1, const float t) {
	const float alpha = 0.5;

	float a = pow(p1.x - p0.x, 2.0) + pow(p1.y - p0.y, 2.0);
	return pow(pow(a, 0.5), alpha) + t;
}

float catmullRomCentripetal(const vec2 p0, const vec2 p1, const vec2 p2, const vec2 p3, float d) {
	float t0 = 0.0;
	float t1 = computeKnot(p0, p1, t0);
	float t2 = computeKnot(p1, p2, t1);
	float t3 = computeKnot(p2, p3, t2);

	float t = mix(t1, t2, d);

	vec2 a1 = (t1 - t) / (t1 - t0) * p0 + (t - t0) / (t1 - t0) * p1;
	vec2 a2 = (t2 - t) / (t2 - t1) * p1 + (t - t1) / (t2 - t1) * p2;
	vec2 a3 = (t3 - t) / (t3 - t2) * p2 + (t - t2) / (t3 - t2) * p3;

	vec2 b1 = (t2 - t) / (t2 - t0) * a1 + (t - t0) / (t2 - t0) * a2;
	vec2 b2 = (t3 - t) / (t3 - t1) * a2 + (t - t1) / (t3 - t1) * a3;

	vec2 c0 = (t2 - t) / (t2 - t1) * b1 + (t - t1) / (t2 - t1) * b2;

	return c0.y;
}

// maybe users will prefer cubic splines in the end as it follows most tools curves
#define CURVE_FUNC catmullRomCentripetal
#define NUM_POINTS 6

float interpolateCurve(const float x, const in vec2 points[NUM_POINTS]) {
	float curve;

	for(int i = 1; i < NUM_POINTS - 2; i++) {
		if(x <= points[i + 1].x) {
			float factor = (x - points[i].x) / (points[i + 1].x - points[i].x);
			curve = CURVE_FUNC(points[i - 1], points[i], points[i + 1], points[i + 2], factor);
			break;
		}
	}

	return curve;
}

vec3 colorBalance(const in vec3 color) {
	vec2 redPoints[NUM_POINTS];
	redPoints[0] = vec2(-1.0, -1.0);
	redPoints[1] = vec2(0.0, 0.0);
	redPoints[2] = uRedControl1;
	redPoints[3] = uRedControl2;
	redPoints[4] = vec2(1.0, 1.0);
	redPoints[5] = vec2(2.0, 2.0);

	vec2 greenPoints[NUM_POINTS];
	greenPoints[0] = vec2(-1.0, -1.0);
	greenPoints[1] = vec2(0.0, 0.0);
	greenPoints[2] = uGreenControl1;
	greenPoints[3] = uGreenControl2;
	greenPoints[4] = vec2(1.0, 1.0);
	greenPoints[5] = vec2(2.0, 2.0);

	vec2 bluePoints[NUM_POINTS];
	bluePoints[0] = vec2(-1.0, -1.0);
	bluePoints[1] = vec2(0.0, 0.0);
	bluePoints[2] = uBlueControl1;
	bluePoints[3] = uBlueControl2;
	bluePoints[4] = vec2(1.0, 1.0);
	bluePoints[5] = vec2(2.0, 2.0);

	return vec3(interpolateCurve(color.x, redPoints), interpolateCurve(color.y, greenPoints), interpolateCurve(color.z, bluePoints));
}

#pragma include "sampleLUT.glsl"

vec4 colorBalanceLUT() {
	vec3 coords = getLUTCoords3d();
	return vec4(colorBalance(coords), 1.0);
}
