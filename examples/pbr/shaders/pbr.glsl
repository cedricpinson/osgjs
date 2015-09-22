// needs #pragma include "sphericalHarmonics.glsl"


// expect to have a function to fetch texel in it
// getReferenceTexelEnvironment( Direction, Lod )


float invG1( const in float ndw, const in float k )
{
    // return ndw*(1.0-k) + k ;
    return mix( ndw, 1.0, k);
}

// w is either Ln or Vn
float G1( const in float ndw, const in float k )
{
    // One generic factor of the geometry function divided by ndw
    // NB : We should have k > 0
    // return 1.0 / ( ndw*(1.0-k) + k );
    return 1.0 / invG1( ndw, k );
}



vec3 F_Schlick( const in vec3 f0, const in float vdh )
{
    // Schlick with Spherical Gaussian approximation
    // cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3
    float Fc = pow( 1.0 - vdh, 5.0 );
    vec3 F = (1.0 - Fc) * f0 + Fc;
    return F;
    float sphg = pow(2.0, (-5.55473*vdh - 6.98316) * vdh);
    // return f0 + (vec3(1.0 ) - f0) * sphg;
    return mix( vec3(sphg), vec3(1.0), f0);
}

float G_SmithGGX(const in float NdotL, const in float NdotV, const in float k)
{
    // cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3
    // visibility is a Cook-Torrance geometry function divided by (n.l)*(n.v)
    return NdotL * NdotV * G1( NdotL, k) * G1( NdotV, k);

    // can be written like that:
    // NdotL * NdotV * 1.0 / ( mix( NdotL, 1.0, k) * mix( NdotV, 1.0, k) );
}


float D_GGX( const in float NdotH, const in float alpha)
{
    // use GGX / Trowbridge-Reitz, same as Disney and Unreal 4
    // cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3
    float tmp = alpha / (NdotH*NdotH*(alpha*alpha-1.0)+1.0);
    return tmp * tmp * INV_PI;
}


// Dave Hoskins: hash without sin
#define MOD2 vec2(443.8975,397.2973)
//----------------------------------------------------------------------------------------
//  1 out, 1 in...
//note: normalized uniform random, [0;1[
float hash11(const in float p)
{
    vec2 p2 = fract(vec2(p) * MOD2);
    p2 += dot(p2.yx, p2.xy+19.19);
    return fract(p2.x * p2.y);
}

// note: [-1;1]
// iq: https://www.shadertoy.com/view/Xsl3Dl
// note: value noise
//  2 out, 2 in...
vec2 hashSin22( const in vec2 n )
{
    return fract(sin(dot(n.xy, vec2(12.9898, 78.233)))* vec2(43758.5453,35458.5734));
}

float rand2(const in vec2 co)
{
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}


vec2 uniformSample(const in int i )
{
    float sqrtSample = sqrt(float(NB_SAMPLES));
    float indexSample = float(i);
    float m = mod( indexSample, sqrtSample);
    float x = m/sqrtSample;
    float y = floor(indexSample/sqrtSample)/sqrtSample;
    return vec2(x,y);
}

vec2 getSample(const in int i )
{
    vec2 u;
    float sqrtSample = sqrt(float(NB_SAMPLES));
    float indexSample = float(i);
    float m = mod( indexSample, sqrtSample);
    float x = m/sqrtSample;
    float y = floor(indexSample/sqrtSample)/sqrtSample;
    return hashSin22(vec2(x,y)*0.5 + vec2(0.5));
}

vec3 evaluateDiffuseIBL( const in vec3 N,
                         const in vec3 V,
                         const in mat3 tangentToWorld)
{

    vec3 contrib = vec3(0.0);
    vec2 u;
    for ( int i = 0; i < NB_SAMPLES; i++ ) {

        // get sample
        vec2 u = getSample( i );
        //vec2 u = hammersley[i];

        // compute L vector from importance sampling with cos
        float phi = PI_2*u.x;
        float cosT = sqrt( 1.0 - u.y );
        float sinT = sqrt( 1.0 - cosT * cosT );
        vec3 L = tangentToWorld * vec3( sinT* cos(phi), sinT* sin(phi), cosT );
        // vec3 L = sinT* cos(phi ) * tangentX + ( sinT* sin(phi) ) * tangentY + cosT * N;

        float NdotL = dot( L, N );

        if ( NdotL > 0.0 ) {

            // compute pdf
            float pdf = NdotL * INV_PI;

            // vec3 dir = uEnvironmentTransform * L;
            // vec3 color = textureCubeLodEXT(uEnvironment, dir, 0.0 ).rgb;
            vec3 color = uBrightness * getReferenceTexelEnvironmentLod( L, pdf ).rgb;

            // could simplified to texel * INV_PI
            contrib += color * NdotL / pdf;
        }
    }

    contrib *= INV_PI * 1.0 / float(NB_SAMPLES);
    return contrib;
}


