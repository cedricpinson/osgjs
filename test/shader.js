if (window.module !== undefined) {
    module("osgShader");
}
var ShaderNode = {};

ShaderNode.Node = function() {
    this._inputs = [];
    this._output = undefined;
    for (var i = 0, l = arguments.length; i < l; i++) {
        if (arguments[i] === undefined) {
            break;
        }
        this._inputs.push(arguments[i]);
    }
    this._id = ShaderNode.Node.instance++;
};    
ShaderNode.Node.instance = 0;

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
    getType: function() { return this._type; },
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

ShaderNode.Sampler = function(type, prefix) {
    ShaderNode.Variable.call(this, type, prefix);
};
ShaderNode.Sampler.prototype = osg.objectInehrit(ShaderNode.Variable.prototype, {
    declare: function() {
        return undefined;
    },
    globalDeclaration: function() {
        return "uniform " + this._type + " " + this.getVariable() + ";";
    }
});


ShaderNode.BlendNode = function(mode, val0, val1, t) {
    ShaderNode.Node.call(this, val0, val1, t);
    this._mode = mode;
};
ShaderNode.BlendNode.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    computeFragment: function() {
        return this[this._mode]();
    },
    MIX: function() {
        // result = val0*(1.0-t) + t*val1
        return this._output.getVariable() + " = mix(" + this._inputs[0].getVariable() + ", " + this._inputs[1].getVariable() + ", " + this._inputs[2].getVariable() + ");";

    },

    MULTIPLY: function() {
        return this._output.getVariable() + " = " + this._inputs[0].getVariable() + " * mix( " + this._inputs[0].getType() + "(1.0), " + this._inputs[1].getVariable() + ", " + this._inputs[2].getVariable() + ");";
    }

});


ShaderNode.TextureRGB = function(sampler, uv, output) {
    ShaderNode.Node.call(this);
    this._sampler = sampler;
    this.connectInput(sampler);
    this.connectInput(uv);
    if (output !== undefined) {
        this.connectOutput(output);
    }
    this._uv = uv;
};
ShaderNode.TextureRGB.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    type: "TextureRGB",
    computeFragment: function() {
        var str = [ "",
                    this._output.getVariable() + " = TextureRGB( " + this._sampler.getVariable() + " , " +this._uv.getVariable() + ".xy);"
                  ].join('\n');
        return str;
    },

    globalFunctionDeclaration: function() {
        var str = [ "",
                    "vec3 TextureRGB(in sampler2D texture, in vec2 uv) {",
                    "  return texture2D(texture, uv).rgb;",
                    "}"
                  ].join('\n');
        return str;
    }
});


ShaderNode.TextureAlpha = function(sampler, uv, output) {
    ShaderNode.TextureRGB.call(this, sampler, uv, output);
};
ShaderNode.TextureAlpha.prototype = osg.objectInehrit(ShaderNode.TextureRGB.prototype, {
    type: "TextureAlpha",
    computeFragment: function() {
        var str = [ "",
                    this._output.getVariable() + " = TextureAlpha( " + this._sampler.getVariable() + " , " +this._uv.getVariable() + ".xy);"
                  ].join('\n');
        return str;
    },

    globalFunctionDeclaration: function() {
        var str = [ "",
                    "vec3 TextureAlpha(in sampler2D texture, in vec2 uv) {",
                    "  return texture2D(texture, uv).a;",
                    "}"
                  ].join('\n');
        return str;
    }
});

ShaderNode.TextureTranslucency = function(sampler, uv) {
    ShaderNode.TextureAlpha.call(this, sampler, uv);
};
ShaderNode.TextureTranslucency.prototype = osg.objectInehrit(ShaderNode.TextureAlpha.prototype, {
    computeFragment: function() {
        var str = [ "",
                    this._output.getVariable() + " = 1.0 - TextureAlpha( " + this._sampler.getVariable() + " , " +this._uv.getVariable() + ".xy);"
                  ].join('\n');
        return str;
    }
});

ShaderNode.TextureIntensity = function(sampler, uv, output) {
    ShaderNode.TextureRGB.call(this, sampler, uv, output);
};
ShaderNode.TextureIntensity.prototype = osg.objectInehrit(ShaderNode.TextureRGB.prototype, {
    type: "TextureIntensity",
    computeFragment: function() {
        var str = [ "",
                    this._output.getVariable() + " = textureIntensity( " + this._sampler.getVariable() + " , " +this._uv.getVariable() + ".xy);"
                  ].join('\n');
        return str;
    },

    globalFunctionDeclaration: function() {
        var str = [ "",
                    "float textureIntensity(in sampler2D texture, in vec2 uv) {",
                    "  vec3 rgb = texture2D(texture, uv).rgb;",
                    "  return dot(rgb,vec3(1.0/3.0));",
                    "}"
                  ].join('\n');
        return str;
    }
});


ShaderNode.TextureNormal = function(sampler, uv, output) {
    ShaderNode.TextureRGB.call(this, sampler, uv, output);
};
ShaderNode.TextureNormal.prototype = osg.objectInehrit(ShaderNode.TextureRGB.prototype, {
    type: "TextureNormal",
    computeFragment: function() {
        var str = [ "",
                    this._output.getVariable() + " = textureNormal( " + this._sampler.getVariable() + " , " +this._uv.getVariable() + ".xy);"
                  ].join('\n');
        return str;
    },

    globalFunctionDeclaration: function() {
        var str = [ "",
                    "vec3 textureNormal(in sampler2D texture, in vec2 uv) {",
                    "  vec3 rgb = texture2D(texture, uv).rgb;",
                    "  return normalize((2.0*rgb-vec3(1.0)));",
                    "}"
                  ].join('\n');
        return str;
    }
});

