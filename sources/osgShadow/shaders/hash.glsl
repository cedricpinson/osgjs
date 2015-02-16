//// hash glsl

//note: value noise
float hashNormalized11( const in float n )
{
    return fract(sin(n)*43758.5453);
}

//note: normalized uniform random, [0;1[
float hashNormalized21( const in vec2 n ) {
  return fract(sin(dot(n.xy, vec2(12.9898, 78.233)))* 43758.5453);
}

vec2 hashNormalized22( const in vec2 n )
{
  return fract(sin(dot(n.xy, vec2(12.9898, 78.233)))* vec2(43758.5453,35458.5734));
}

//note: [-1;1]
//note: honestly stolen from iq: https://www.shadertoy.com/view/Xsl3Dl
vec3 hashNormalized33( in vec3 p )
{
  p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
        dot(p,vec3(269.5,183.3,246.1)),
        dot(p,vec3(113.5,271.9,124.6)));
  return fract(sin(p)*43758.5453123);
}

// Returns a random number based on a vec3 and an int.
float hashNormalized41(const in vec4 seed){
    return fract(sin(dot(seed, vec4(12.9898,78.233,45.164,94.673)) * 43758.5453));
}

/////// end hash
