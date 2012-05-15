var ShaderNode = {};

ShaderNode.Node = function() {
    this._inputs = [];
    this._output = undefined;
    for (var i = 0, l = arguments.length; i < l; i++) {
        this._inputs.push(arguments[i]);
    }
};    

ShaderNode.Node.prototype = {
    autoConnectOutput: function(i) {
        if (i._output === undefined) {
            this.connectOutput(this);
        }
    },
    connectInput: function(input) {
        this._inputs.push(input);
    },
    connectOutput: function(i) { this._output = i;
                                 this.autoLink(i);
                               },
    getInputs: function() { return this._inputs; },
    autoLink: function(output) {
        if (output === undefined) {
            return;
        }
        output.connectInput(this);
    },
    computeFragment: function() { return undefined;},
    computeVertex: function() { return undefined;}
};

ShaderNode.Variable = function(type, prefix) {
    ShaderNode.Node.call(this);
    this._prefix = prefix;
    this._type = type;
    this._value = undefined;
};
ShaderNode.Variable.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    computeFragment: function() {
        return undefined;
    },
    getVariable: function() {
        return this._prefix;
    },
    
    setValue: function( value ) {
        this._value = value;
    },
    declare: function() {
        if (this._value !== undefined) {
            return this._type + " " + this.getVariable() + " = " + this._value +";";
        } else {
            return this._type + " " + this.getVariable() + ";";
        }
    }
});

ShaderNode.Uniform = function(type, prefix) {
    ShaderNode.Variable.call(this, type, prefix);
};
ShaderNode.Uniform.prototype = osg.objectInehrit(ShaderNode.Variable.prototype, {
    declare: function() {
        return undefined;
    },
    globalDeclaration: function() {
        return "uniform " + this._type + " " + this.getVariable() + ";";
    }
});

ShaderNode.Varying = function(type, prefix) {
    ShaderNode.Variable.call(this, type, prefix);
};
ShaderNode.Varying.prototype = osg.objectInehrit(ShaderNode.Variable.prototype, {
    declare: function() {
        return undefined;
    },
    globalDeclaration: function() {
        return "varying " + this._type + " " + this.getVariable() + ";";
    }
});


ShaderNode.BlendNode = function(mode, t) {
    ShaderNode.Node.apply(this);
    this._t = t;
    this._mode = mode;
};
ShaderNode.BlendNode.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    computeFragment: function() {
        this[this._mode]();
    },
    Mix: function() {
        this._output.set();
    }
});


ShaderNode.NormalizeNormalAndEyeVector = function() {
    ShaderNode.Node.apply(this, arguments);
};
ShaderNode.NormalizeNormalAndEyeVector.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    type: "NormalizeNormalAndEyeVector",
    connectOutputNormal: function(n) {
        this._outputNormal = n;
        this.autoLink(this._outputNormal);
    },
    connectOutputEyeVector: function(n) {
        this._outputEyeVector = n;
        this.autoLink(this._outputEyeVector);
    },
    computeFragment: function() {
        var str = [ "",
                    this._outputNormal.getVariable() + " = normalize(FragNormal);",
                    this._outputEyeVector.getVariable() + " = normalize(-FragEyeVector);"
                  ].join('\n');
        return str;
    }
});

ShaderNode.AddVector = function() {
    ShaderNode.Node.apply(this, arguments);
};
ShaderNode.AddVector.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    type: "AddVector",
    computeFragment: function() {
        str = this._output.getVariable() + " = " + this._inputs[0].getVariable();
        for (var i = 1, l = this._inputs.length; i < l; i++) {
            str += " + " + this._inputs[i].getVariable();
        }
        str += ";";
        return str;
    }
});

ShaderNode.SetAlpha = function() {
    ShaderNode.Node.apply(this,arguments);
};
ShaderNode.SetAlpha.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    type: "SetAlpha",
    computeFragment: function() {
        str = this._output.getVariable() + " = vec4(" + this._inputs[0].getVariable() + ".rgb, "+ this._inputs[1].getVariable() + ");";
        return str;
    }
});


ShaderNode.PassValue = function() {
    ShaderNode.Node.apply(this, arguments);
};
ShaderNode.PassValue.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    computeFragment: function() {
        return this._output.getVariable() + " = " + this._inputs[0].getVariable() +";";
    }
});

ShaderNode.DotVector = function() {
    ShaderNode.Node.apply(this, arguments);
};
ShaderNode.DotVector.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    computeFragment: function() {
        return this._output.getVariable() + " = dot(" + this._inputs[0].getVariable() + "," + this._inputs[1].getVariable() + ");";
    }
});

ShaderNode.MultVector = function() {
    ShaderNode.Node.apply(this, arguments);
};
ShaderNode.MultVector.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    type: "MultVector",
    computeFragment: function() {
        return this._output.getVariable() + " = " + this._inputs[0].getVariable() + " * " + this._inputs[1].getVariable() + ";";
    }
});

ShaderNode.FragColor = function() {
    ShaderNode.Node.call(this);
    this.resolved = true;
    this._prefix = "gl_FragColor";
};
ShaderNode.FragColor.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    type: "gl_FragColor",
    connectOutput: function() { /* do nothing for variable */ },
    getVariable: function() {
        return this._prefix;
    }
});



