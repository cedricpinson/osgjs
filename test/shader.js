var ShaderNode = {};

ShaderNode.Node = function() {
    this._input0 = undefined;
    this._input1 = undefined;
    this._output = undefined;
};    

ShaderNode.Node.prototype = {
    connectInput0: function(i) { this._input0 = i;},
    connectInput1: function(i) { this._input1 = i;},
    connectOutput: function(i) { this._output = i;}
};

ShaderNode.BlendNode = function(mode, t) {
    ShaderNode.Node.call(this);
    this._t = t;
    this._mode = mode;
};
ShaderNode.BlendNode.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    compute: function() {
        this[this._mode]();
    },
    Mix: function() {
        this._output.set();
    }
});

ShaderNode.AddVector = function() {
    ShaderNode.Node.call(this);
};
ShaderNode.AddVector.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    compute: function() {
        return this._output.getVariable() + " = " + this._input0.getVariable() + " + " + this._input1.getVariable() + ";";
    }
});

ShaderNode.DotVector = function() {
    ShaderNode.Node.call(this);
};
ShaderNode.DotVector.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    compute: function() {
        return this._output.getVariable() + " = dot(" + this._input0.getVariable() + "," + this._input1.getVariable() + ");";
    }
});

ShaderNode.MultVector = function() {
    ShaderNode.Node.call(this);
};
ShaderNode.MultVector.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    compute: function() {
        return this._output.getVariable() + " = " + this._input0.getVariable() + " * " + this._input1.getVariable() + ";";
    }
});

ShaderNode.FragOutput = function() {
    this.getVariable = function() {
        return "gl_FragColor";
    };
};

ShaderNode.ComputeDotClamped = function() {
    ShaderNode.Node.call(this);
};
ShaderNode.ComputeDotClamped.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    compute: function() {
        //" float = max(dot(input0, input1), 0.0);"
        return this._output.getVariable() + " = max( dot(" + this._input0.getVariable() + ", " + this._input1.getVariable() + "), 0.0);";
    }
});


ShaderNode.LightNode = function() {
    ShaderNode.Node.call(this);
};
ShaderNode.LightNode.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    setMaterialAmbient: function( i ) { this._materialAmbientFactor = i; },
    setMaterialHardness: function( i ) { this._materialHardness = i; },
    setMaterialDiffuseIntensity: function( i ) { this._materialDiffuseIntensity = i; },
    setMaterialSpecularIntensity: function( i ) { this._materialSpecularIntensity = i; },
    setMaterialDiffuseColor: function( i ) { this._materialDiffuseColor = i; },
    setMaterialSpecularColor: function( i ) { this._materialSpecularColor = i; },
    setLightColor: function( i ) { this._lightColor = i; },

    compute: function() {
        var lightColor = this.getTmpVec3();
        var str = lightColor + " = computeLightContribution(" + this._materialAmbientFactor +",\n";
        str += "                                         " + this._materialHardness + ",\n";
        str += "                                         " + this._materialDiffuseIntensity + ",\n";
        str += "                                         " + this._materialSpecularIntensity +"\n,";
        str += "                                         " + this._materialSpecularColor + "\n,";
        str += "                                         " + this._materialDiffuseColor + "\n,";
        str += "                                         " + this._lightColor + "\n,";
        str += "                                         " + this._normal + "\n,";
        str += "                                         " + this._eye + "\n,";
        str += "                                         " + this._lightDir + "\n,";
        str += "                                         " + this._spotDirection + "\n,";
        str += "                                         " + this._spotCutoff + "\n,";
        str += "                                         " + this._attenuation + "\n,";
        str += "                                         " + this._spotBlend + ");\n,";

        return str;
    }
});

var createShaderGraph = function(lights, material, textures)
{
    var normal = ShaderNode.Vec3();
    var eyeVector = ShaderNode.Vec3();

    var materialDiffuseColor = ShaderNode.Vec3();
    var materialSpecularColor = ShaderNode.Vec3();

    var lightColorAccumulator = ShaderNode.Vec3();

    for (var t = 0, m = textures.length; t < m; t++) {
        var texture = textures[t];
        
    }
    
    for (var i = 0, l = lights.length; i < l; i++) {
        var lightColor = ShaderNode.Vec3();
        var lightVector = ShaderNode.Vec3();

        var lightContribution = ShaderNode.LightNode();
        lightContribution.setMaterialSpecularColor(materialSpecularColor);
        lightContribution.setMaterialDiffuseColor(materialDiffuseColor);
        lightContribution.setLightColor(lightColor);
        lightContribution.setNormal(normal);
        lightContribution.setLightVector(lightVector);
        lightContribution.setEyeVector(eyeVector);

        var lightAdd = ShaderNode.AddVector();
        lightAdd.connectOutput(lightColorAccumulator);
        lightAdd.connectInput0(lightColorAccumulator);
        lightAdd.connectInput1(lightContribution);
    }
};

