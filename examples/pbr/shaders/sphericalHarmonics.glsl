#ifdef DEBUG
#define PI 3.1415926535897932384626433832795

vec3 shCoefs[9];

void createCoef() {

    // vec3(  1.0/(2.0*sqrt(PI) ) ),

    // vec3( -( sqrt(3.0/PI)*0.5 * y ) ),
    // vec3( ( sqrt(3.0/PI)*0.5 * z ) ),
    // vec3( -( sqrt(3.0/PI)*0.5 * x ) ),

    // vec3( ( sqrt(15.0/PI)*0.5 * x * y ) ),
    // vec3( -( sqrt(15.0/PI)*0.5 * y * z ) ),
    // vec3( ( sqrt(5.0/PI)* 0.25 * ( 3.0*z*z - 1.0) ) ),
    // vec3( -( sqrt(15.0/PI)* 0.5 * x *z ) ),
    // vec3( ( sqrt(15.0/PI) * 0.25 * (x*x - y*y )) ),

    shCoefs[0] = vec3(  1.0/(2.0*sqrt(PI) ) );

    shCoefs[1] = vec3( -( sqrt(3.0/PI)*0.5 ) );
    shCoefs[2] = -shCoefs[1];
    shCoefs[3] = shCoefs[1];

    shCoefs[4] = vec3( sqrt(15.0/PI)*0.5 );
    shCoefs[5] = -shCoefs[4];
    shCoefs[6] = vec3( sqrt(5.0/PI)* 0.25 );
    shCoefs[7] = shCoefs[5];
    shCoefs[8] = vec3( sqrt(15.0/PI) * 0.25 );

}

vec3 sphericalHarmonics( const in vec3 normal )
{
    float x = normal.x;
    float y = normal.y;
    float z = normal.z;

    createCoef();
    vec3 result = (
        shCoefs[0] * uSph[0] +

        shCoefs[1] * uSph[1] * y +
        shCoefs[2] * uSph[2] * z +
        shCoefs[3] * uSph[3] * x +

        shCoefs[4] * uSph[4] * y * x +
        shCoefs[5] * uSph[5] * y * z +
        shCoefs[6] * uSph[6] * (3.0 * z * z - 1.0) +
        shCoefs[7] * uSph[7] * (z * x) +
        shCoefs[8] * uSph[8] * (x*x - y*y)
    );
}

#else
// expect shCoefs uniform
// https://github.com/cedricpinson/envtools/blob/master/Cubemap.cpp#L523
vec3 sphericalHarmonics( const vec3 sph[9], const in vec3 normal )
{
    float x = normal.x;
    float y = normal.y;
    float z = normal.z;

    vec3 result = (
        sph[0] +

        sph[1] * y +
        sph[2] * z +
        sph[3] * x +

        sph[4] * y * x +
        sph[5] * y * z +
        sph[6] * (3.0 * z * z - 1.0) +
        sph[7] * (z * x) +
        sph[8] * (x*x - y*y)
    );

    return max(result, vec3(0.0));
}

#endif