vec3 evaluateSpecularIBL( const in vec3 N,
                          const in vec3 V,
                          const in mat3 tangentToWorld,
                          float linRoughness,
                          const in vec3 specular )
{

    vec3 contrib = vec3(0.0);
    // if dont simplify the math you can get a rougness of 0 and it will
    // produce an error on D_GGX / 0.0
    linRoughness = max( linRoughness, 0.015);
    // float roughness = MaterialRoughness;

    //vec3 f0 = MaterialSpecular;
    vec3 f0 = specular;


    float NdotV = abs( dot(V, N) ) + 1.0e-5;

    float alpha = linRoughness*linRoughness;
    float alphaMinus1 = alpha - 1.0;

    float alpha2 = alpha*alpha;
    float alpha2Minus1 = alpha2 - 1.0;

    float k = alpha * 0.5;

    vec3 H, L;

    float weight = 0.0;

    for ( int i = 0; i < NB_SAMPLES; i++ ) {

        // get sample
        vec2 u = getSample( i );
        //vec2 u = uHammersleySamples[i];

        // Importance sampling GGX NDF sampling
        float cosThetaH = sqrt( (1.0-u.y) / (1.0 + alpha2Minus1 * u.y) ); // ue4
        float sinThetaH = sqrt(1.0 - min(cosThetaH*cosThetaH,1.0) );
        float phiH = u.x * PI_2;

        // Convert sample from half angle to incident angle
        H = normalize( vec3( sinThetaH*cos(phiH), sinThetaH*sin(phiH), cosThetaH ) );
        H = tangentToWorld * H;

        L = normalize(2.0 * dot(V, H) * H - V);

        float NdotL = clamp( dot(L, N) , 0.0, 1.0 );
        float NdotH = clamp( dot(H, N) , 0.0, 1.0 );
        float LdotH = clamp( dot(H, L) , 0.0, 1.0 );

        if ( NdotL <= 0.0 ) // || NdotH <= 0.0 || LdotH <= 0.0 )
            continue;


        // Importance sampling weight for each sample
        //
        //   weight = fr . (N.L)
        //
        // with:
        //   fr  = D(H) . F(H) . G(V, L) / ( 4 (N.L) (N.V) )
        //
        // Since we integrate in the microfacet space, we include the
        // jacobian of the transform
        //
        //   pdf = D(H) . (N.H) / ( 4 (L.H) )


        //float D         = D_GGX(NdotH, alpha ); // check the function
        // UE4
        float tmp = alpha / (NdotH*NdotH*( alpha2Minus1 ) + 1.0);
        float D = tmp * tmp * INV_PI;

        // Frostbite
        // float tmp = (NdotH * alpha - NdotH ) * NdotH + 1.0;
        // float D = (alpha * INV_PI) / ( tmp * tmp );


        float pdfH      = D * NdotH;
        float pdf       = pdfH / (4.0 * LdotH);

        // Implicit weight (N.L canceled out)
        //float3 F	   = F_Schlick(f0, f90, LdotH); // form Sebastien Lagarde
        // vec3 F         = F_Schlick(f0, LdotH);


        // cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3
        // Geometry  G(V, L )
        // float G     = G_SmithGGX(NdotL, NdotV, k);

        // original function: // check G_SmithGGX
        // G = NdotL * NdotV * G1( NdotL, k) * G1( NdotV, k);
        // here the version is simplified. It removes NdotV and that helps too
        // because of the divider in fr  = D(H) . F(H) . G(V, L) / ( 4 (N.L) (N.V) )
        // so it simplify issue at greasing angle
        // float G_denomator     = G1( NdotL, k) * G1( NdotV, k);
        // float G_denomator     = 1.0/ ( mix( NdotL, 1.0, k) * mix( NdotV, 1.0, k) );



        // weight original
        // vec3 weight = F * G * D / (4.0 * NdotV);
        // vec3 weightPDF = weight / pdf;

        // because of G_denomator we can remove NdotV
        // weight = F * G_denomator * D * NdotL / (4.0);
        // weight = F * G_denomator * D * NdotL * 0.25;

        // weight will be diveded by pdf so we can simplify again
        // weightPDF = F * G_denomator * D * NdotL * 0.25 / pdf;
        // weightPDF = F * G_denomator * D * NdotL * 0.25 / ( D * NdotH / ( 4.0 * LdotH ) );
        // weightPDF = F * G_denomator * NdotL * LdotH / NdotH;
        // vec3 weightPDF = F * ( G_denomator * NdotL * LdotH / NdotH );


        //vec3 dir = environmentTransform * L;
        //vec3 color = uBrightness * textureCubeLodEXT(uEnvironmentCube, L, 0.0 ).rgb;
        vec3 color = uBrightness * getReferenceTexelEnvironmentLod( L, pdf ).rgb;

        // marmoset tricks
        color *= occlusionHorizon( L, osg_FragNormal );

        // to debug the brdf
        //vec3 color = vec3(1.0);

        //vec3 F = F_Schlick(f0, LdotH);
        float Fc = pow( 1.0 - LdotH, 5.0 );
        vec3 F = (1.0 - Fc) * f0 + Fc;

        float G_denomator = 1.0/ ( mix( NdotL, 1.0, k) * mix( NdotV, 1.0, k) );
        //contrib += color * weightPDF;
        contrib += ( color * F ) * ( G_denomator * NdotL * LdotH / NdotH );

    }

    contrib *= 1.0/float(NB_SAMPLES);
    return contrib;
}