var createShaderNodeDetail = function()
{
    var normal = ShaderNode.Vec3();
    var light = ShaderNode.Vec3();

    var lightColor = ShaderNode.Vec3();
    var materialDiffuseColor = ShaderNode.Vec3();

    // diffuse = max(L*N,0.0) * LightDiffuseColor * MaterialDiffusecolor
    var createDiffuseGraph = function(normal, lightNormal, lightColor, materialColor) {
        // diffuseIntensity = max(L*N,0.0)
        var diffuseIntensity = ShaderNode.ComputeDotClamped();
        diffuseIntensity.connectInput0(normal);
        diffuseIntensity.connectInput1(light);

        // diffuseColor = LightDiffuseColor * MaterialDiffusecolor
        var diffuseColor = ShaderNode.MultVector();
        diffuseColor.connectInput0(diffuseColor);
        diffuseColor.connectInput1(lightColor);

        // diffuse = max(L*N,0.0) * LightDiffuseColor * MaterialDiffusecolor
        var diffuse = ShaderNode.MultVector();
        diffuse.connectInput0(diffuseIntensity);
        diffuse.connectInput1(diffuseColor);
        return diffuse;
    };


    // spec = max(L*N,0.0) * LightDiffuseColor * MaterialDiffusecolor
    var createSpecularGraph = function(normal, lightNormal, eyeVector, lightColor, materialColor) {

        // intensity = max(dot(R, E), 0.0)
        var diffuseIntensity = ShaderNode.ComputeDotClamped();
        diffuseIntensity.connectInput0(reflection);
        diffuseIntensity.connectInput1(eye);

        // diffuseColor = LightDiffuseColor * MaterialDiffusecolor
        var diffuseColor = ShaderNode.MultVector();
        diffuseColor.connectInput0(diffuseColor);
        diffuseColor.connectInput1(lightColor);

        // diffuse = max(L*N,0.0) * LightDiffuseColor * MaterialDiffusecolor
        var diffuse = ShaderNode.MultVector();
        diffuse.connectInput0(diffuseIntensity);
        diffuse.connectInput1(diffuseColor);
        return diffuse;
    };

    var diffuse_specular = ShaderNode.Vec4();
    var output = ShaderNode.FragOutput();

    // vec4 result = diffuse + specular
    var diff_spec = ShaderNode.AddVector();
    diff_spec.connectOutput(diffuse_specular);
    diff_spec.connectInput0(diffuse);
    diff_spec.connectInput1(specular);

    
};



var BlenderMaterial = function() {
    osg.StateAttribute.call(this);

    this._diffuseColor = [ 0,0,0];
    this._diffuseIntensity = 1.0;

    this._specularColor = [ 0,0,0];
    this._specularIntensity = 1.0;

    this._emission = 0.0;
    this._translucency = 0.0;
    this._hardness = 12.5;

    this._shadeless = 0;

    this._ambient = 1.0;
};

