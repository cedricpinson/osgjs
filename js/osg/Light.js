/** -*- compile-command: "jslint-cli Node.js" -*- */

/** 
 *  Light
 *  @class Light
 */
osg.Light = function (lightNumber) {
    osg.StateAttribute.call(this);

    if (lightNumber === undefined) {
        lightNumber = 0;
    }

    this._ambient = [ 0.2, 0.2, 0.2, 1.0 ];
    this._diffuse = [ 0.8, 0.8, 0.8, 1.0 ];
    this._specular = [ 0.2, 0.2, 0.2, 1.0 ];
    this._position = [ 0.0, 0.0, 1.0, 0.0 ];
    this._direction = [ 0.0, 0.0, -1.0 ];
    this._spotCutoff = 180.0;
    this._spotCutoffEnd = 180.0;
    this._constantAttenuation = 1.0;
    this._linearAttenuation = 0.0;
    this._quadraticAttenuation = 0.0;
    this._lightUnit = lightNumber;
    this._enabled = 0;

    this.dirty();
};

/** @lends osg.Light.prototype */
osg.Light.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "Light",
    cloneType: function() {return new osg.Light(this._lightUnit); },
    getType: function() { return this.attributeType; },
    getTypeMember: function() { return this.attributeType + this._lightUnit;},
    getOrCreateUniforms: function() {
        if (osg.Light.uniforms === undefined) {
            osg.Light.uniforms = {};
        }
        if (osg.Light.uniforms[this.getTypeMember()] === undefined) {
            osg.Light.uniforms[this.getTypeMember()] = { "ambient": osg.Uniform.createFloat4([ 0.2, 0.2, 0.2, 1], this.getParameterName("ambient")) ,
                                                         "diffuse": osg.Uniform.createFloat4([ 0.8, 0.8, 0.8, 1], this.getParameterName('diffuse')) ,
                                                         "specular": osg.Uniform.createFloat4([ 0.2, 0.2, 0.2, 1], this.getParameterName('specular')) ,
                                                         "position": osg.Uniform.createFloat4([ 0, 0, 1, 0], this.getParameterName('position')),
                                                         "direction": osg.Uniform.createFloat3([ 0, 0, 1], this.getParameterName('direction')),
                                                         "spotCutoff": osg.Uniform.createFloat1( 180.0, this.getParameterName('spotCutoff')),
                                                         "spotCutoffEnd": osg.Uniform.createFloat1( 180.0, this.getParameterName('spotCutoffEnd')),
                                                         "constantAttenuation": osg.Uniform.createFloat1( 0, this.getParameterName('constantAttenuation')),
                                                         "linearAttenuation": osg.Uniform.createFloat1( 0, this.getParameterName('linearAttenuation')),
                                                         "quadraticAttenuation": osg.Uniform.createFloat1( 0, this.getParameterName('quadraticAttenuation')),
                                                         "enable": osg.Uniform.createInt1( 0, this.getParameterName('enable')),
                                                         "matrix": osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]), this.getParameterName('matrix')),
                                                         "invMatrix": osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]), this.getParameterName('invMatrix'))
                                                       };

            var uniformKeys = [];
            for (var k in osg.Light.uniforms[this.getTypeMember()]) {
                uniformKeys.push(k);
            }
            osg.Light.uniforms[this.getTypeMember()].uniformKeys = uniformKeys;
        }
        return osg.Light.uniforms[this.getTypeMember()];
    },

    setPosition: function(pos) { osg.Vec4.copy(pos, this._position); },
    setAmbient: function(a) { this._ambient = a; this.dirty(); },
    setSpecular: function(a) { this._specular = a; this.dirty(); },
    setDiffuse: function(a) { this._diffuse = a; this.dirty(); },
    setSpotCutoff: function(a) { this._spotCutoff = a; this.dirty(); },
    setSpotCutoffEnd: function(a) { this._spotCutoffEnd = a; this.dirty(); },

    setConstantAttenuation: function(value) { this._constantAttenuation = value; this.dirty();},
    setLinearAttenuation: function(value) { this._linearAttenuation = value; this.dirty();},
    setQuadraticAttenuation: function(value) { this._quadraticAttenuation = value; this.dirty();},

    setDirection: function(a) { this._direction = a; this.dirty(); },
    setLightNumber: function(unit) { this._lightUnit = unit; this.dirty(); },

    getPrefix: function() { return this.getType() + this._lightUnit; },
    getParameterName: function (name) { return this.getPrefix()+ "_" + name; },

    applyPositionedUniform: function(matrix, state) {
        var uniform = this.getOrCreateUniforms();
        osg.Matrix.copy(matrix, uniform.matrix.get());
        uniform.matrix.dirty();

        osg.Matrix.copy(matrix, uniform.invMatrix.get());
        uniform.invMatrix.get()[12] = 0;
        uniform.invMatrix.get()[13] = 0;
        uniform.invMatrix.get()[14] = 0;
        osg.Matrix.inverse(uniform.invMatrix.get(), uniform.invMatrix.get());
        osg.Matrix.transpose(uniform.invMatrix.get(), uniform.invMatrix.get());
        uniform.invMatrix.dirty();
    },

    apply: function(state)
    {
        var light = this.getOrCreateUniforms();

        light.ambient.set(this._ambient);
        light.diffuse.set(this._diffuse);
        light.specular.set(this._specular);
        light.position.set(this._position);
        light.direction.set(this._direction);

        light.spotCutoff.get()[0] = this._spotCutoff;
        light.spotCutoff.dirty();

        light.spotCutoffEnd.get()[0] = this._spotCutoffEnd;
        light.spotCutoffEnd.dirty();

        light.constantAttenuation.get()[0] = this._constantAttenuation;
        light.constantAttenuation.dirty();

        light.linearAttenuation.get()[0] = this._linearAttenuation;
        light.linearAttenuation.dirty();

        light.quadraticAttenuation.get()[0] = this._quadraticAttenuation;
        light.quadraticAttenuation.dirty();

        //light._enable.set([this.enable]);

        this.setDirty(false);
    },

    writeShaderInstance: function(type) {
        var str = "";
        switch (type) {
        case osg.ShaderGeneratorType.VertexInit:
            str = [ "",
                    "varying vec3 FragNormal;",
                    "varying vec3 FragEyeVector;",
                    "",
                    "" ].join('\n');
            break;
        case osg.ShaderGeneratorType.VertexFunction:
            str = [ "",
                    "vec3 computeNormal() {",
                    "   return vec3(NormalMatrix * vec4(Normal, 0.0));",
                    "}",
                    "",
                    "vec3 computeEyeVertex() {",
                    "   return vec3(ModelViewMatrix * vec4(Vertex,1.0));",
                    "}",
                    "",
                    "float getLightAttenuation(vec3 lightDir, float constant, float linear, float quadratic) {",
                    "    ",
                    "    float d = length(lightDir);",
                    "    float att = 1.0 / ( constant + linear*d + quadratic*d*d);",
                    "    return att;",
                    "}",
                    ""].join('\n');
            break;
        case osg.ShaderGeneratorType.VertexMain:
            str = [ "",
                    "  vec3 vertexEye = computeEyeVertex();",
                    "  FragEyeVector = -vertexEye;",
                    "  FragNormal = computeNormal();",
                    "" ].join('\n');
            break;
        case osg.ShaderGeneratorType.FragmentInit:
            str = [ "varying vec3 FragNormal;",
                    "varying vec3 FragEyeVector;",
                    "vec4 LightColor = vec4(0.0);",
                    "" ].join('\n');
            break;

        case osg.ShaderGeneratorType.FragmentFunction:
            str = [ "",
                    "vec4 computeLightContribution(vec4 materialEmission,",
                    "                              vec4 materialAmbient,",
                    "                              vec4 materialDiffuse,",
                    "                              vec4 materialSpecular,",
                    "                              float materialShininess,",
                    "                              vec4 lightAmbient,",
                    "                              vec4 lightDiffuse,",
                    "                              vec4 lightSpecular,",
                    "                              vec3 normal,",
                    "                              vec3 eye,",
                    "                              vec3 lightDirection,",
                    "                              vec3 lightSpotDirection,",
                    "                              float lightCosSpotCutoff,",
                    "                              float lightCosSpotCutoffEnd,",
                    "                              float lightAttenuation)",
                    "{",
                    "    vec3 L = lightDirection;",
                    "    vec3 N = normal;",
                    "    float NdotL = max(dot(L, N), 0.0);",
                    "    vec4 ambient = lightAmbient;",
                    "    vec4 diffuse = vec4(0.0);",
                    "    vec4 specular = vec4(0.0);",
                    "    float spot = 0.0;",
                    "",
                    "    if (NdotL > 0.0) {",
                    "        vec3 E = eye;",
                    "        vec3 R = reflect(-L, N);",
                    "        float RdotE = pow( max(dot(R, E), 0.0), materialShininess );",
                    "",
                    "        vec3 D = lightSpotDirection;",
                    "        spot = 1.0;",
                    "        if (lightCosSpotCutoff > 0.0) {",
                    "          float cosCurAngle = dot(L, D);",
                    "          float cosInnerMinusOuterAngle = lightCosSpotCutoff - lightCosSpotCutoffEnd;",
                    "",
                    "          spot = clamp((cosCurAngle - lightCosSpotCutoffEnd) / cosInnerMinusOuterAngle, 0.0, 1.0);",
                    "        }",

                    "        diffuse = lightDiffuse * NdotL;",
                    "        specular = lightSpecular * RdotE;",
                    "    }",
                    "",
                    "    return materialEmission + (materialAmbient*ambient + (materialDiffuse*diffuse + materialSpecular*specular) * spot) * lightAttenuation;",
                    "}",
                    "" ].join('\n');
            break;
        case osg.ShaderGeneratorType.FragmentMain:
            str = [ "",
                    "  vec3 normal = normalize(FragNormal);",
                    "  vec3 eyeVector = normalize(FragEyeVector);",
                    ""].join("\n");
            break;
        case osg.ShaderGeneratorType.FragmentEnd:
            str = [ "",
                    "  fragColor *= LightColor;",
                    ""].join('\n');
            break;
        }
        return str;
    },

    writeToShader: function(type)
    {
        var str = "";
        switch (type) {
        case osg.ShaderGeneratorType.VertexInit:
            str = [ "",
                    "varying vec3 FragDirection;",
                    "varying vec3 FragSpotDirection;",
                    "varying float FragAttenuation;",
                    "uniform vec4 LightPosition;",
                    "uniform vec3 LightDirection;",
                    "uniform mat4 LightMatrix;",
                    "uniform mat4 LightInvMatrix;",
                    "uniform float LightConstantAttenuation;",
                    "uniform float LightLinearAttenuation;",
                    "uniform float LightQuadraticAttenuation;",
                    "",
                    "" ].join('\n');
            str = str.replace(/LightMatrix/g, this.getParameterName('matrix'));
            str = str.replace(/LightInvMatrix/g, this.getParameterName('invMatrix'));
            str = str.replace(/FragDirection/g, this.getParameterName('fragDirection'));
            str = str.replace(/FragSpotDirection/g, this.getParameterName('fragSpotDirection'));
            str = str.replace(/LightPosition/g, this.getParameterName('position'));
            str = str.replace(/LightDirection/g, this.getParameterName('direction'));
            str = str.replace(/FragAttenuation/g, this.getParameterName('fragAttenuation'));
            str = str.replace(/LightConstantAttenuation/g, this.getParameterName('constantAttenuation'));
            str = str.replace(/LightLinearAttenuation/g, this.getParameterName('linearAttenuation'));
            str = str.replace(/LightQuadraticAttenuation/g, this.getParameterName('quadraticAttenuation'));
            break;
        case osg.ShaderGeneratorType.VertexMain:
            str = [ "",
                    "  vec3 lightEye = vec3(LightMatrix * LightPosition);",
                    "  vec3 lightDir;",
                    "  if (LightPosition[3] == 1.0) {",
                    "    lightDir = lightEye - vertexEye;",
                    "  } else {",
                    "    lightDir = lightEye;",
                    "  }",
                    "  FragSpotDirection = normalize(mat3(LightInvMatrix)*LightDirection);",
                    "  FragDirection = lightDir;",
                    "  FragAttenuation = getLightAttenuation(lightDir, LightAttenuationConstant, LightAttenuationLinear, LightAttenuationQuadratic);",
                    "" ].join('\n');
            str = str.replace(/LightMatrix/g, this.getParameterName('matrix'));
            str = str.replace(/LightInvMatrix/g, this.getParameterName('invMatrix'));
            str = str.replace(/LightPosition/g, this.getParameterName('position'));
            str = str.replace(/lightEye/g, this.getParameterName('eye'));
            str = str.replace(/FragDirection/g, this.getParameterName('fragDirection'));
            str = str.replace(/FragSpotDirection/g, this.getParameterName('fragSpotDirection'));
            str = str.replace(/LightDirection/g, this.getParameterName('direction'));
            str = str.replace(/lightDir/g, this.getParameterName('lightDir'));
            str = str.replace(/FragAttenuation/g, this.getParameterName('fragAttenuation'));
            str = str.replace(/LightAttenuationConstant/g, this.getParameterName('constantAttenuation'));
            str = str.replace(/LightAttenuationLinear/g, this.getParameterName('linearAttenuation'));
            str = str.replace(/LightAttenuationQuadratic/g, this.getParameterName('quadraticAttenuation'));
            break;
        case osg.ShaderGeneratorType.FragmentInit:
            str = [ "",
                    "varying vec3 FragDirection;",
                    "varying vec3 FragSpotDirection;",
                    "varying float FragAttenuation;",
                    "uniform vec4 LightAmbient;",
                    "uniform vec4 LightDiffuse;",
                    "uniform vec4 LightSpecular;",
                    "uniform float LightSpotCutoff;",
                    "uniform float LightSpotCutoffEnd;",
                    "" ].join('\n');
            str = str.replace(/FragDirection/g, this.getParameterName('fragDirection'));
            str = str.replace(/FragSpotDirection/g, this.getParameterName('fragSpotDirection'));
            str = str.replace(/LightAmbient/g, this.getParameterName('ambient'));
            str = str.replace(/LightDiffuse/g, this.getParameterName('diffuse'));
            str = str.replace(/LightSpecular/g, this.getParameterName('specular'));
            str = str.replace(/LightSpotCutoff/g, this.getParameterName('spotCutoff'));
            str = str.replace(/LightSpotCutoffEnd/g, this.getParameterName('spotCutoffEnd'));
            str = str.replace(/FragAttenuation/g, this.getParameterName('fragAttenuation'));
            break;
        case osg.ShaderGeneratorType.FragmentMain:
            str = [ "",
                    "  vec3 lightDirectionNormalized = normalize(FragDirection);",
                    "  float lightCosSpotCutoff = cos(radians(LightSpotCutoff));",
                    "  float lightCosSpotCutoffEnd = cos(radians(LightSpotCutoffEnd));",
                    "  LightColor += computeLightContribution(MaterialEmission,",
                    "                                         MaterialAmbient,",
                    "                                         MaterialDiffuse, ",
                    "                                         MaterialSpecular,",
                    "                                         MaterialShininess,",
                    "                                         LightAmbient,",
                    "                                         LightDiffuse,",
                    "                                         LightSpecular,",
                    "                                         normal,",
                    "                                         eyeVector,",
                    "                                         lightDirectionNormalized,",
                    "                                         FragSpotDirection,",
                    "                                         lightCosSpotCutoff,",
                    "                                         lightCosSpotCutoffEnd,",
                    "                                         FragAttenuation);",
                    "" ].join('\n');

            str = str.replace(/lightDirectionNormalized/g, this.getParameterName('lightDirectionNormalized'));
            str = str.replace(/FragDirection/g, this.getParameterName('fragDirection'));
            str = str.replace(/FragSpotDirection/g, this.getParameterName('fragSpotDirection'));
            str = str.replace(/LightAmbient/g, this.getParameterName('ambient'));
            str = str.replace(/LightDiffuse/g, this.getParameterName('diffuse'));
            str = str.replace(/LightSpecular/g, this.getParameterName('specular'));
            str = str.replace(/LightSpotCutoff/g, this.getParameterName('spotCutoff'));
            str = str.replace(/LightSpotCutoffEnd/g, this.getParameterName('spotCutoffEnd'));
            str = str.replace(/lightSpotCutoff/g, this.getParameterName('lightSpotCutoff'));
            str = str.replace(/lightSpotCutoffEnd/g, this.getParameterName('lightSpotCutoffEnd'));
            str = str.replace(/lightCosSpotCutoff/g, this.getParameterName('lightCosSpotCutoff'));
            str = str.replace(/lightCosSpotCutoffEnd/g, this.getParameterName('lightCosSpotCutoffEnd'));
            str = str.replace(/FragAttenuation/g, this.getParameterName('fragAttenuation'));
            break;
        }
        return str;
    }
});