ShaderNode.ComputeDotClamped = function() {
    ShaderNode.Node.call(this);
};
ShaderNode.ComputeDotClamped.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    computeFragment: function() {
        //" float = max(dot(input0, input1), 0.0);"
        return this._output.getVariable() + " = max( dot(" + this._inputs[0].getVariable() + ", " + this._inputs[1].getVariable() + "), 0.0);";
    }
});


ShaderNode.LightNode = function() {
    ShaderNode.Node.call(this);
    var defaultVariable = new ShaderNode.Variable("vec3", "vec3(0.0,0.0,0.0)");
    for (var i = 0; i < 14; i++) {
        this.connectInput(defaultVariable);
    }
};
ShaderNode.LightNode.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    type: "LightNode",
    connectMaterialAmbient: function( i ) { this._inputs[0] = i; },
    getMaterialAmbient: function( i ) { return this._inputs[0]; },

    connectMaterialDiffuseIntensity: function( i ) { this._inputs[2] = i; },
    getMaterialDiffuseIntensity: function( i ) { return this._inputs[2]; },

    connectMaterialSpecularIntensity: function( i ) { this._inputs[3] = i; },
    getMaterialSpecularIntensity: function( i ) { return this._inputs[3]; },

    connectMaterialSpecularColor: function( i ) { this._inputs[5] = i; },
    getMaterialSpecularColor: function( i ) { return this._inputs[5]; },

    connectMaterialDiffuseColor: function( i ) { this._inputs[4] = i; },
    getMaterialDiffuseColor: function( i ) { return this._inputs[4]; },

    connectMaterialHardness: function( i ) { this._inputs[1] = i; },
    getMaterialHardness: function( i ) { return this._inputs[1]; },

    connectLightColor: function( i ) { this._inputs[6] = i; },
    getLightColor: function( i ) { return this._inputs[6]; },

    connectNormal: function( i ) { this._inputs[7] = i; },
    getNormal: function( i ) { return this._inputs[7]; },

    connectLightSpotCutoff: function( i ) { this._inputs[11] = i; },
    getLightSpotCutoff: function( i ) { return this._inputs[11]; },

    connectLightSpotBlend: function( i ) { this._inputs[13] = i; },
    getLightSpotBlend: function( i ) { return this._inputs[13]; },

    connectLightMatrix: function( i ) { this._inputs[8] = i; },
    getLightMatrix: function( i ) { return this._inputs[8]; },

    connectLightInvMatrix: function( i ) { this._inputs[9] = i; },
    getLightInvMatrix: function( i ) { return this._inputs[9]; },

    connectLightSpotDirection: function( i ) { this._inputs[10] = i; },
    getLightSpotDirection: function( i ) { return this._inputs[10]; },

    connectLightDistance: function( i ) { this._inputs[14] = i; },
    getLightDistance: function( i ) { return this._inputs[14]; },

    connectLightPosition: function( i ) { this._inputs[15] = i; },
    getLightPosition: function( i ) { return this._inputs[15]; },

    connectLightDirection: function( i ) { this._inputs[16] = i; },
    getLightDirection: function( i ) { return this._inputs[16]; },

    connectEyeVector: function( i ) { this._inputs[17] = i; },
    getEyeVector: function( i ) { return this._inputs[17]; },

    functions: function() {
        var str = [
            "float getLightAttenuation(vec3 lightDir, float constant, float linear, float quadratic) {",
            "    ",
            "    float d = length(lightDir);",
            "    float att = 1.0 / ( constant + linear*d + quadratic*d*d);",
            "    return att;",
            "}",
            "float getInvSquareAttenuation(vec3 lightDir, float distance) {",
            "    ",
            "    float d = length(lightDir);",
            "    float att = distance / ( d*d);",
            "    return att;",
            "}",
            "float getInvLinearreAttenuation(vec3 lightDir, float distance) {",
            "    ",
            "    float d = length(lightDir);",
            "    float att = distance / ( d*d);",
            "    return att;",
            "}",
            "vec3 computeLightContribution(float materialAmbient,",
            "                              vec3 materialDiffuse,",
            "                              vec3 materialSpecular,",
            "                              float materialShininess,",
            "                              vec3 lightDiffuse,",
            "                              vec3 lightSpecular,",
            "                              vec3 normal,",
            "                              vec3 eye,",
            "                              vec3 lightDirection,",
            "                              vec3 lightSpotDirection,",
            "                              float lightCosSpotCutoff,",
            "                              float lightSpotBlend,",
            "                              float lightAttenuation)",
            "{",
            "    vec3 L = lightDirection;",
            "    vec3 N = normal;",
            "    float NdotL = max(dot(L, N), 0.0);",
            "    float halfTerm = NdotL;",
            "    vec3 ambient = vec3(0.0, 0.0, 0.0);",
            "    vec3 diffuse = vec3(0.0);",
            "    vec3 specular = vec3(0.0);",
            "    float spot = 0.0;",
            "",
            "    if (NdotL > 0.0) {",
            "        vec3 E = eye;",
            "        vec3 R = reflect(-L, N);",
            "        float RdotE = max(dot(R, E), 0.0);",
            "        if ( RdotE > 0.0) {", 
            "           RdotE = pow( RdotE, materialShininess );",
            "        }",
            "        vec3 D = lightSpotDirection;",
            "        spot = 1.0;",
            "        if (lightCosSpotCutoff > 0.0) {",
            "          float cosCurAngle = dot(-L, D);",
            "          if (cosCurAngle < lightCosSpotCutoff) {",
            "             spot = 0.0;",
            "          } else {",
            "             if (lightSpotBlend > 0.0)",
            "               spot = cosCurAngle * smoothstep(0.0, 1.0, (cosCurAngle-lightCosSpotCutoff)/(lightSpotBlend));",
            "          }",
            "        }",

            "        diffuse = lightDiffuse * ((halfTerm));",
            "        specular = lightSpecular * RdotE;",
            "    }",
            "",
            "    return (materialAmbient*ambient + (materialDiffuse*diffuse + materialSpecular*specular) * spot) * lightAttenuation;",
            "}",
            "float linearrgb_to_srgb1(float c)",
            "{",
            "  float v = 0.0;",
            "  if(c < 0.0031308) {",
            "    if ( c > 0.0)",
            "      v = c * 12.92;",
            "  } else {",
            "    v = 1.055 * pow(c, 1.0/2.4) - 0.055;",
            "  }",
            "  return v;",
            "}",

            "vec4 linearrgb_to_srgb(vec4 col_from)",
            "{",
            "  vec4 col_to;",
            "  col_to.r = linearrgb_to_srgb1(col_from.r);",
            "  col_to.g = linearrgb_to_srgb1(col_from.g);",
            "  col_to.b = linearrgb_to_srgb1(col_from.b);",
            "  col_to.a = col_from.a;",
            "  return col_to;",
            "}",

            "vec3 computeLight(",
            "                       float materialAmbient,",
            "                       float materialDiffuseIntensity,",
            "                       float materialSpecularIntensity,",
            "                       vec3 materialDiffuseColor,",
            "                       vec3 materialSpecularColor,",
            "                       float materialHardness,",
            "                       vec3 lightColor,",
            "                       vec3 normal,",
            "                       vec3 eyeVector,",
            "                       float lightCosSpotCutoff,",
            "                       float lightSpotBlend,",
            "                       mat4 lightMatrix,",
            "                       vec4 lightPosition,",
            "                       mat4 lightInvMatrix,",
            "                       vec3 lightDirection,",
            "                       float lightDistance) {",
            "  vec3 lightEye = vec3(lightMatrix * lightPosition);",
            "  vec3 lightDir;",
            "  if (lightPosition[3] == 1.0) {",
            "    lightDir = lightEye - FragEyeVector;",
            "  } else {",
            "    lightDir = lightEye;",
            "  }",
            "  vec3 spotDirection = normalize(mat3(vec3(lightInvMatrix[0]), vec3(lightInvMatrix[1]), vec3(lightInvMatrix[2]))*lightDirection);",
            "  float attenuation = 1.0; //getLightAttenuation(lightDir, lightConstantAttenuation, lightLinearAttenuation, lightQuadraticAttenuation);",
            "  lightDir = normalize(lightDir);",
            "  vec3 lightDiffuse = lightColor;",
            "  vec3 lightSpecular = lightColor;",
            "  return computeLightContribution(materialAmbient, ",
            "                                  materialDiffuseColor * materialDiffuseIntensity,",
            "                                  materialSpecularColor * materialSpecularIntensity,",
            "                                  materialHardness,",
            "                                  lightDiffuse,",
            "                                  lightSpecular,",
            "                                  normal,",
            "                                  eyeVector,",
            "                                  lightDir,",
            "                                  spotDirection,",
            "                                  lightCosSpotCutoff,",
            "                                  lightSpotBlend,",
            "                                  attenuation);",

            "}"
        ].join('\n');
        return str;
    },
    
    computeFragment: function() {
        var str = "";

        var lightColor = this._output.getVariable();
        str += lightColor + " = computeLight(" + this.getMaterialAmbient().getVariable() +",\n";
        str += "   " + this.getMaterialDiffuseIntensity().getVariable() + ",\n";
        str += "   " + this.getMaterialSpecularIntensity().getVariable() +",\n";
        str += "   " + this.getMaterialDiffuseColor().getVariable() + ",\n";
        str += "   " + this.getMaterialSpecularColor().getVariable() + ",\n";
        str += "   " + this.getMaterialHardness().getVariable() + ",\n";
        str += "   " + this.getLightColor().getVariable() + ",\n";
        str += "   " + this.getNormal().getVariable() + ",\n";
        str += "   " + this.getEyeVector().getVariable() + ",\n";
        str += "   " + this.getLightSpotCutoff().getVariable() + ",\n";
        str += "   " + this.getLightSpotBlend().getVariable() + ",\n";
        str += "   " + this.getLightMatrix().getVariable() + ",\n";
        str += "   " + this.getLightPosition().getVariable() + ",\n";
        str += "   " + this.getLightInvMatrix().getVariable() + ",\n";
        str += "   " + this.getLightDirection().getVariable() + ",\n";
        str += "   " + this.getLightDistance().getVariable() + ");\n";

        return str;
    }
});

