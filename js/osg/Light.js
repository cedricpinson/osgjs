osg.Light = function () {
    osg.StateAttribute.call(this);

    this.ambient = [ 0.2, 0.2, 0.2, 1.0 ];
    this.diffuse = [ 0.8, 0.8, 0.8, 1.0 ];
    this.specular = [ 0.0, 0.0, 0.0, 1.0 ];
    this.direction = [ 0.0, 0.0, 1.0 ];
    this.constant_attenuation = 1.0;
    this.linear_attenuation = 1.0;
    this.quadratic_attenuation = 1.0;
    this.light_unit = 0;
    this.enabled = 0;

    this.ambient = [ 1.0, 1.0, 1.0, 1.0 ];
    this.diffuse = [ 1.0, 1.0, 1.0, 1.0 ];
    this.specular = [ 1.0, 1.0, 1.0, 1.0 ];

    this._dirty = true;
};

osg.Light.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "Light",
    cloneType: function() {return new osg.Light(); },
    getType: function() { return this.attributeType; },
    getTypeMember: function() { return this.attributeType + this.light_unit;},
    getOrCreateUniforms: function() {
        if (osg.Light.uniforms === undefined) {
            osg.Light.uniforms = {};
        }
        if (osg.Light.uniforms[this.getTypeMember()] === undefined) {
            osg.Light.uniforms[this.getTypeMember()] = { "ambient": osg.Uniform.createFloat4([ 0.2, 0.2, 0.2, 1], this.getParameterName("ambient")) ,
                                                         "diffuse": osg.Uniform.createFloat4([ 0.8, 0.8, 0.8, 1], this.getParameterName('diffuse')) ,
                                                         "specular": osg.Uniform.createFloat4([ 0.2, 0.2, 0.2, 1], this.getParameterName('specular')) ,
                                                         "direction": osg.Uniform.createFloat3([ 0, 0, 1], this.getParameterName('direction')),
                                                         "constant_attenuation": osg.Uniform.createFloat1( 0, this.getParameterName('constant_attenuation')),
                                                         "linear_attenuation": osg.Uniform.createFloat1( 0, this.getParameterName('linear_attenuation')),
                                                         "quadratic_attenuation": osg.Uniform.createFloat1( 0, this.getParameterName('quadratic_attenuation')),
                                                         "enable": osg.Uniform.createInt1( 0, this.getParameterName('enable')),
                                                         "matrix": osg.Uniform.createMatrix4(osg.Matrix.makeIdentity(), this.getParameterName('matrix'))
                                                       };

            var uniformKeys = [];
            for (var k in osg.Light.uniforms[this.getTypeMember()]) {
                uniformKeys.push(k);
            }
            osg.Light.uniforms[this.getTypeMember()].uniformKeys = uniformKeys;
        }
        return osg.Light.uniforms[this.getTypeMember()];
    },

    getPrefix: function() {
        return this.getType() + this.light_unit;
    },

    getParameterName: function (name) {
        return this.getPrefix()+ "_" + name;
    },

    applyPositionedUniform: function(matrix, state) {
        var uniform = this.getOrCreateUniforms();
        uniform.matrix.set(matrix);
    },

    apply: function(state)
    {
        var light = this.getOrCreateUniforms();

        light.ambient.set(this.ambient);
        light.diffuse.set(this.diffuse);
        light.specular.set(this.specular);
        light.direction.set(this.direction);
        light.constant_attenuation.set([this.constant_attenuation]);
        light.linear_attenuation.set([this.linear_attenuation]);
        light.quadratic_attenuation.set([this.quadratic_attenuation]);
        light.enable.set([this.enable]);

        this._dirty = false;
    },

    writeShaderInstance: function(type) {
        var str = "";
        switch (type) {
        case osg.ShaderGeneratorType.VertexInit:
            str = [ "",
                    "varying vec4 LightColor;",
                    "vec3 EyeVector;",
                    "vec3 NormalComputed;",
                    "",
                    "" ].join('\n');
            break;
        case osg.ShaderGeneratorType.VertexFunction:
            str = [ "",
                    "vec3 computeNormal() {",
                    "   return vec3(NormalMatrix * vec4(Normal, 0.0));",
                    "}",
                    "",
                    "vec3 computeEyeDirection() {",
                    "   return vec3(ModelViewMatrix * vec4(Vertex,1.0));",
                    "}",
                    "",
                    "void directionalLight(in vec3 lightDirection, in vec3 lightHalfVector, in float constantAttenuation, in float linearAttenuation, in float quadraticAttenuation, in vec4 ambient, in vec4 diffuse,in vec4 specular, in vec3 normal)",
                    "{",
                    "   float nDotVP;         // normal . light direction",
                    "   float nDotHV;         // normal . light half vector",
                    "   float pf;             // power factor",
                    "",
                    "   nDotVP = max(0.0, dot(normal, normalize(lightDirection)));",
                    "   nDotHV = max(0.0, dot(normal, lightHalfVector));",
                    "",
                    "   if (nDotHV == 0.0)",
                    "   {",
                    "       pf = 0.0;",
                    "   }",
                    "   else",
                    "   {",
                    "       pf = pow(nDotHV, MaterialShininess);",
                    "   }",
                    "   Ambient  += ambient;",
                    "   Diffuse  += diffuse * nDotVP;",
                    "   Specular += specular * pf;",
                    "}",
                    "",
                    "void flight(in vec3 lightDirection, in float constantAttenuation, in float linearAttenuation, in float quadraticAttenuation, in vec4 ambient, in vec4 diffuse, in vec4 specular, in vec3 normal)",
                    "{",
                    "    vec4 localColor;",
                    "    vec3 lightHalfVector = normalize(EyeVector-lightDirection);",
                    "    // Clear the light intensity accumulators",
                    "    Ambient  = vec4 (0.0);",
                    "    Diffuse  = vec4 (0.0);",
                    "    Specular = vec4 (0.0);",
                    "",
                    "    directionalLight(lightDirection, lightHalfVector, constantAttenuation, linearAttenuation, quadraticAttenuation, ambient, diffuse, specular, normal);",
                    "",
                    "    vec4 sceneColor = vec4(0,0,0,0);",
                    "    localColor = sceneColor +",
                    "      MaterialEmission +",
                    "      Ambient  * MaterialAmbient +",
                    "      Diffuse  * MaterialDiffuse;",
                    "      //Specular * MaterialSpecular;",
                    "    localColor = clamp( localColor, 0.0, 1.0 );",
                    "    LightColor += localColor;",
                    "",
                    "}" ].join('\n');
            break;
        case osg.ShaderGeneratorType.VertexMain:
            str = [ "",
                    "EyeVector = computeEyeDirection();",
                    "NormalComputed = computeNormal();",
                    "LightColor = vec4(0,0,0,0);",
                    "" ].join('\n');
            break;
        case osg.ShaderGeneratorType.FragmentInit:
            str = [ "varying vec4 LightColor;",
                    ""
                  ].join('\n');
            break;
        case osg.ShaderGeneratorType.FragmentMain:
            str = [ "",
                    "fragColor *= LightColor;"
                  ].join('\n');
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
                    "uniform bool " + this.getParameterName('enabled') + ";",
                    "uniform vec4 " + this.getParameterName('ambient') + ";",
                    "uniform vec4 " + this.getParameterName('diffuse') + ";",
                    "uniform vec4 " + this.getParameterName('specular') + ";",
                    "uniform vec3 " + this.getParameterName('direction') + ";",
                    "uniform float " + this.getParameterName('constantAttenuation') + ";",
                    "uniform float " + this.getParameterName('linearAttenuation') + ";",
                    "uniform float " + this.getParameterName('quadraticAttenuation') + ";",
                    //                    "uniform mat4 " + this.getParameterName('matrix') + ";",
                    "",
                    "" ].join('\n');
            break;
        case osg.ShaderGeneratorType.VertexMain:
            var lightNameDirection = this.getParameterName('direction');
            var lightNameDirectionTmp = this.getParameterName('directionNormalized');
            var NdotL = this.getParameterName("NdotL");
            str = [ "",
                    "//if (" + this.getParameterName('enabled') + ") {",
                    "if (true) {",
                    "  vec3 " + lightNameDirectionTmp + " = normalize(" + lightNameDirection + ");",
                    "  float " + NdotL + " = max(dot(Normal, " + lightNameDirectionTmp + "), 0.0);",
                    "  flight(" +lightNameDirectionTmp +", "+ this.getParameterName("constantAttenuation") + ", " + this.getParameterName("linearAttenuation") + ", " + this.getParameterName("quadraticAttenuation") + ", " + this.getParameterName("ambient") + ", " + this.getParameterName("diffuse") + ", " + this.getParameterName("specular") + ", NormalComputed );",
                    "}",
                    "" ].join('\n');
            break;
        }
        return str;
    }
});