mat3 computeTangentFrame( const in vec4 tangent, const in vec3 normal)
{
    vec3 tangentx, tangenty;
    // Build local referential
#ifdef NO_TANGENT
    vec3 upVector = abs(normal.y) < 0.999999 ? vec3(0.0,1.0,0.0) : vec3(0.0,0.0,1.0);
    tangentx = normalize( cross( upVector, normal ) );
    tangenty = cross( normal, tangentx );

#else

    vec3 tang = normalize(tangent.xyz);
    vec3 binormal = tangent.w * cross(normal, tang);
    tangentx = normalize(tang - normal*dot(tang, normal)); // local tangent
    tangenty = normalize(binormal  - normal*dot(binormal, normal)  - tang*dot(binormal, tangentx)); // local bitange
#endif
    return mat3(tangentx,tangenty,normal);
}

vec3 computeIBL( const in vec4 tangent,
                 const in vec3 normal,
                 const in vec3 view,
                 const in vec3 albedo,
                 const in float roughness,
                 const in vec3 specular)
{

    //vectors used for importance sampling
    mat3 tangentToWorld = computeTangentFrame(tangent, normal );

    vec3 color = vec3(0.0);
    if ( albedo != color ) { // skip if no diffuse
        color += albedo * evaluateDiffuseSphericalHarmonics(normal,
                 view );
    }

    color += evaluateSpecularIBL(normal,
                                 view,
                                 tangentToWorld,
                                 roughness,
                                 specular);

    return color;
}


vec3 referenceIBL( const in vec4 tangent,
                   const in vec3 normal,
                   const in vec3 view,
                   const in vec3 albedo,
                   const in float roughness,
                   const in vec3 specular)
{

    //vectors used for importance sampling
    mat3 tangentToWorld = computeTangentFrame(tangent, normal );

    vec3 color = vec3(0.0);
    if ( albedo != color ) { // skip if no diffuse
        color += albedo * evaluateDiffuseIBL(normal,
                                             view,
                                             tangentToWorld);
    }

    color += evaluateSpecularIBL(normal,
                                 view,
                                 tangentToWorld,
                                 roughness,
                                 specular);

    return color;
}