ShaderNode.NormalizeNormalAndEyeVector = function(fnormal, fpos) {
    ShaderNode.Node.apply(this, arguments);
    this._normal = fnormal;
    this._position = fpos;
    this.connectInput(fnormal);
    this.connectInput(fpos);
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
                    this._outputNormal.getVariable() + " = normalize("+this._normal.getVariable() +");",
                    this._outputEyeVector.getVariable() + " = -normalize("+this._position.getVariable() + ");"
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


ShaderNode.PassValue = function(input, output) {
    ShaderNode.Node.call(this, input);
    if (output !== undefined) {
        this.connectOutput(output);
    }
};
ShaderNode.PassValue.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    computeFragment: function() {
        return this._output.getVariable() + " = " + this._inputs[0].getVariable() +";";
    }
});

ShaderNode.Srgb2Linear = function(input, output) {
    ShaderNode.Node.call(this, input);
    this.connectOutput(output);
};
ShaderNode.Srgb2Linear.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    type: 'Srgb2Linear',
    computeFragment: function() {
        var inputType = this._inputs[0].getType();
        return this._output.getVariable() + " = srgb2linearrgb_"+ inputType +"(" + this._inputs[0].getVariable() +");";
    },
    globalFunctionDeclaration: function() {
        var str = [
            "float srgb_to_linearrgb1(float c)",
            "{",
            "  if(c < 0.04045)",
            "    return (c < 0.0)? 0.0: c * (1.0/12.92);",
            "  else",
            "    return pow((c + 0.055)*(1.0/1.055), 2.4);",
            "}",
            "vec4 srgb2linearrgb_vec4(vec4 col_from)",
            "{",
            "  vec4 col_to;",
            "  col_to.r = srgb_to_linearrgb1(col_from.r);",
            "  col_to.g = srgb_to_linearrgb1(col_from.g);",
            "  col_to.b = srgb_to_linearrgb1(col_from.b);",
            "  col_to.a = col_from.a;",
            "  return col_to;",
            "}",
            "vec3 srgb2linearrgb_vec3(vec3 col_from)",
            "{",
            "  vec3 col_to;",
            "  col_to.r = srgb_to_linearrgb1(col_from.r);",
            "  col_to.g = srgb_to_linearrgb1(col_from.g);",
            "  col_to.b = srgb_to_linearrgb1(col_from.b);",
            "  return col_to;",
            "}",
            "" ].join('\n');
        return str;
    }
});

ShaderNode.Linear2Srgb = function(input, output) {
    ShaderNode.Node.call(this, input);
    this.connectOutput(output);
};
ShaderNode.Linear2Srgb.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    type: 'Linear2Srgb',
    computeFragment: function() {
        return this._output.getVariable() + " = linearrgb2srgb(" + this._inputs[0].getVariable() +");";
    },
    globalFunctionDeclaration: function() {
        var str = [
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

            "vec4 linearrgb2srgb(vec4 col_from)",
            "{",
            "  vec4 col_to;",
            "  col_to.r = linearrgb_to_srgb1(col_from.r);",
            "  col_to.g = linearrgb_to_srgb1(col_from.g);",
            "  col_to.b = linearrgb_to_srgb1(col_from.b);",
            "  col_to.a = col_from.a;",
            "  return col_to;",
            "}",
            "",
        ""].join('\n');
        return str;
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
        return this._output.getVariable() + " = max( dot(" + this._inputs[0].getVariable() + ", " + this._inputs[1].getVariable() + "), 0.0);";
    }
});