ShaderNode.ShaderContext = function(state, attributes, textureAttributes) {
    this._state = state;
    this._variables = {};
    this._vertexShader = [];
    this._fragmentShader = [];

    var lights = [];
    var material;
    var textures = [];
    for (var i = 0, l = attributes.length; i < l; i++) {
        var type = attributes[i].getType();
        if (type === "BlenderLight") {
            lights.push(attributes[i]);
        } else if (type === "BlenderMaterial") {
            material = attributes[i];
        } else {
            osg.warn("ShaderContext, dont know type " + type );
        }
    }

    for (var j = 0, jl = textureAttributes.length; j < jl; j++) {
        var tu = textureAttributes[j];
        for (var t = 0, tl = tu.length; t < tl; t++) {
            var ttype = tu[t].getType();
            if (ttype === "BlenderTextureMaterial") {
                textures.push(tu[t]);
            }
        }
    }

    this._lights = lights;
    this._material = material;
    this._textures = textures;
};

ShaderNode.ShaderContext.prototype = {
    getVariable: function(name) {
        return this._variables[name];
    },
    Variable: function(type, varname) {
        var name = varname;
        if (name === undefined) {
            var len = Object.keys(this._variables).length;
            name = "tmp_"+ len;
        }
        var v = new ShaderNode.Variable(type, name);
        this._variables[name] = v;
        return v;
    },

    Uniform: function(type, varname) {
        var name = varname;
        if (name === undefined) {
            var len = Object.keys(this._variables).length;
            name = "tmp_"+ len;
        }
        var v = new ShaderNode.Uniform(type, name);
        this._variables[name] = v;
        return v;
    },

    Varying: function(type, varname) {
        var name = varname;
        if (name === undefined) {
            var len = Object.keys(this._variables).length;
            name = "tmp_"+ len;
        }
        var v = new ShaderNode.Varying(type, name);
        this._variables[name] = v;
        return v;
    },

    createFragmentShaderGraph: function()
    {
        var lights = this._lights;
        var material = this._material;
        var textures = this._textures;

        var uniforms = material.getOrCreateUniforms();
        var keys = Object.keys(uniforms);
        for (var m = 0, ml = keys.length; m < ml; m++) {
            var kk = keys[m];
            if (kk === "uniformKeys") {
                continue;
            }

            var kkey = uniforms[kk];
            var varUniform = this.Uniform(kkey.type, kkey.name);
        }
        var materialAmbient = this.getVariable(uniforms.ambientFactor.name);
        var materialDiffuseColor = this.getVariable(uniforms.diffuseColor.name);
        var materialSpecularColor = this.getVariable(uniforms.specularColor.name);
        var materialDiffuseIntensity = this.getVariable(uniforms.diffuseIntensity.name);
        var materialSpecularIntensity = this.getVariable(uniforms.specularIntensity.name);
        var materialHardness = this.getVariable(uniforms.hardness.name);
        var materialTranslucency = this.getVariable(uniforms.translucency.name);

        var inputNormal = this.Varying("vec3", "FragNormal");
        var normal = this.Variable("vec3", "normal");
        var eyeVector = this.Variable("vec3", "eyeVector");

        var normalizeNormalAndVector = new ShaderNode.NormalizeNormalAndEyeVector();
        normalizeNormalAndVector.connectOutputNormal(normal);
        normalizeNormalAndVector.connectOutputEyeVector(eyeVector);
        //normal.connectInput(normalizeNormalAndVector);
        //eyeVector.connectInput(normalizeNormalAndVector);

        var lightColorAccumulator = this.Variable("vec3","light_accumulator");

        for (var t = 0, tl = textures.length; t < tl; t++) {
            var texture = textures[t];
            
        }

        var addLightContribution;
        if (lights.length > 0) {
            addLightContribution = new ShaderNode.AddVector();
            addLightContribution.connectOutput(lightColorAccumulator);

            //lightColorAccumulator.connectInput(addLightContribution);
        }

        for (var i = 0, l = lights.length; i < l; i++) {
            var light = lights[i];
            var uniforms = light.getOrCreateUniforms();
            var keys = Object.keys(uniforms);
            for (var u = 0, ul = keys.length; u < ul; u++) {
                var k = keys[u];
                if (k === "uniformKeys") {
                    continue;
                }

                var key = uniforms[k];
                var varUniform = this.Uniform(key.type, key.name);
            }

            var lightPosition = this.getVariable(uniforms.position.name);
            var lightMatrix = this.getVariable(uniforms.matrix.name);
            var lightDirection = this.getVariable(uniforms.direction.name);
            var lightInvMatrix = this.getVariable(uniforms.invMatrix.name);


            //var lightAttenuation = this.getVariable(uniforms.attenuation.name);


            var lightDistance = this.getVariable(uniforms.distance.name);
            //var lightDiffuse = this.getVariable(uniforms.diffuse.name);
            //var lightSpecular = this.getVariable(uniforms.specular.name);
            var lightSpotCuffoff = this.getVariable(uniforms.spotCutoff.name);
            var lightSpotBlend = this.getVariable(uniforms.spotBlend.name);
            var lightColor = this.getVariable(uniforms.color.name);


            //var lightColor = this.Variable("vec3");
            var lightResult = this.Variable("vec3");
            var lightVector = this.Variable("vec3");

            var lightContribution = new ShaderNode.LightNode();
            lightContribution.connectMaterialAmbient(materialAmbient);
            lightContribution.connectMaterialDiffuseIntensity(materialDiffuseIntensity);
            lightContribution.connectMaterialSpecularIntensity(materialSpecularIntensity);
            lightContribution.connectMaterialSpecularColor(materialSpecularColor);
            lightContribution.connectMaterialDiffuseColor(materialDiffuseColor);
            lightContribution.connectMaterialHardness(materialHardness);

            lightContribution.connectLightColor(lightColor);
            lightContribution.connectNormal(normal);
            lightContribution.connectEyeVector(eyeVector);
            lightContribution.connectLightSpotCutoff(lightSpotCuffoff);
            lightContribution.connectLightSpotBlend(lightSpotBlend);
            lightContribution.connectLightMatrix(lightMatrix);
            lightContribution.connectLightPosition(lightPosition);
            lightContribution.connectLightMatrix(lightMatrix);
            lightContribution.connectLightInvMatrix(lightInvMatrix);
            lightContribution.connectLightDirection(lightDirection);
            //lightContribution.connectLightAttenuation(lightAttenuation);
            lightContribution.connectLightDistance(lightDistance);

            lightContribution.connectOutput(lightResult);
            //lightResult.connectInput(lightContribution);

            addLightContribution.connectInput(lightResult);
        }

        var fragColor = new ShaderNode.FragColor();
        //var 
        //setTransluency
        var translucencyOperator = new ShaderNode.SetAlpha(lightColorAccumulator, materialTranslucency);
        var colorTranslucency = this.Variable("vec4");
        translucencyOperator.connectOutput(colorTranslucency);
        //colorTranslucency.connectInput(translucencyOperator);

        var operatorAssign = new ShaderNode.PassValue();
        operatorAssign.connectOutput(fragColor);
        //fragColor.connectInput(operatorAssign);

        if (lights.length > 0) {
            operatorAssign.connectInput(colorTranslucency);
        } else {
            var debugColor = this.Variable("vec4");
            debugColor.setValue("vec4(1.0, 0.0, 1.0, 1.0)");
            operatorAssign.connectInput(debugColor);
        }

        return fragColor;
    },

    evaluate: function(node) {
        for (var i = 0, l = node.getInputs().length; i < l; i++) {
            var child = node.getInputs()[i];
            if (child !== undefined && child.resolved === undefined &&
               child !== node) {
                child.resolved = true;
                this.evaluate(child);
            }
        }
        var c = node.computeFragment();
        if (c !== undefined) {
            this._fragmentShader.push(c);
        }
    },

    createVertexShaderGraph: function() {
        var lights = this._lights;
        var material = this._material;
        var textures = this._textures;

        this._vertexShader.push([ "",
                          "#ifdef GL_ES",
                          "precision highp float;",
                          "#endif",
                          "attribute vec3 Vertex;",
                          "attribute vec4 Color;",
                          "attribute vec3 Normal;",
                          "uniform int ArrayColorEnabled;",
                          "uniform mat4 ModelViewMatrix;",
                          "uniform mat4 ProjectionMatrix;",
                          "uniform mat4 NormalMatrix;",
                          "varying vec4 VertexColor;",
                          "varying vec3 FragNormal;",
                          "varying vec3 FragEyeVector;",
                          "",
                          "" ].join('\n'));

        for ( var t = 0, tl = textures.length; t < tl; t++) {
            var texture = textures[t];
            if (texture !== undefined) {
                this._vertexShader.push("attribute vec2 TexCoord" + t +";");
                this._vertexShader.push("varying vec2 FragTexCoord" + t +";");
            }
        }

        this._vertexShader.push("void main() {");
        this._vertexShader.push("  FragNormal = vec3(NormalMatrix * vec4(Normal, 0.0));");
        this._vertexShader.push("  FragEyeVector = vec3(ModelViewMatrix * vec4(Vertex,1.0));");
        this._vertexShader.push("  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);");
        this._vertexShader.push([ "",
                          "  if (ArrayColorEnabled == 1)",
                          "    VertexColor = Color;",
                          "  else",
                          "    VertexColor = vec4(1.0,1.0,1.0,1.0);",
                          ""
                        ].join('\n'));
        for ( var t = 0, tl = textures.length; t < tl; t++) {
            this._vertexShader.push("FragTexCoord" + t +" = TexCoord" + t + ";");
        }
        this._vertexShader.push("}");
    },

    createVertexShader: function() {
        var root = this.createVertexShaderGraph();
        osg.log("Vertex Shader");
        var shader = this._vertexShader.join('\n');
        osg.log(shader);
        return shader;
    },

    createFragmentShader: function() {
        var lights = this._lights;
        var material = this._material;
        var textures = this._textures;
        var root = this.createFragmentShaderGraph();

        this._fragmentShader.push( [ "",
                                     "#ifdef GL_ES",
                                     "precision highp float;",
                                     "#endif",
                                     "varying vec4 VertexColor;",
                                     "varying vec3 FragEyeVector;",
                                     ""].join('\n'));

        for ( var t = 0, tl = textures.length; t < tl; t++) {
            var texture = textures[t];
            if (texture !== undefined) {
                this._fragmentShader.push("varying vec2 FragTexCoord" + t +";");
                this._fragmentShader.push("uniform sampler2D Texture" + t +";");
            }
        }

        var vars = Object.keys(this._variables);
        for (var i = 0, l = vars.length; i < l; i++) {
            if (this._variables[vars[i]].globalDeclaration !== undefined) {
                var v = this._variables[vars[i]].globalDeclaration();
                if (v !== undefined) {
                    this._fragmentShader.push(v);
                }
            }
        }

        if (lights.length > 0) {
            this._fragmentShader.push(ShaderNode.LightNode.prototype.functions());
        }

        this._fragmentShader.push("void main() {");

        for (var j = 0, jl = vars.length; j < jl; j++) {
            var d = this._variables[vars[j]].declare();
            if (d !== undefined) {
                this._fragmentShader.push(this._variables[vars[j]].declare());
            }
        }
        this.evaluate(root);

        this._fragmentShader.push("}");
        osg.log("Fragment Shader");
        var shader = this._fragmentShader.join('\n');
        osg.log(shader);
        return shader;
    }
};