osg.BlenderMaterial.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "BlenderMaterial",
    setDiffuseColor: function(color) { osg.Vec3.copy(this._diffuseColor, color); },
    setSpecularColor: function(color) { osg.Vec3.copy(this._specularColor, color); },
    setDiffuseIntensity: function(i) { this._diffuseIntensity = i ;},
    setSpecularIntensity: function(i) { this._specularIntensity = i ;},
    setEmission: function(i) { this._emission = i; },
    setHardness: function(i) { this._hardness = i; },
    setAmbient: function(i) { this._ambient = i; },
    setTranslucency: function(i) { this._translucency = i; },
    setShadeless: function(i) { this._shadeless = i; },

    cloneType: function() {return new osg.BlenderMaterial(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},

    getOrCreateUniforms: function() {
        var obj = osg.BlenderMaterial;
        var Uniforms = osg.Uniform;
        if (obj.uniforms === undefined) {
            uniformList = {
                "MaterialAmbientFactor": createFloat1,
                "MaterialDiffuseColor": createFloat3,
                "MaterialSpecularColor": createFloat3,
                "MaterialEmission": createFloat1,
                "MaterialDiffuseIntensity":createFloat1,
                "MaterialSpecularIntensity":createFloat1,
                "MaterialTranslucency":createFloat1,
                "MaterialHardness":createFloat1,
                "MaterialShadeless":createFloat1 };
            var keys = Object.keys(uniformList);
            var uniforms = {};
            for ( var i = 0; i < keys.length; i++) {
                var k = keys[i];
                uniforms[ k ] = Uniforms[k](k);
            }
            uniforms.uniformKeys = keys;
            obj.uniforms = uniforms;
        }
        return obj.uniforms;
    },

    apply: function(state)
    {
        var uniforms = this.getOrCreateUniforms();
        uniforms.MaterialAmbientFactor.set(this._ambient);
        uniforms.MaterialDiffuseColor.set(this._diffuseColor);
        uniforms.MaterialSpecularColor.set(this._specularColor);
        uniforms.MaterialEmission.set(this._emission);
        uniforms.MaterialDiffuseIntensity.set(this._diffuseIntensity);
        uniforms.MaterialSpecularIntensity.set(this._specularIntensity);
        uniforms.MaterialTranslucency.set(this._translucency);
        uniforms.MaterialHardness.set(this._hardness);
        uniforms.MaterialShadeless.set(this._shadeless);
        this.setDirty(false);
    }

});

var BlenderMaterialTexture = function(texture) {
    this._texture = texture;
    this._channels = {};
    for (var i = 1; i < arguments.length; i++) {
        var channel = arguments[i];
        this._channels[channel] = channel;
    }
    this._blendMode = "Mix";
};
osg.BlenderMaterialTexture.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "BlenderMaterialTexture",
    cloneType: function() { var t = new osg.BlenderMaterialTexture(); return t;},
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType; },
    getChannels: function() { return this._channels; },
    setChannels: function(channels) { this._channels = channels; },
    apply: function(state) {
        if (this._texture !== undefined) {
            this._texture.apply(state);
        }
    },

    getAttributeHash: function() {
        var hash = this.attributeType;
        var keys = Object.keys(this._channels);
        for (var i = 0, l = keys.length; i < l; i++) {
            hash += keys[i];
        }
        return hash;
    }
});