ShaderNode.NormalTangentSpace = function(tangent, normal, texNormal, output) {
    ShaderNode.Node.call(this, tangent, normal, texNormal);
    if (output !== undefined) {
        this.connectOutput(output);
    }
};
ShaderNode.NormalTangentSpace.prototype = osg.objectInehrit(ShaderNode.Node.prototype, {
    type: "NormalTangentSpace",
    globalFunctionDeclaration: function() {
        var str = [
            "",
            "void mtex_nspace_tangent(vec4 tangent, vec3 normal, vec3 texnormal, out vec3 outnormal) {",
            "  vec3 tang = normalize(tangent.xyz);",
            "  vec3 B = tangent.w * cross(normal, tang);",
            "  outnormal = texnormal.x*tang + texnormal.y*B + texnormal.z*normal;",
            "  outnormal = normalize(outnormal);",
            "}"
        ].join('\n');
        return str;
    },
    computeFragment: function() {
        return "mtex_nspace_tangent(" + this._inputs[0].getVariable() + ", " + this._inputs[1].getVariable() + ", " + this._inputs[2].getVariable() + ", " + this._output.getVariable() + ");";
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

    connectLight: function( i ) { this._light = i; },
    getLight: function() { return this._light; },

    globalFunctionDeclaration: function() {
        var str = [
            "void lamp_falloff_invsquare(float lampdist, float dist, out float visifac)",
            "{",
            "  visifac = lampdist/(lampdist + dist*dist);",
            "}",
            "void lamp_falloff_invlinear(float lampdist, float dist, out float visifac)",
            "{",
            "  visifac = lampdist/(lampdist + dist);",
            "}",

            "void lamp_visibility_sun_hemi(vec3 lampvec, out vec3 lv, out float dist, out float visifac)",
            "{",
            "  lv = lampvec;",
            "  dist = 1.0;",
            "  visifac = 1.0;",
            "}",
            "",
            "void lamp_visibility_other(vec3 co, vec3 lampco, out vec3 lv, out float dist, out float visifac)",
            "{",
            "  lv = lampco-co;",
            "  dist = length(lv);",
            "  lv = normalize(lv);",
            "  visifac = 1.0;",
            "}",

            "void lamp_visibility_spot_circle(vec3 lampvec, vec3 lv, out float inpr)",
            "{",
            "  inpr = dot(lv, lampvec);",
            "}",
            "",
            "void lamp_visibility_spot(float spotsi, float spotbl, float inpr, float visifac, out float outvisifac)",
            "{",
            "  float t = spotsi;",
            "",
            "  if(inpr <= t) {",
            "    outvisifac = 0.0;",
            "  }",
            "  else {",
            "    t = inpr - t;",
            "",
            "    /* soft area */",
            "    if(spotbl != 0.0)",
            "      inpr *= smoothstep(0.0, 1.0, t/spotbl);",
            "",
            "    outvisifac = visifac*inpr;",
            "  }",
            "}",
            "",
            "void lamp_visibility_clamp(float visifac, out float outvisifac)",
            "{",
            "  outvisifac = (visifac < 0.001)? 0.0: visifac;",
            "}",

            "void shade_visifac(float i, float visifac, float refl, out float outi)",
            "{",
            "  /*if(i > 0.0)*/",
            "    outi = max(i*visifac*refl, 0.0);",
            "  /*else",
            "    outi = i;*/",
            "}",

            "void shade_cooktorr_spec(vec3 n, vec3 l, vec3 v, float hard, out float specfac)",
            "{",
            "  vec3 h = normalize(v + l);",
            "  float nh = dot(n, h);",
            "",
            "  if(nh < 0.0) {",
            "    specfac = 0.0;",
            "  }",
            "  else {",
            "    float nv = max(dot(n, v), 0.0);",
            "    float i = pow(nh, hard);",
            "",
            "    i = i/(0.1+nv);",
            "    specfac = i;",
            "  }",
            "}",
            "void shade_spec_t(float shadfac, float spec, float visifac, float specfac, out float t)",
            "{",
            "  t = shadfac*spec*visifac*specfac;",
            "}",

            "void shade_inp(vec3 vn, vec3 lv, out float inp)",
            "{",
            "  inp = dot(vn, lv);",
            "}",
            "",
            "// lights global variables",
            "vec3 lightvector;",
            "float dist;",
            "float visifac;",
            "float falloff;",
            "float lightInput;",
            "float lightOutput;",
            "vec3 diffuseOutCol;",
            "float specfac;",
            "float specularTerm;",
            "vec3 specularOutCol;",
            ""
        ].join('\n');
        return str;
    },

    computeFragment: function() {
        var str = [ "",

                    "specularOutCol = vec3(0.0);",
                    "diffuseOutCol = vec3(0.0);",

                    "lamp_visibility_other(FragEyeVector, vec3(" + this._light.getOrCreateUniforms().position.getName() + "), lightvector, dist, visifac);",
                    "lamp_falloff_invsquare(" + this._light.getOrCreateUniforms().distance.getName() + ", dist, falloff);",
                    "lamp_visibility_clamp(falloff, visifac);",
                    "shade_inp(" + this.getNormal().getVariable() + ", lightvector, lightInput);",
                    "shade_visifac(lightInput, visifac, "+ this.getMaterialDiffuseIntensity().getVariable() + ", lightOutput);",
                    "diffuseOutCol = " + this._light.getOrCreateUniforms().color.getName() + " * lightOutput;",
                    "diffuseOutCol = max(diffuseOutCol * " + this.getMaterialDiffuseColor().getVariable() + ", vec3(0.0,0.0,0.0));",

                    "shade_cooktorr_spec(" + this.getNormal().getVariable() + ", lightvector, " + this.getEyeVector().getVariable() + ", " + this.getMaterialHardness().getVariable() + ", specfac);",
                    "shade_spec_t(1.0, " + this.getMaterialSpecularIntensity().getVariable() + ", visifac, specfac, specularTerm);",
                    "specularOutCol = specularTerm * " + this.getMaterialSpecularColor().getVariable() + " * " + this._light.getOrCreateUniforms().color.getName() + ";",
                    "specularOutCol = max(specularOutCol, vec3(0.0));",
                    this._output.getVariable() + " = specularOutCol + diffuseOutCol;",
                  ""].join('\n');
        return str;
    }


});

ShaderNode.ShaderContext = function(state, attributes, textureAttributes) {
    this._state = state;
    this._variables = {};
    this._vertexShader = [];
    this._fragmentShader = [];

    // separate BlenderMaterial / BlenderLight / BlenderTextureMaterial
    // because this shader generator is specific for this

    var lights = [];
    var material;
    var textures = [];
    for (var i = 0, l = attributes.length; i < l; i++) {
        var type = attributes[i].getType();
        // Test one light at a time
        if (type === "BlenderLight") { // && lights.length === 0) {
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

    Sampler: function(type, varname) {
        var name = varname;
        if (name === undefined) {
            var len = Object.keys(this._variables).length;
            name = "sampler_"+ len;
        }
        var v = new ShaderNode.Sampler(type, name);
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
        var materialShadingAmbient = this.getVariable(uniforms.ambientFactor.name);
        var materialShadingEmission = this.getVariable(uniforms.emission.name);
        var materialDiffuseColor = this.getVariable(uniforms.diffuseColor.name);
        var materialSpecularColor = this.getVariable(uniforms.specularColor.name);
        var materialDiffuseIntensity = this.getVariable(uniforms.diffuseIntensity.name);
        var materialSpecularIntensity = this.getVariable(uniforms.specularIntensity.name);
        var materialHardness = this.getVariable(uniforms.hardness.name);
        var materialTranslucency = this.getVariable(uniforms.translucency.name);

        var inputNormal = this.Varying("vec3", "FragNormal");
        var inputTangent = this.Varying("vec4", "FragTangent");

        var inputPosition = this.Varying("vec3", "FragEyeVector");
        var normal = this.Variable("vec3", "normal");
        var eyeVector = this.Variable("vec3", "eyeVector");

        var normalizeNormalAndVector = new ShaderNode.NormalizeNormalAndEyeVector(inputNormal, inputPosition);
        normalizeNormalAndVector.connectOutputNormal(normal);
        normalizeNormalAndVector.connectOutputEyeVector(eyeVector);

        var channelsType = osg.BlenderTextureMaterial.prototype.channelType;
        var texturesChannels = {};

        var getOrCreateChannelsEntry = function(name) {
            if (texturesChannels[name] === undefined) {
                texturesChannels[name] = [];
                texturesChannels[name].pushEntry = function(v, texture) {
                    this.push({ 'variable' : v,
                                'texture': texture});
                };
            }
            return texturesChannels[name];
        };

        // manage textures
        for ( var t = 0, tl = textures.length; t < tl; t++) {
            var texture = textures[t];
            if (texture !== undefined) {
                var lc = channelsType.length;
                for (var c = 0; c < lc; c++) {
                    var channel = texture.getChannels()[channelsType[c]];
                    if (channel === undefined) {
                        continue;
                    }
                    
                    var textureSampler = this.getVariable("Texture" + t);
                    if (textureSampler === undefined) {
                        textureSampler = this.Sampler("sampler2D", "Texture" + t);
                    }
                    var texCoord = this.getVariable("FragTexCoord" + t);
                    if (texCoord === undefined) {
                        texCoord = this.Varying("vec2", "FragTexCoord" + t);
                    }

                    var channelEntry;
                    var channelName = channel.getName();
                    var node;
                    var output;
                    if ( channelName === "DiffuseColor") {
                        channelEntry = getOrCreateChannelsEntry(channelName);
                        output = this.Variable("vec3");
                        var srgb2linearTmp = this.Variable("vec3");
                        
                        node = new ShaderNode.TextureRGB(textureSampler, texCoord,output);
                        node = new ShaderNode.Srgb2Linear(output, srgb2linearTmp);
                        output = srgb2linearTmp;
                        channelEntry.pushEntry(output, t);

                    } else if (channelName === "DiffuseIntensity") {
                        channelEntry = getOrCreateChannelsEntry(channelName);
                        node = new ShaderNode.TextureIntensity(textureSampler, texCoord);
                        output = this.Variable("float");
                        node.connectOutput(output);
                        channelEntry.pushEntry(output, t);

                    } else if (channelName === "Alpha") {
                        channelEntry = getOrCreateChannelsEntry(channelName);
                        node = new ShaderNode.TextureAlpha(textureSampler, texCoord);
                        output = this.Variable("float");
                        node.connectOutput(output);
                        channelEntry.pushEntry(output, t);

                    } else if (channelName === "Translucency") {
                        channelEntry = getOrCreateChannelsEntry(channelName);
                        node = new ShaderNode.TextureTranslucency(textureSampler, texCoord);
                        output = this.Variable("float");
                        node.connectOutput(output);
                        channelEntry.pushEntry(output, t);

                    } else if (channelName === "SpecularColor") {
                        channelEntry = getOrCreateChannelsEntry(channelName);
                        node = new ShaderNode.TextureRGB(textureSampler, texCoord);
                        output = this.Variable("vec3");
                        node.connectOutput(output);
                        channelEntry.pushEntry(output, t);

                    } else if (channelName === "SpecularIntensity") {
                        channelEntry = getOrCreateChannelsEntry(channelName);
                        node = new ShaderNode.TextureIntensity(textureSampler, texCoord);
                        output = this.Variable("float");
                        node.connectOutput(output);
                        channelEntry.pushEntry(output, t);

                    } else if (channelName === "SpecularHardness") {
                        channelEntry = getOrCreateChannelsEntry(channelName);
                        node = new ShaderNode.TextureIntensity(textureSampler, texCoord);
                        output = this.Variable("float");
                        node.connectOutput(output);
                        channelEntry.pushEntry(output, t);

                    } else if ( channelName === "Ambient") {
                        channelEntry = getOrCreateChannelsEntry(channelName);
                        node = new ShaderNode.TextureRGB(textureSampler, texCoord);
                        output = this.Variable("vec3");
                        node.connectOutput(output);
                        channelEntry.pushEntry(output, t);

                    } else if ( channelName === "Emit") {
                        channelEntry = getOrCreateChannelsEntry(channelName);
                        node = new ShaderNode.TextureRGB(textureSampler, texCoord);
                        output = this.Variable("vec3");
                        node.connectOutput(output);
                        channelEntry.pushEntry(output, t);

                    } else if ( channelName === "Mirror") {
                        channelEntry = getOrCreateChannelsEntry(channelName);
                        node = new ShaderNode.TextureRGB(textureSampler, texCoord);
                        output = this.Variable("vec3");
                        node.connectOutput(output);
                        channelEntry.pushEntry(output, t);
                    } else if ( channelName === "Normal") {
                        channelEntry = getOrCreateChannelsEntry(channelName);
                        node = new ShaderNode.TextureNormal(textureSampler, texCoord);
                        output = this.Variable("vec3");
                        node.connectOutput(output);
                        channelEntry.pushEntry(output, t);
                    }
                }
            }
        }

        var self = this;
        var blendChannel = function(input, array, channelName) {
            var output = input;
            var blendMode;
            for (var i = 0, l = array.length; i < l; i++) {
                var texChannel = array[i];
                var texUnit = texChannel.texture;
                var texture = textures[texUnit];
                blendMode = texture.getBlendMode();
                output = self.Variable(input.getType());
                
                var texFactorUniform = texture.getOrCreateUniforms(texUnit)[channelName];
                var factorUniform = self.getVariable(texFactorUniform.getName());
                if (factorUniform === undefined) {
                    factorUniform = self.Uniform(texFactorUniform.getType(), texFactorUniform.getName());
                }

                var blendNode = new ShaderNode.BlendNode(blendMode, input, texChannel.variable, factorUniform);
                blendNode.connectOutput(output);
                input = output;
            }
            return output;
        };

        var applyBlendChannel = function(output, channelName, input) {
            var operatorPass = new ShaderNode.PassValue();

            if (texturesChannels[channelName] !== undefined && texturesChannels[channelName].length > 0) {
                input = blendChannel(input, texturesChannels[channelName], channelName);
            }
            operatorPass.connectOutput(output);
            operatorPass.connectInput(input);
        };

        var diffuseColor = this.Variable("vec3","diffuseColor");
        applyBlendChannel(diffuseColor, "DiffuseColor", materialDiffuseColor);

        var diffuseIntensity = this.Variable("float","diffuseIntensity");
        applyBlendChannel(diffuseIntensity, "DiffuseIntensity", materialDiffuseIntensity);

        var translucency = this.Variable("float","translucency");
        applyBlendChannel(translucency, "Translucency", materialTranslucency);

        var specularColor = this.Variable("vec3","specularColor");
        applyBlendChannel(specularColor, "SpecularColor", materialSpecularColor);

        var specularIntensity = this.Variable("float","specularIntensity");
        applyBlendChannel(specularIntensity, "SpecularIntensity", materialSpecularIntensity);

        var specularHardness = this.Variable("float","specularHardness");
        applyBlendChannel(specularHardness, "SpecularHardness", materialHardness);


        var shadingAmbient = this.Variable("float","ambient");
        applyBlendChannel(shadingAmbient, "Ambient", materialShadingAmbient);

        var shadingEmission = this.Variable("float","emission");
        applyBlendChannel(shadingEmission, "Emit", materialShadingEmission);

//        var shadingMirror = this.Variable("float","shadingMirror");
//        applyBlendChannel(shadingMirror, "ShadingMirror", materialShadingMirror);


        var currentNormal = this.Variable("vec3");
        applyBlendChannel(currentNormal, "Normal", normal);

        var geometryNormal = this.Variable("vec3", "final_normal");
        

        if (texturesChannels.Normal !== undefined && texturesChannels.Normal.length > 0 ) {
            var normalMap = new ShaderNode.NormalTangentSpace(inputTangent, normal, currentNormal, geometryNormal);
        } else {
            var normalPass = new ShaderNode.PassValue(currentNormal, geometryNormal);
        }


        var lightColorAccumulator = this.Variable("vec3","light_accumulator");


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
            var lightDirection = this.getVariable(uniforms.direction.name);

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
            lightContribution.connectLight(light);

            lightContribution.connectMaterialAmbient(shadingAmbient);
            lightContribution.connectMaterialDiffuseIntensity(diffuseIntensity);
            lightContribution.connectMaterialSpecularIntensity(specularIntensity);
            lightContribution.connectMaterialSpecularColor(specularColor);
            lightContribution.connectMaterialHardness(specularHardness);

            lightContribution.connectMaterialDiffuseColor(diffuseColor);

            lightContribution.connectLightColor(lightColor);
            lightContribution.connectNormal(geometryNormal);
            lightContribution.connectEyeVector(eyeVector);
            lightContribution.connectLightSpotCutoff(lightSpotCuffoff);
            lightContribution.connectLightSpotBlend(lightSpotBlend);
            lightContribution.connectLightPosition(lightPosition);
            lightContribution.connectLightDirection(lightDirection);
            lightContribution.connectLightDistance(lightDistance);

            lightContribution.connectOutput(lightResult);
            //lightResult.connectInput(lightContribution);

            addLightContribution.connectInput(lightResult);
        }

        var fragColor = new ShaderNode.FragColor();
        //var 
        //setTransluency
        //var translucencyOperator = new ShaderNode.SetAlpha(diffuseColor, materialTranslucency);
        var translucencyOperator = new ShaderNode.SetAlpha(lightColorAccumulator, materialTranslucency);
        var colorTranslucency = this.Variable("vec4");
        translucencyOperator.connectOutput(colorTranslucency);

        var operatorAssign = new ShaderNode.PassValue();
        var finalColor = this.Variable("vec4");
        operatorAssign.connectOutput(finalColor);


        if (lights.length > 0) {
            operatorAssign.connectInput(colorTranslucency);
        } else {
            var debugColor = this.Variable("vec4");
            debugColor.setValue("vec4(1.0, 0.0, 1.0, 1.0)");
            operatorAssign.connectInput(debugColor);
        }

        var operatorLinearToSrgb = new ShaderNode.Linear2Srgb(finalColor, fragColor);

        return fragColor;
    },

    traverse: function(functor, node ) {
        for (var i = 0, l = node.getInputs().length; i < l; i++) {
            var child = node.getInputs()[i];
            if (child !== undefined &&
               child !== node) {
                this.traverse(functor, child);
            }
        }
        functor.call(functor, node);
    },
    evaluateGlobalFunctionDeclaration: function(node) {
        var func = function(node) {
            if (node.globalFunctionDeclaration &&
                this._map[node.type] === undefined) {
                this._map[node.type] = true;
                var c = node.globalFunctionDeclaration();
                this._text.push(c);
            }
        };
        func._map = {};
        func._text = [];
        this.traverse(func, node);
        return func._text.join('\n');
    },

    evaluateGlobalVariableDeclaration: function(node) {
        var func = function(node) {
            if (this._map[node._id] === undefined) {
                this._map[node._id] = true;
                if (node.globalDeclaration !== undefined) {
                    var c = node.globalDeclaration();
                    if (c !== undefined) {
                        this._text.push(c);
                    }
                }
            }
        };
        func._map = {};
        func._text = [];
        this.traverse(func, node);
        return func._text.join('\n');
    },

    evaluate: function(node) {
        var func = function(node) {
            if (this._mapTraverse[node._id] !== undefined) {
                return;
            }
            var c = node.computeFragment();
            if (c !== undefined) {
                this._text.push(c);
            }
            this._mapTraverse[node._id] = true;
        };
        func._text = [];
        func._mapTraverse = [];
        this.traverse(func, node);
        this._fragmentShader.push(func._text.join('\n'));
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
                          "attribute vec4 Tangent;",
                          "uniform int ArrayColorEnabled;",
                          "uniform mat4 ModelViewMatrix;",
                          "uniform mat4 ProjectionMatrix;",
                          "uniform mat4 NormalMatrix;",
                          "varying vec4 VertexColor;",
                          "varying vec3 FragNormal;",
                          "varying vec4 FragTangent;",
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
        this._vertexShader.push("  FragTangent = NormalMatrix * Tangent;");
        this._vertexShader.push("  FragEyeVector = vec3(ModelViewMatrix * vec4(Vertex,1.0));");
        this._vertexShader.push("  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);");
        this._vertexShader.push([ "",
                          "  if (ArrayColorEnabled == 1)",
                          "    VertexColor = Color;",
                          "  else",
                          "    VertexColor = vec4(1.0,1.0,1.0,1.0);",
                          ""
                        ].join('\n'));
        for ( var tt = 0, ttl = textures.length; tt < ttl; tt++) {
            this._vertexShader.push("FragTexCoord" + tt +" = TexCoord" + tt + ";");
        }
        this._vertexShader.push("}");
    },

    createVertexShader: function() {
        var root = this.createVertexShaderGraph();
        var shader = this._vertexShader.join('\n');
        //osg.log("Vertex Shader");
        //osg.log(shader);
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
                                     ""].join('\n'));


        var vars = Object.keys(this._variables);

        if (false) {
            for (var i = 0, l = vars.length; i < l; i++) {
                if (this._variables[vars[i]].globalDeclaration !== undefined) {
                    var v = this._variables[vars[i]].globalDeclaration();
                    if (v !== undefined) {
                        this._fragmentShader.push(v);
                    }
                }
            }
        }

        this._fragmentShader.push(this.evaluateGlobalVariableDeclaration(root));

        this._fragmentShader.push([
            ""].join('\n'));

        this._fragmentShader.push(this.evaluateGlobalFunctionDeclaration(root));


        this._fragmentShader.push("void main() {");

        for (var j = 0, jl = vars.length; j < jl; j++) {
            var d = this._variables[vars[j]].declare();
            if (d !== undefined) {
                this._fragmentShader.push(this._variables[vars[j]].declare());
            }
        }
        this.evaluate(root);
        //this._fragmentShader.push("gl_FragColor = vec4(final_normal.rgb*0.5 + vec3(0.5),1.0);");
        //this._fragmentShader.push("gl_FragColor = vec4(normal.rgb*0.5 + vec3(0.5),1.0);");
        //this._fragmentShader.push("gl_FragColor = vec4(normalize(FragTangent.rgb)*0.5 + vec3(0.5),1.0);");
        this._fragmentShader.push("}");
        var shader = this._fragmentShader.join('\n');
        //osg.log("Fragment Shader");
        //osg.log(shader);
        return shader;
    }
};