osg.BlenderLight = function(lightNumber) {
    osg.StateAttribute.call(this);

    if (lightNumber === undefined) {
        lightNumber = 0;
    }

    this._color = [ 0.8, 0.8, 0.8 ];
    this._affectSpecular = true;
    this._affectDiffuse = true;
    this._position = [ 0.0, 0.0, 1.0, 0.0 ];
    this._direction = [ 0.0, 0.0, -1.0 ];
    this._spotCutoff = 180.0;
    this._spotBlend = 0.01;
    this._attenuationType = "InvSquare";
    this._distance = 10;
    this._lightUnit = lightNumber;
    this._enabled = 0;
    this.dirty();
};


/** @lends osg.Light.prototype */
osg.BlenderLight.uniforms = {};
osg.BlenderLight.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "BlenderLight",
    cloneType: function() {return new osg.Light(this._lightUnit); },
    getType: function() { return this.attributeType; },
    getTypeMember: function() { return this.attributeType + this._lightUnit;},
    getUniformName: function (name) { return this.getPrefix()+ "_uniform_" + name; },
    getHash: function() {
        return "BlenderLight"+this._lightUnit + this._attenuationType;
    },
    getOrCreateUniforms: function() {

        var obj = osg.BlenderLight;
        var Uniforms = osg.Uniform;
        var typeMember = this.getTypeMember();
        if (obj.uniforms[typeMember] === undefined) {
            uniformList = {
                "color": 'createFloat3',
                "position": 'createFloat4',
                "direction":'createFloat3',
                "spotCutoff":'createFloat1',
                "spotBlend":'createFloat1',
                "matrix": 'createMat4',
                "invMatrix": 'createMat4',
                "distance": 'createFloat1' };
            var keys = Object.keys(uniformList);
            var uniforms = {};
            for ( var i = 0; i < keys.length; i++) {
                var k = keys[i];
                var type = uniformList[k];
                var func = Uniforms[type];
                uniforms[ k ] = func(this.getUniformName(k));
            }
            uniforms.uniformKeys = keys;
            obj.uniforms[typeMember] = uniforms;
        }
        return obj.uniforms[typeMember];
    },

    setPosition: function(pos) { osg.Vec4.copy(pos, this._position); },
    setColor: function(a) { this._color = a; this.dirty(); },
    setSpotCutoff: function(a) { this._spotCutoff = a; this.dirty(); },
    setSpotBlend: function(a) { this._spotBlend = a; this.dirty(); },

    setAttenuationType: function(value) { this._attenuation = value;
                                          this.dirty();},
    getAttenuationType: function() { return this._attenuation; },
    setDistance: function(value) { this._distance = value; this.dirty();},

    setDirection: function(a) { this._direction = a; this.dirty(); },
    setLightNumber: function(unit) { this._lightUnit = unit; this.dirty(); },
    getLightNumber: function() { return this._lightUnit; },

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

        light.color.set(this._color);
        light.position.set(this._position);
        light.direction.set(this._direction);

        var spotsize = Math.cos(this._spotCutoff*Math.PI/180.0);
        light.spotCutoff.get()[0] = spotsize;
        light.spotCutoff.dirty();

        light.spotBlend.get()[0] = (1.0 - spotsize)*this._spotBlend;
        light.spotBlend.dirty();

        light.distance.get()[0] = this._distance;
        light.distance.dirty();

        //light._enable.set([this.enable]);

        this.setDirty(false);
    }
});