osg.BlenderShaderGenerator = function() {
    this._cache = [];
    this._attributeSupported = {};
    this._attributeSupported[osg.BlenderMaterial.prototype.attributeType] = true;
    this._attributeSupported[osg.BlenderMaterialTexture.prototype.attributeType] = true;
    this._attributeSupported[osg.Light.prototype.attributeType] = true;
};
osg.BlenderShaderGenerator.prototype = {

    getActiveAttributesHash: function(state) {
        // we should check attribute is active or not
        var hash = "";
        for (var j = 0, k = state.attributeMap.attributeKeys.length; j < k; j++) {
            var keya = state.attributeMap.attributeKeys[j];
            if (this._attributeSupported[keya] === undefined) {
                continue;
            }
            var attributeStack = state.attributeMap[keya];
            if (attributeStack.length === 0 && attributeStack.globalDefault.applyPositionedUniform === undefined) {
                continue;
            }
            if (attributeStack.globalDefault.getOrCreateUniforms !== undefined || attributeStack.globalDefault.writeToShader !== undefined) {
                hash += attributeStack.lastApplied().getAttributeHash();
            }
        }

        for (var i = 0, l = state.textureAttributeMapList.length; i < l; i++) {
            var attributesForUnit = state.textureAttributeMapList[i];
            if (attributesForUnit === undefined) {
                continue;
            }
            for (var h = 0, m = attributesForUnit.attributeKeys.length; h < m; h++) {
                var key = attributesForUnit.attributeKeys[h];
                if (this._attributeSupported[key] === undefined) {
                    continue;
                }
                var textureAttributeStack = attributesForUnit[key];
                if (textureAttributeStack.length === 0) {
                    continue;
                }
                if (textureAttributeStack.globalDefault.getOrCreateUniforms !== undefined || textureAttributeStack.globalDefault.writeToShader !== undefined) {
                    hash += textureAttributeStack.lastApplied().getAttributeHash() + i;
                }
            }
        }
        return hash;
    },

    getActiveAttributeMapKeys: function(state) {
        var keys = [];
        for (var j = 0, k = state.attributeMap.attributeKeys.length; j < k; j++) {
            var keya = state.attributeMap.attributeKeys[j];
            if (this._attributeSupported[keya] === undefined) {
                continue;
            }
            var attributeStack = state.attributeMap[keya];
            if (attributeStack.length === 0 && attributeStack.globalDefault.applyPositionedUniform === undefined) {
                continue;
            }
            if (attributeStack.globalDefault.getOrCreateUniforms !== undefined || attributeStack.globalDefault.writeToShader !== undefined) {
                keys.push(keya);
            }
        }
        return keys;
    },

    getActiveTextureAttributeMapKeys: function(state) {
        var textureAttributeKeys = [];
        for (var i = 0, l = state.textureAttributeMapList.length; i < l; i++) {
            var attributesForUnit = state.textureAttributeMapList[i];
            if (attributesForUnit === undefined) {
                continue;
            }
            textureAttributeKeys[i] = [];
            for (var j = 0, m = attributesForUnit.attributeKeys.length; j < m; j++) {
                var key = attributesForUnit.attributeKeys[j];
                if (this._attributeSupported[key] === undefined) {
                    continue;
                }

                var textureAttributeStack = attributesForUnit[key];
                if (textureAttributeStack.length === 0) {
                    continue;
                }
                if (textureAttributeStack.globalDefault.getOrCreateUniforms !== undefined || textureAttributeStack.globalDefault.writeToShader !== undefined) {
                    textureAttributeKeys[i].push(key);
                }
            }
        }
        return textureAttributeKeys;
    },

    getActiveUniforms: function(state, attributeKeys, textureAttributeKeys) {
        var uniforms = {};

        for (var i = 0, l = attributeKeys.length; i < l; i++) {
            var key = attributeKeys[i];

            if (state.attributeMap[key].globalDefault.getOrCreateUniforms === undefined) {
                continue;
            }
            var attributeUniforms = state.attributeMap[key].globalDefault.getOrCreateUniforms();
            for (var j = 0, m = attributeUniforms.uniformKeys.length; j < m; j++) {
                var name = attributeUniforms.uniformKeys[j];
                var uniform = attributeUniforms[name];
                uniforms[uniform.name] = uniform;
            }
        }

        for (var a = 0, n = textureAttributeKeys.length; a < n; a++) {
            var unitAttributekeys = textureAttributeKeys[a];
            if (unitAttributekeys === undefined) {
                continue;
            }
            for (var b = 0, o = unitAttributekeys.length; b < o; b++) {
                var attrName = unitAttributekeys[b];
                var textureAttribute = state.textureAttributeMapList[a][attrName].globalDefault;
                if (textureAttribute.getOrCreateUniforms === undefined) {
                    continue;
                }
                var texUniforms = textureAttribute.getOrCreateUniforms(a);
                for (var t = 0, tl = texUniforms.uniformKeys.length; t < tl; t++) {
                    var tname = texUniforms.uniformKeys[t];
                    var tuniform = texUniforms[tname];
                    uniforms[tuniform.name] = tuniform;
                }
            }
        }

        var keys = [];
        for (var ukey in uniforms) {
            keys.push(ukey);
        }
        uniforms.uniformKeys = keys;
        return uniforms;
    },

    getOrCreateProgram: function(state) {

        // first get trace of active attribute and texture attributes to check
        // if we already have generated a program for this configuration
        var hash = this.getActiveAttributesHash(state);
        for (var i = 0, l = this._cache.length; i < l; ++i) {
            if (hash === this._cache[i].hash) {
                return this._cache[i];
            }
        }

        // extract valid attributes keys with more details
        var attributeKeys = this.getActiveAttributeMapKeys(state);
        var textureAttributeKeys = this.getActiveTextureAttributeMapKeys(state);


        var vertexshader = this.getOrCreateVertexShader(state, attributeKeys, textureAttributeKeys);
        var fragmentshader = this.getOrCreateFragmentShader(state, attributeKeys, textureAttributeKeys);
        var program = new osg.Program(
            new osg.Shader(gl.VERTEX_SHADER, vertexshader),
            new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));

        program.flattenKeys = flattenKeys;
        program.activeAttributeKeys = attributeKeys;
        program.activeTextureAttributeKeys = textureAttributeKeys;
        program.activeUniforms = this.getActiveUniforms(state, attributeKeys, textureAttributeKeys);
        program.generated = true;

        osg.log(program.vertex.text);
        osg.log(program.fragment.text);

        this._cache.push(program);
        return program;
    },

    compareAttributeMap: function(attributeKeys0, attributeKeys1) {
        var key;
        for (var i = 0, l = attributeKeys0.length; i < l; i++) {
            key = attributeKeys0[i];
            if (attributeKeys1.indexOf(key) === -1 ) {
                return 1;
            }
        }
        if (attributeKeys1.length !== attributeKeys0.length) {
            return -1;
        }
        return 0;
    },

    fillTextureShader: function (attributeMapList, validTextureAttributeKeys, mode) {
        var shader = "";
        var commonTypeShader = {};

        for (var i = 0, l = validTextureAttributeKeys.length; i < l; i++) {
            var attributeKeys = validTextureAttributeKeys[i];
            if (attributeKeys === undefined) {
                continue;
            }
            var attributes = attributeMapList[i];
            for (var j = 0, m = attributeKeys.length; j < m; j++) {
                var key = attributeKeys[j];

                var element = attributes[key].globalDefault;

                if (element.generateShaderCommon !== undefined && commonTypeShader[key] === undefined) {
                    shader += element.generateShaderCommon(i, mode);
                    commonTypeShader[key] = true;
                }

                if (element.generateShader) {
                    shader += element.generateShader(i, mode);
                }
            }
        }
        return shader;
    },

    fillShader: function (attributeMap, validAttributeKeys, mode) {
        var shader = "";
        var commonTypeShader = {};

        for (var j = 0, m = validAttributeKeys.length; j < m; j++) {
            var key = validAttributeKeys[j];
            var element = attributeMap[key].globalDefault;
            var type = element.getType();
            if (element.generateShaderCommon !== undefined && commonTypeShader[type] === undefined) {
                shader += element.generateShaderCommon(mode);
                commonTypeShader[type] = true;
            }

            if (element.generateShader) {
                shader += element.generateShader(mode);
            }
        }
        return shader;
    },

    getOrCreateVertexShader: function (state, validAttributeKeys, validTextureAttributeKeys) {
        var i;
        var modes = osg.ShaderGeneratorType;
        var shader = [
            "",
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
            ""
        ].join('\n');

        shader += this._writeShaderFromMode(state, validAttributeKeys, validTextureAttributeKeys, modes.VertexInit);

        var func = [
            "",
            "vec4 ftransform() {",
            "  return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
            "}"].join('\n');

        shader += func;

        shader += this._writeShaderFromMode(state, validAttributeKeys, validTextureAttributeKeys, modes.VertexFunction);

        var body = [
            "",
            "void main(void) {",
            "  gl_Position = ftransform();",
            "  if (ArrayColorEnabled == 1)",
            "    VertexColor = Color;",
            "  else",
            "    VertexColor = vec4(1.0,1.0,1.0,1.0);",
            ""
        ].join('\n');

        shader += body;

        shader += this._writeShaderFromMode(state, validAttributeKeys, validTextureAttributeKeys, modes.VertexMain);

        shader += [
            "}",
            ""
        ].join('\n');

        return shader;
    },

    _writeShaderFromMode: function(state, validAttributeKeys, validTextureAttributeKeys, mode) {
        var str = "";
        str += this.fillTextureShader(state.textureAttributeMapList, validTextureAttributeKeys, mode);
        str += this.fillShader(state.attributeMap, validAttributeKeys, mode);
        return str;
    },

    getOrCreateFragmentShader: function (state, validAttributeKeys, validTextureAttributeKeys) {
        var i;
        var shader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "varying vec4 VertexColor;",
            "uniform int ArrayColorEnabled;",
            "vec4 fragColor;",
            ""
        ].join("\n");

        var modes = osg.ShaderGeneratorType;
        
        shader += this._writeShaderFromMode(state, validAttributeKeys, validTextureAttributeKeys, modes.FragmentInit);

        shader += this._writeShaderFromMode(state, validAttributeKeys, validTextureAttributeKeys, modes.FragmentFunction);

        shader += [
            "void main(void) {",
            "  fragColor = VertexColor;",
            ""
        ].join('\n');

        shader += this._writeShaderFromMode(state, validAttributeKeys, validTextureAttributeKeys, modes.FragmentMain);

        shader += this._writeShaderFromMode(state, validAttributeKeys, validTextureAttributeKeys, modes.FragmentEnd);

        shader += [
            "",
            "  gl_FragColor = fragColor;",
            "}"
        ].join('\n');

        return shader;
    }
};


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



// profile must describe how to get the tree
L*texture3*texture1 + H*texture2