osg.BlenderLight = function(lightNumber) {
    osg.StateAttribute.call(this);

    if (lightNumber === undefined) {
        lightNumber = 0;
    }

    this._color = [ 1.0, 1.0, 1.0 ];
    this._affectSpecular = true;
    this._affectDiffuse = true;
    this._position = [ 0.0, 0.0, 1.0, 0.0 ];
    this._direction = [ 0.0, 0.0, -1.0 ];
    this._spotCutoff = 180.0;
    this._spotBlend = 0.01;
    this._falloffType = "INVERSE_SQUARE";
    this._distance = 25;
    this._energy = 1.0;
    this._lightUnit = lightNumber;
    this._type = "POINT";
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
        return "BlenderLight"+this._lightUnit + this._type + this._attenuationType;
    },
    getOrCreateUniforms: function() {

        var obj = osg.BlenderLight;
        var Uniforms = osg.Uniform;
        var typeMember = this.getTypeMember();
        if (obj.uniforms[typeMember] === undefined) {
            uniformList = {
                "color": 'createFloat3',
                "energy": 'createFloat1',
                "position": 'createFloat3',
                "direction":'createFloat3',
                "spotCutoff":'createFloat1',
                "spotBlend":'createFloat1',
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

    setColor: function(a) { this._color = a; this.dirty(); },
    getColor: function() { return this._color; },

    setEnergy: function(a) { this._energy = a; this.dirty(); },
    getEnergy: function() { return this._energy; },

    setSpotCutoff: function(a) { this._spotCutoff = a; this.dirty(); },
    setSpotBlend: function(a) { this._spotBlend = a; this.dirty(); },

    setUseDiffuse: function(a) { this._useDiffuse = a; this.dirty(); },
    getUseDiffuse: function() { return this._useDiffuse; },

    setUseSpecular: function(a) { this._useSpecular = a; this.dirty(); },
    getUseSpecular: function() { return this._useSpecular; },

    setLightType: function(a) { this._type = a; this.dirty(); },
    getLightType: function() { return this._type; },

    setFalloffType: function(value) { this._falloffType = value; this.dirty();},
    getFalloffType: function() { return this._falloffType; },

    setDistance: function(value) { this._distance = value; this.dirty();},
    getDistance: function() { return this._distance; },

    setLightNumber: function(unit) { this._lightUnit = unit; this.dirty(); },
    getLightNumber: function() { return this._lightUnit; },

    getPrefix: function() { return this.getType() + this._lightUnit; },
    getParameterName: function (name) { return this.getPrefix()+ "_" + name; },

    applyPositionedUniform: function(matrix, state) {
        var uniform = this.getOrCreateUniforms();
        if (this._type === "SUN") {
            var invMatrix = new Array(16);
            osg.Matrix.copy(matrix, invMatrix);
            invMatrix[12] = 0;
            invMatrix[13] = 0;
            invMatrix[14] = 0;
            osg.Matrix.inverse(invMatrix, invMatrix);
            osg.Matrix.transpose(invMatrix, invMatrix);
            osg.Matrix.transformVec3(invMatrix, [0,0,-1], uniform.direction.get());
        }
        if (this._type !== "SUN") {
            osg.Matrix.transformVec3(matrix, [0,0,0], uniform.position.get());
        }

        uniform.position.dirty();
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

        light.energy.get()[0] = this._energy;
        light.energy.dirty();

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
                "shadeless": 'createInt1' };
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
        this._channels[channel] = new osg.BlenderTextureMaterial.Channel(channel);
    }
    this._blendMode = "MIX";
};
osg.BlenderTextureMaterial.uniforms = [];
osg.BlenderTextureMaterial.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "BlenderTextureMaterial",
    channelType: [ "DiffuseColor",
                   "DiffuseIntensity",
                   "Alpha",
                   "Translucency",
                   "SpecularColor",
                   "SpecularIntensity",
                   "SpecularHardness",
                   "Ambient",
                   "Emit",
                   "Mirror",
                   "Normal"
                 ],
    cloneType: function() { var t = new osg.BlenderTextureMaterial(new osg.Texture()); return t;},
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType; },
    getBlendMode: function() { return this._blendMode;},
    setBlendMode: function(mode) { this._blendMode = mode;},
    getChannels: function() { return this._channels; },
    setChannels: function(channels) { this._channels = channels; },
    getChannelType: function() { return this.channelType; },
    getOrCreateUniforms: function(unit) {
        var obj = osg.BlenderTextureMaterial.uniforms;
        if (obj[unit] === undefined) {
            var uniforms = {};
            var name = this._texture.getType() + unit;
            var textureUniform = this._texture.getOrCreateUniforms(unit);
            uniforms.texture = textureUniform.texture;

            var channels = this.channelType;
            for (var i = 0, l = channels.length; i < l; i++) {
                var c = channels[i];
                uniforms[c] = osg.Uniform.createFloat1(this.getType() + unit + "_uniform_" + c);
            }
            uniforms.uniformKeys = Object.keys(uniforms);
            obj[unit] = uniforms;
        }
        return obj[unit];
    },

    apply: function(state, unit) {
        if (this._texture !== undefined) {
            this._texture.apply(state);
        }
        var uniforms = this.getOrCreateUniforms(unit);
        var keys = Object.keys(this._channels);
        for (var i = 0, l = keys.length; i < l; i++) {
            var k = keys[i];
            var uniform = uniforms[k];
            uniform.get()[0] = this._channels[k].getFactor();
            uniform.dirty();
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
osg.BlenderTextureMaterial.Channel = function(name, amount) {
    this._name = name;
    var f = amount;
    if (f === undefined) {
        f = 1.0;
    }
    this._factor = f;
};
osg.BlenderTextureMaterial.Channel.prototype = {
    setName: function(n) { this._name = n;},
    getName: function() { return this._name;},
    setFactor: function(n) { this._factor = n;},
    getFactor: function() { return this._factor;}
};

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


osg.BlenderNodeVisitor = function() {
    osg.NodeVisitor.call(this);
    this._shaderGenerator = new osg.BlenderShaderGenerator();
};
osg.BlenderNodeVisitor.prototype = osg.objectInehrit(osg.NodeVisitor.prototype, {
    getObject: function(userdata) {
        var obj = {};
        userdata.forEach(function(entry, i , a) {
            var name = entry.Name;
            var value = entry.Value;
            obj[name] = value;
        });
        return obj;
    },

    createLight: function(sa) {
        var map = this.getObject(sa.getUserData());
        if (map.source !== "blender")
            return;
        
        var l = new osg.BlenderLight();
        l.setLightNumber(sa.getLightNumber());
        if (sa.SpotCutoff !== undefined) {
            l.setSpotCutoff(JSON.parse(sa.SpotCutoff));
        }
        if (sa.SpotBlend !== undefined) {
            l.setSpotBlend(JSON.parse(sa.SpotBlend));
        }
        l.setEnergy(JSON.parse(map.Energy));
        l.setLightType(map.Type);
        l.setColor(JSON.parse(map.Color));
        l.setDistance(JSON.parse(map.Distance));
        l.setFalloffType(map.FalloffType);

        if (map.UseDiffuse !== undefined) {
            l.setUseDiffuse(JSON.parse(map.UseDiffuse));
        }
        if (map.UseSpecular !== undefined) {
            l.setUseSpecular(JSON.parse(map.UseSpecular));
        }

        return l;
    },

    createMaterial: function(sa) {
        var map = this.getObject(sa.getUserData());
        if (map.source !== "blender")
            return;
        
        var a = new osg.BlenderMaterial();
        a.setDiffuseColor(JSON.parse(map.DiffuseColor));
        a.setDiffuseIntensity(JSON.parse(map.DiffuseIntensity));

        a.setSpecularColor(JSON.parse(map.SpecularColor));
        a.setSpecularIntensity(JSON.parse(map.SpecularIntensity));
        a.setHardness(JSON.parse(map.SpecularHardness));

        a.setEmission(JSON.parse(map.Emit));
        a.setTranslucency(JSON.parse(map.Translucency));
        a.setAmbient(JSON.parse(map.Ambient));

        if (map.Shadeless) {
            a.setShadeless(true);
        }
        return a;
    },

    apply: function(node) {
        if (node.objectType === osg.LightSource.prototype.objectType) {
            if (node.getLight() !== undefined && node.getLight().getType() !== "BlenderLight") {
                var blenderLight = this.createLight(node.getLight());
                if (blenderLight !== undefined) {
                    node.setLight(blenderLight);
                }
                
            }
            
        } else if (node.getStateSet() !== undefined) {
            var ss = node.getStateSet();
            if (ss.getUserData() !== undefined) {
                
                var obj = this.getObject(ss.getUserData());

                var attrMap = ss.getAttributeMap();
                if (attrMap !== undefined) {

                    // check light and material attribute to create blender one
                    var self = this;
                    Object.keys(attrMap).forEach(function(element, index, array) {
                        if (attrMap[element].getAttribute === undefined) {
                            return;
                        }
                        var attr = attrMap[element].getAttribute();
                        var o = attr;
                        var n = o.getType();
                        if (n === "Light") {
                            var blenderLight = self.createLight(o);
                            if (blenderLight !== undefined) {
                                ss.setAttributeAndModes(blenderLight);
                            }
                        } else if (n === "Material") {
                            var blenderMaterial = self.createMaterial(o);
                            if (blenderMaterial !== undefined) {
                                ss.setAttributeAndModes(blenderMaterial);
                            }

                        }
                    });
                }

                var unitTexture = {};
                // check texture unit
                if (obj.source === "blender") {
                    ss.setShaderGenerator(this._shaderGenerator);
                    Object.keys(obj).forEach(function(element, i, keys) {
                        var k = element;
                        var unit = k.substr(0,2);
                        var unitNumber = parseInt(unit,10);
                        if (isNaN(unitNumber)) {
                            return;
                        }
                        var texture = unitTexture[unitNumber];
                        if ( texture === undefined) {
                            var textureAttr = ss.getTextureAttribute(unitNumber, "Texture");
                            unitTexture[unitNumber] = new osg.BlenderTextureMaterial(textureAttr);
                            texture = unitTexture[unitNumber];
                        }
                        var paramName = k.substr(3);
                        for (var c = 0, cl = texture.getChannelType().length; c < cl; c++) {
                            // check if it matches
                            if (texture.getChannelType()[c] === paramName) {
                                if (paramName === "NormalMap") {
                                    texture._texture.setMinFilter('LINEAR');
                                    texture._texture.setMagFilter('LINEAR');
                                }
                                texture.getChannels()[paramName] = new osg.BlenderTextureMaterial.Channel(paramName, parseFloat(obj[k]));
                                break;
                            }
                        }
                        if (paramName === "BlendType") {
                            texture.setBlendMode(obj[k]);
                        }
                    });

                    // assign texture to stateset
                    Object.keys(unitTexture).forEach(function(element, i, keys) {
                        var kk = element;
                        var uni = parseInt(kk, 10);
                        ss.setTextureAttributeAndModes(uni, unitTexture[kk]);
                    });
                }
            }
        }

        this.traverse(node);
    }
});


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
        var texture3 = new osg.BlenderTextureMaterial(new osg.Texture(),'DiffuseIntensity');

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

    ok("check not exception", true);
   
});