osg.BlenderMaterial = function() {
    osg.StateAttribute.call(this);

    this._diffuseColor = [ 0,0,0];
    this._diffuseIntensity = 1.0;

    this._specularColor = [ 0,0,0];
    this._specularIntensity = 1.0;

    this._emission = 0.0;
    this._translucency = 0.0;
    this._hardness = 12.5;

    this._shadeless = 0;

    this._ambient = 0.0;
};

osg.BlenderMaterial.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "BlenderMaterial",
    getHash: function() {
        return this.attributeType;
    },
    setDiffuseColor: function(color) { osg.Vec3.copy(color, this._diffuseColor); },
    setSpecularColor: function(color) { osg.Vec3.copy(color, this._specularColor); },
    setDiffuseIntensity: function(i) { this._diffuseIntensity = i ;},
    setSpecularIntensity: function(i) { this._specularIntensity = i ;},
    setEmission: function(i) { this._emission = i; },
    setHardness: function(i) { this._hardness = i; },
    setAmbient: function(i) { this._ambient = i; },
    setTranslucency: function(i) { this._translucency = i; },
    setShadeless: function(i) { this._shadeless = i; },
    getTranslucency: function(i) { return this._translucency; },

    cloneType: function() {return new osg.BlenderMaterial(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    getParameterName: function (name) { return this.getType()+ "_uniform_" + name; },

    getOrCreateUniforms: function() {
        var obj = osg.BlenderMaterial;
        var Uniforms = osg.Uniform;
        if (obj.uniforms === undefined) {
            uniformList = {
                "ambientFactor": 'createFloat1',
                "diffuseColor": 'createFloat3',
                "specularColor": 'createFloat3',
                "emission": 'createFloat1',
                "diffuseIntensity": 'createFloat1',
                "specularIntensity": 'createFloat1',
                "translucency": 'createFloat1',
                "hardness": 'createFloat1',
                "shadeless": 'createFloat1' };
            var keys = Object.keys(uniformList);
            var uniforms = {};
            for ( var i = 0; i < keys.length; i++) {
                var k = keys[i];
                var type = uniformList[k];
                var func = Uniforms[type];
                uniforms[ k ] = func(this.getParameterName(k));
            }
            uniforms.uniformKeys = keys;
            obj.uniforms = uniforms;
        }
        return obj.uniforms;
    },

    apply: function(state)
    {
        var uniforms = this.getOrCreateUniforms();
        uniforms.ambientFactor.set(this._ambient);
        uniforms.diffuseColor.set(this._diffuseColor);
        uniforms.specularColor.set(this._specularColor);
        uniforms.emission.set(this._emission);
        uniforms.diffuseIntensity.set(this._diffuseIntensity);
        uniforms.specularIntensity.set(this._specularIntensity);
        uniforms.translucency.set(1.0-this._translucency);
        uniforms.hardness.set(this._hardness);
        uniforms.shadeless.set(this._shadeless);
        this.setDirty(false);
    }

});

