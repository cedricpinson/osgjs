// -*-c-*-

vec4 TextureSpheremap(const in sampler2D texture, const in vec3 uv) {
  float PI = 3.14159265358979323846264;
  // float yaw = acos(uv.y) / PI;
  float yaw = acos(min(1.0,abs(uv.y))) / PI;
  float pitch = (atan(uv.x, uv.z) + PI) / (2.0 * PI);
  return texture2D(texture, vec2(pitch, yaw));
}

vec4 rgbaToHDR(const in vec4 rgbe) {
  float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));
  return vec4(rgbe.rgb * 255.0 * f, 1.0);
}

vec4 texture2DHdrLinear(const in sampler2D texture, const in vec2 size, const in vec2 texUV) {
  vec2 t = 1.0 / size;
  vec2 uv = texUV - vec2(0.5*t);

  vec4 a,b,c,d;
  a = rgbaToHDR( texture2D(texture, uv ) );
  b = rgbaToHDR( texture2D(texture, uv + vec2(t.x, 0.0) ) );
  c = rgbaToHDR( texture2D(texture, uv + vec2(0.0, t.y) ) );
  d = rgbaToHDR( texture2D(texture, uv + vec2(t.x, t.y) ) );

  vec2 f = fract(uv * size);
  vec4 A = mix(a, b, f.x),
       B = mix(c, d, f.x);
  return mix(A, B, f.y);
}

vec3 TextureSpheremapHdr(const in sampler2D texture, const in vec2 size, const in vec3 uv) {
  float PI = 3.14159265358979323846264;
  float EPS = 0.0001;
  vec3 n = normalize(uv);
  float yaw = acos(n.y) / PI;
  float pitch = (abs(n.x) < EPS && abs(n.z) < EPS) ? 0.0 : ((atan(n.x, n.z) + PI) / (2.0 * PI));
  return texture2DHdrLinear(texture, size, vec2(pitch, yaw)).rgb;
}
