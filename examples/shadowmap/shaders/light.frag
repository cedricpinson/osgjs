
////////////////////////////
// blinn Style
/* usage
    vec2 bln = blinn(lightDir, normal, view);
    vec4 lc = lit(bln.x, bln.y, 1.0);
    float fres = fresnel(bln.x, 0.2, 5.0);

    float index = ( (sin(v_pos.x*3.0+u_time)*0.3+0.7)
                + (  cos(v_pos.y*3.0+u_time)*0.4+0.6)
                + (  cos(v_pos.z*3.0+u_time)*0.2+0.8)
                )*M_PI;

    vec3 color = vec3(sin(index*8.0)*0.4 + 0.6
                    , sin(index*4.0)*0.4 + 0.6
                    , sin(index*2.0)*0.4 + 0.6
                    ) * v_color0.xyz;

    light = vec3(0.07, 0.06, 0.08) + color*lc.y + fres*pow(lc.z, 128.0);
*/
vec2 blinn(vec3 _lightDir, vec3 _normal, vec3 _viewDir)
{
    float ndotl = dot(_normal, _lightDir);
    vec3 reflected = _lightDir - 2.0*ndotl*_normal; // reflect(_lightDir, _normal);
    float rdotv = dot(reflected, _viewDir);
    return vec2(ndotl, rdotv);
}

float fresnel(float _ndotl, float _bias, float _pow)
{
    float facing = (1.0 - _ndotl);
    return max(_bias + (1.0 - _bias) * pow(facing, _pow), 0.0);
}

vec4 lit(float _ndotl, float _rdotv, float _m)
{
    float diff = max(0.0, _ndotl);
    float spec = step(0.0, _ndotl) * max(0.0, _rdotv * _m);
    return vec4(1.0, diff, spec, 1.0);
}


////////////////////////////
// sketchfab history lighting.
float getLightAttenuation(in vec3 lightDir, in float constant, in float linear, in float quadratic) {
    float d = length(lightDir);
    float att = 1.0 / (constant + linear * d + quadratic * d * d);
    return max(0.0, min(1.0, att));
}



void computeLightContribution(in vec4 materialDiffuse,   in vec4 materialSpecular,   in float materialShininess,
                             in vec4 lightDiffuse, in   vec4 lightSpecular,
                             in vec3 normal,  in  vec3 eye,
                             in vec3 lightDirection,  in  vec3 lightSpotDirection,
                             in float lightCosSpotCutoff,  in  float lightSpotBlend,  in  float lightAttenuation,
                             in float NdotL, out vec4 lightColor, out float spot) {
    vec3 L = lightDirection;
    vec3 N = normal;
    vec3 E = eye;

    NdotL = max(NdotL, 0.0);

    vec4 diffuse = vec4(0.0);
    vec4 specular = vec4(0.0);
    spot = 1.0;
    vec3 D = lightSpotDirection;

    if (lightCosSpotCutoff > 0.0) {
        float cosCurAngle = dot(-L, D);
        float diffAngle = cosCurAngle - lightCosSpotCutoff;
        if (diffAngle < 0.0 || lightSpotBlend <= 0.0) {
            spot = (debug == 0.0) ? 0.5:0.0;
        } else {
            spot = cosCurAngle * smoothstep(0.0, 1.0, (diffAngle) / (lightSpotBlend));
        }
    }
    if (spot > 0.0){
        float RdotE;
        vec3 R = reflect(-L, N);
        RdotE = max(dot(R, E), 0.0);
        if (RdotE > 0.0) {
            RdotE = pow(RdotE, materialShininess);
        }

        float halfTerm = NdotL;
        diffuse = lightDiffuse * halfTerm;
        specular = lightSpecular * RdotE;
    }
    lightColor = ((materialDiffuse * diffuse + materialSpecular * specular) * spot) * lightAttenuation;

}

vec4 ComputeLigthShadow(in vec4 light_position, in vec3 light_direction, in vec3 fragVectorPos,
                         in vec3 normal,  in  vec3 eye,
                        in vec4 materialAmbient,   in vec4 materialDiffuse,   in vec4 materialSpecular,   in float materialShininess,
                         in vec4 lightAmbient,   in vec4 lightDiffuse, in   vec4 lightSpecular,
                         in float constantAtt, in float linearAtt, in float quadraticAtt,
                         in float lightCosSpotCutoff,  in  float lightSpotBlend,
                         in vec4 shadowVertexProjected, in vec4 shadowZ,
                           in sampler2D tex, in vec4 texSize,
                             in vec4 depthRange )
{
    vec3 Light_pos = light_position.xyz;
    vec3 Light_Dir;
    if (light_position[3] == 1.0) {
        Light_Dir = Light_pos.xyz - fragVectorPos;
    } else {
        Light_Dir = Light_pos;
        //Light_Dir =  fragVectorPos- Light_pos.xyz;
        //Light_Dir = light_direction.xyz;
        lightCosSpotCutoff = 0.0;
    }


    vec3 Light_spotDirection = normalize(light_direction.xyz);

    float Light_attenuation = getLightAttenuation(Light_pos - fragVectorPos, constantAtt, linearAtt, quadraticAtt);

    Light_Dir = normalize(Light_Dir);
    float NdotL = dot(Light_Dir, normal);


    vec4 lightColor = vec4(0.0, 0.0, 0.0, 1.0);
    if (NdotL > 0.0 && Light_attenuation > 0.0) {
        float spot = 1.0;
        computeLightContribution(
            materialDiffuse,   materialSpecular,  materialShininess,
            lightDiffuse, lightSpecular,
            normal,  eye,
            Light_Dir,
            Light_spotDirection.xyz,  lightCosSpotCutoff,  lightSpotBlend,
            Light_attenuation,
            NdotL, lightColor, spot);

        float shadow_contrib = spot > 0.0 ? computeShadowTerm(shadowVertexProjected, shadowZ,
            tex, texSize, depthRange,
            Light_pos, NdotL, normal) : 0.0;
        //lightColor = vec4(1.0, 1.0, 1.0, 1.0) * clamp(shadow_contrib, 0.0,1.0);
        lightColor *= clamp(shadow_contrib, 0.0,1.0);
    }

    lightColor += materialAmbient * lightAmbient;

    // Light debug proj
    // TO KEEP as it helps
    // validating all param/uniform
    // in this equation
    // position
    vec3 lightEye =  Light_pos - Camera_uniform_position.xyz;
    vec3 FragEye = normalize( fragVectorPos - Camera_uniform_position.xyz );
    float dotLF = dot(lightEye,FragEye);
    if (dotLF > 0.0)
    {
        float DistToLight2 = dot(lightEye,lightEye) - dotLF * dotLF;
        if (DistToLight2 < 5.0)
        {
            lightColor = mix(vec4(1.0,0.0,0.0,1.0) - lightColor, lightColor, (1.0 - DistToLight2 / 20.0));
        }
    }
    // direction
    /*
    vec3 lightdirEye =  Light_pos - Camera_uniform_position.xyz;
    float dotLF = dot(lightEye,FragEye);
    if (dotLF > 0.0)
    {
        float DistToLight2 = dot(lightEye,lightEye) - dotLF * dotLF;
        if (DistToLight2 < 5.0)
        {
            lightColor = mix(vec4(1.0,1.0,1.0,1.0) - lightColor, lightColor, (1.0 - DistToLight2 / 20.0));
        }
    }
    */
    // end Light debug proj


    return lightColor;
}