osg.BlenderTextureMaterial = function(texture) {
    this._texture = texture;
    this._channels = {};
    for (var i = 1; i < arguments.length; i++) {
        var channel = arguments[i];
        this._channels[channel] = channel;
    }
    this._blendMode = "Mix";
};
osg.BlenderTextureMaterial.uniforms = [];
osg.BlenderTextureMaterial.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "BlenderTextureMaterial",
    cloneType: function() { var t = new osg.BlenderTextureMaterial(); return t;},
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType; },
    getChannels: function() { return this._channels; },
    setChannels: function(channels) { this._channels = channels; },

    getOrCreateUniforms: function(unit) {
        var obj = osg.BlenderTextureMaterial.uniforms;
        if (obj[unit] === undefined) {
            var textureUniform = this._texture.getOrCreateUniforms(unit);
            var uniforms = textureUniform;
            obj[unit] = uniforms;
        }
        return obj[unit];
    },

    apply: function(state) {
        if (this._texture !== undefined) {
            this._texture.apply(state);
        }
    },

    getHash: function() {
        var hash = this.attributeType;
        var keys = Object.keys(this._channels);
        for (var i = 0, l = keys.length; i < l; i++) {
            hash += keys[i];
        }
        return hash;
    }
});


osg.BlenderShaderGenerator = function() {
    this._cache = {};
    this._attributeSupported = {};
    this._attributeSupported[osg.BlenderMaterial.prototype.attributeType] = true;
    this._attributeSupported[osg.BlenderTextureMaterial.prototype.attributeType] = true;
    this._attributeSupported[osg.BlenderLight.prototype.attributeType] = true;
};
osg.BlenderShaderGenerator.prototype = {

    getActiveAttributeList: function(state, list) {
        var hash = "";
        var attributeMap = state.attributeMap;
        for (var j = 0, k = attributeMap.attributeKeys.length; j < k; j++) {
            var keya = attributeMap.attributeKeys[j];
            var attributeStack = attributeMap[keya];
            var attr = attributeStack.lastApplied;
            var type = attr.getType();
            if (this._attributeSupported[type] === undefined) {
                continue;
            }
            hash += attr.getHash();
            list.push(attr);
        }
        return hash;
    },

    getActiveTextureAttributeList: function(state, list) {
        var hash = "";
        var attributeMap = state.textureAttributeMapList;
        for (var i = 0, l = attributeMap.length; i < l; i++) {
            var attributesForUnit = attributeMap[i];
            if (attributesForUnit === undefined) {
                continue;
            }
            list[i] = [];
            for (var j = 0, m = attributesForUnit.attributeKeys.length; j < m; j++) {
                var key = attributesForUnit.attributeKeys[j];
                if (this._attributeSupported[key] === undefined) {
                    continue;
                }

                var attributeStack = attributesForUnit[key];
                if (attributeStack.length === 0) {
                    continue;
                }
                var attr = attributeStack.lastApplied;
                hash += attr.getHash();
                list[i].push(attr);
            }
        }
        return hash;
    },

    getActiveUniforms: function(state, attributeList, textureAttributeList) {
        var uniforms = {};

        for (var i = 0, l = attributeList.length; i < l; i++) {
            var at = attributeList[i];
            var attributeUniforms = at.getOrCreateUniforms();
            for (var j = 0, m = attributeUniforms.uniformKeys.length; j < m; j++) {
                var name = attributeUniforms.uniformKeys[j];
                var uniform = attributeUniforms[name];
                uniforms[uniform.name] = uniform;
            }
        }

        for (var a = 0, n = textureAttributeList.length; a < n; a++) {
            var tat = textureAttributeList[a];
            for (var b = 0, o = tat.length; b < o; b++) {
                var attr = tat[b];
                var texUniforms = attr.getOrCreateUniforms(a);
                for (var t = 0, tl = texUniforms.uniformKeys.length; t < tl; t++) {
                    var tname = texUniforms.uniformKeys[t];
                    var tuniform = texUniforms[tname];
                    uniforms[tuniform.name] = tuniform;
                }
            }
        }

        var keys = Object.keys(uniforms);
        uniforms.uniformKeys = keys;
        return uniforms;
    },

    getOrCreateProgram: function(state) {

        // extract valid attributes
        var hash = "";
        var attributes = [];
        var textureAttributes = [];
        hash += this.getActiveAttributeList(state, attributes);
        hash += this.getActiveTextureAttributeList(state, textureAttributes);

        if (this._cache[hash] !== undefined) {
            return this._cache[hash];
        }

        var shaderGen = new ShaderNode.ShaderContext(state, attributes, textureAttributes);
        var vertexshader = shaderGen.createVertexShader();
        var fragmentshader = shaderGen.createFragmentShader();

        var program = new osg.Program(
            new osg.Shader(gl.VERTEX_SHADER, vertexshader),
            new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));

        program.hash = hash;
        program.activeUniforms = this.getActiveUniforms(state, attributes, textureAttributes);
        program.generated = true;

        osg.log(program.vertex.text);
        osg.log(program.fragment.text);

        this._cache[hash] = program;
        return program;
    }


};


