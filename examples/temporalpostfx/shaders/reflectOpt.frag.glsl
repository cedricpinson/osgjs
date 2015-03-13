#extension GL_OES_standard_derivatives : require

#pragma include "colorEncode"
#pragma include "raytrace"



//   vec4 projInfo = vec4(-2.0 / (renderSize.x*ProjectionMatrix[0][0]),
//           -2.0 / (renderSize.y*ProjectionMatrix[1][1]),
//          ( 1.0 - ProjectionMatrix[0][2]) / ProjectionMatrix[0][0],
//          ( 1.0 + ProjectionMatrix[1][2]) / ProjectionMatrix[1][1]);
vec3 reconstructCSPosition(vec2 S, float z, vec4 projInfo) {
    return vec3((S.xy * projInfo.xy + projInfo.zw) * z, z);
}


vec3 getPosition(const vec2 uv, const sampler2D tex, const vec4 projInfo)
{
    float depth = decodeFloatRGBA(texture2D(tex, uv));
    vec3 Position = reconstructCSPosition(uv, depth, projInfo);
    return Position;

}



float getDepth(const in float depth, const in vec2 nearFar)
{
    return depth;

    // float zNear = nearFar.x;
    // float zFar = nearFar.y;
    // return (2.0 * zNear) / (zFar + zNear - depth * (zFar - zNear));

    //uniform gl_DepthRangeParameters gl_DepthRange; // {near, far, diff (f -n)}
    // float zNear = gl_DepthRange.near;
    // float zFar = gl_DepthRange.far;
    // float diff = gl_DepthRange.diff;
    // return (2.0 * zNear) / (zFar + zNear - depth * (diff));
}


// reconstructs view-space unit normal from view-space position
vec3 getNormal(const in sampler2D texDepth, const in vec2 uv)
{
    vec4 normal;
    normal = texture2D(texDepth, uv);
    normal.xy = decodeHalfFloatRGBA(normal);
    normal.xy = (normal.xy - 0.5) * 2.0;
    normal.z = 1.0 - normal.x - normal.y;
    return normal.xyz;
}

// reconstructs view-space unit normal from view-space position
vec3 reconstructNormalVS(const in vec3 positionVS)
{
    return normalize(vec3(dFdx(positionVS.z) * 500.0, dFdy(positionVS.z) * 500.0, 1.0)) * 0.5 + 0.5;
    //return normalize(cross(dFdx(positionVS), dFdy(positionVS)));
}


varying vec4 FragNormal;
varying vec4 FragPosition;
varying vec2 FragTexCoord0;

uniform sampler2D Texture0;
uniform sampler2D Texture1;
uniform sampler2D Texture2;
uniform sampler2D Texture3;
uniform samplerCube Texture6;

uniform mat4 ProjectionMatrix;
uniform vec4 renderSize;
uniform vec2 NearFar;

void main (void)
{
    vec2 screenPos = gl_FragCoord.xy * renderSize.zw;

    vec4 projInfo = vec4(-2.0 / (renderSize.x*ProjectionMatrix[0][0]),
                         -2.0 / (renderSize.y*ProjectionMatrix[1][1]),
                         ( 1.0 - ProjectionMatrix[0][2]) / ProjectionMatrix[0][0],
                         ( 1.0 + ProjectionMatrix[1][2]) / ProjectionMatrix[1][1]);

    vec3 clipInfo = computeClipInfo(NearFar[0], NearFar[1]);

    float screenZ = getDepth(Texture1, screenPos);

    gl_FragColor = vec4(0.0, 0.0, 1.0, 0.0);

    if (  screenZ > gl_FragCoord.z - 0.0001){

        //in
        vec3 csOrigin = FragPosition.xyz;
        vec3 csDirection = normalize(-FragNormal.xyz);

        //out
        vec2 hitPixel;
        int which;
        vec3 csHitvec;

        bool hit = traceScreenSpaceRay1(csOrigin,
                                        csDirection,
                                        ProjectionMatrix,
                                        Texture1,
                                        renderSize.xy,
                                        0.0001,
                                        clipInfo,
                                        NearFar[0],
                                        3.0,// stride step >= 1.0
                                        0.25, //jitterFraction 0-1.0
                                        250.0,//maxSteps,
                                        NearFar[1],// maxRayTraceDistance
                                        hitPixel,
                                        csHitvec);

        if (hit){
            gl_FragColor.a = 1.0;
            gl_FragColor.rgb = texture2D(Texture3, hitPixel).rgb;
        }
        else{
            gl_FragColor.rgb = vec3(0.2,0.2,0.2);//reflection;//exture2D(Texture0, FragTexCoord0).rgb;
            gl_FragColor.a = 1.;
        }
    }
}