if (false) {
    var geom = osg.createTexturedBoxGeometry(0,0,0, 2, 2, 2);

    var material = new osg.BlenderMaterial([1,0,1],
                                           0.5,
                                           [0.4,0.4,0.4],
                                           0.68);
    var texture0 = new osg.BlenderMaterialTexture(new osg.Texture(), 'DiffuseColor', 'DiffuseIntensity');
    var texture1 = new osg.BlenderMaterialTexture(new osg.Texture(),'DiffuseColor');
    var texture2 = new osg.BlenderMaterialTexture(new osg.Texture(),'SpecularColor');
    var texture3 = new osg.BlenderMaterialTexture(new osg.Texture(),'DiffuseColor');
    var texture3 = new osg.BlenderMaterialTexture(new osg.TextureBlend());
    var stateSet = new osg.StateSet();
    stateSet.setTextureAttributeAndModes(0, texture0);
    stateSet.setTextureAttributeAndModes(1, texture1);
    stateSet.setTextureAttributeAndModes(2, texture2);
    stateSet.setTextureAttributeAndModes(3, texture3);
    stateSet.setAttributeAndModes(material);




    stateSet.setShaderProfile(osg.Shader.Profile.Blender);
}


// profile must describe how to get the tree
//L*texture3*texture1 + H*texture2

test("osg.ShaderNode", function() {

    (function() {
        var state = {};
        var attributes = [];
        var textures = [[], []];
        attributes.push(new osg.BlenderLight(0));
        attributes.push(new osg.BlenderLight(1));
        attributes.push(new osg.BlenderMaterial());
        textures[0].push(new osg.BlenderTextureMaterial());
        textures[1].push(new osg.BlenderTextureMaterial());
        
        var shaderContext = new ShaderNode.ShaderContext(state, attributes, textures);
        shaderContext.createVertexShader();
        shaderContext.createFragmentShader();
    })();

    (function() {
        var canvas = createCanvas();
        var viewer = new osgViewer.Viewer(canvas);
        viewer.init();

        var state = viewer.getState();
        state.setGraphicContext(createFakeRenderer());

        var l0 = new osg.BlenderLight(0);
        var l1 = new osg.BlenderLight(1);

        var node0 = new osg.LightSource();
        node0.setLight(l0);
        var node1 = new osg.LightSource();
        node1.setLight(l1);
        var root = new osg.Node();

        var geom = osg.createTexturedBoxGeometry(0,0,0, 2, 2, 2);

        root.addChild(node0);
        root.addChild(node1);
        root.addChild(geom);
        

        var material = new osg.BlenderMaterial();
        material.setDiffuseColor([1,0,1]);
        material.setDiffuseIntensity(0.5);
        material.setSpecularColor([0.4,0.4,0.4]);
        material.setDiffuseIntensity(0.68);

        var texture0 = new osg.BlenderTextureMaterial(new osg.Texture(), 'DiffuseColor', 'DiffuseIntensity');
        var texture1 = new osg.BlenderTextureMaterial(new osg.Texture(),'DiffuseColor');
        var texture2 = new osg.BlenderTextureMaterial(new osg.Texture(),'SpecularColor');
        var texture3 = new osg.BlenderTextureMaterial(new osg.Texture(),'DiffuseColor');

        var stateSet = new osg.StateSet();
        stateSet.setTextureAttributeAndModes(0, texture0);
        stateSet.setTextureAttributeAndModes(1, texture1);
        stateSet.setTextureAttributeAndModes(2, texture2);
        stateSet.setTextureAttributeAndModes(3, texture3);
        stateSet.setAttributeAndModes(material);

        stateSet.setShaderGenerator(new osg.BlenderShaderGenerator());
        geom.setStateSet(stateSet);

        viewer.setSceneData(root);
        viewer.frame();
        
//        var shaderContext = new ShaderNode.ShaderContext(state, attributes, textures);
//        shaderContext.createVertexShader();
//        shaderContext.createFragmentShader();
    })();
    
});

