osg.State = function () {
    this.currentVBO = null;
    this.vertexAttribList = [];
    this.programs = osg.Stack.create();
    this.stateSets = osg.Stack.create();
    this.uniforms = {};
    this.uniforms.uniformKeys = [];
    
    this.textureAttributeMapList = [];

    this.attributeMap = {};
    this.attributeMap.attributeKeys = [];

    this.modeMap = {};

    this.shaderGenerator = new osg.ShaderGenerator();

    this.modelViewMatrix = osg.Uniform.createMatrix4(osg.Matrix.makeIdentity(), "ModelViewMatrix");
    this.projectionMatrix = osg.Uniform.createMatrix4(osg.Matrix.makeIdentity(), "ProjectionMatrix");
    this.normalMatrix = osg.Uniform.createMatrix4(osg.Matrix.makeIdentity(), "NormalMatrix");

    this.uniformArrayState = {};
    this.uniformArrayState.uniformKeys = [];
    this.uniformArrayState.Color = osg.Uniform.createInt1(0, "ArrayColorEnabled");
    this.uniformArrayState.uniformKeys.push("Color");

    this.vertexAttribMap = {};
    this.vertexAttribMap._disable = [];
    this.vertexAttribMap._keys = [];
};

osg.State.prototype = {

    pushStateSet: function(stateset) {
        this.stateSets.push(stateset);

        if (stateset.attributeMap) {
            this.pushAttributeMap(this.attributeMap, stateset.attributeMap);
        }
        if (stateset.textureAttributeMapList) {
            var list = stateset.textureAttributeMapList;
            for (var textureUnit = 0, l = list.length; textureUnit < l; textureUnit++)
            {
                if (list[textureUnit] === undefined) {
                    continue;
                }
                if (!this.textureAttributeMapList[textureUnit]) {
                    this.textureAttributeMapList[textureUnit] = {};
                    this.textureAttributeMapList[textureUnit].attributeKeys = [];
                }
                this.pushAttributeMap(this.textureAttributeMapList[textureUnit], list[textureUnit]);
            }
        }

        if (stateset.uniforms) {
            this.pushUniformsList(this.uniforms, stateset.uniforms);
        }
    },

    applyStateSet: function(stateset) {
        this.pushStateSet(stateset);
        this.apply();
        this.popStateSet();
    },

    popAllStateSets: function() {
        while (this.stateSets.length) {
            this.popStateSet();
        }
    },
    popStateSet: function() {
        var stateset = this.stateSets.pop();
        if (stateset.program) {
            this.programs.pop();
        }
        if (stateset.attributeMap) {
            this.popAttributeMap(this.attributeMap, stateset.attributeMap);
        }
        if (stateset.textureAttributeMapList) {
            var list = stateset.textureAttributeMapList;
            for (var textureUnit = 0, l = list.length; textureUnit < l; textureUnit++)
            {
                if (list[textureUnit] === undefined) {
                    continue;
                }
                this.popAttributeMap(this.textureAttributeMapList[textureUnit], list[textureUnit]);
            }
        }

        if (stateset.uniforms) {
            this.popUniformsList(this.uniforms, stateset.uniforms);
        }
    },

    applyAttribute: function(attribute) {
        var key = attribute.getTypeMember();
        var attributeStack = this.attributeMap[key];
        if (attributeStack === undefined) {
            attributeStack = osg.Stack.create();
            this.attributeMap[key] = attributeStack;
            this.attributeMap[key].globalDefault = attribute.cloneType();
            this.attributeMap.attributeKeys.push(key);
        }

        if (attributeStack.lastApplied !== attribute || attribute.isDirty()) {
            if (attribute.apply) {
                attribute.apply(this);
            }
            attributeStack.lastApplied = attribute;
            attributeStack.asChanged = true;
        }
    },
    applyTextureAttribute: function(unit, attribute) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        var key = attribute.getTypeMember();

        if (!this.textureAttributeMapList[unit]) {
            this.textureAttributeMapList[unit] = {};
            this.textureAttributeMapList[unit].attributeKeys = [];
        }

        var attributeStack = this.textureAttributeMapList[unit][key];
        if (attributeStack === undefined) {
            attributeStack = osg.Stack.create();
            this.textureAttributeMapList[unit][key] = attributeStack;
            attributeStack.globalDefault = attribute.cloneType();
            this.textureAttributeMapList[unit].attributeKeys.push(key);
        }

        if (attributeStack.lastApplied !== attribute || attribute.isDirty()) {
            if (attribute.apply) {
                attribute.apply(this);
            }
            attributeStack.lastApplied = attribute;
            attributeStack.asChanged = true;
        }
    },

    getLastProgramApplied: function() {
        return this.programs.lastApplied;
    },

    pushGeneratedProgram: function() {
        var program;
        if (this.attributeMap.Program !== undefined && this.attributeMap.Program.length !== 0) {
            program = this.attributeMap.Program.back().object;
            value = this.attributeMap.Program.back().value;
            if (program !== undefined && value !== osg.StateAttribute.OFF) {
                this.programs.push(this.getObjectPair(program, value));
                return program;
            }
        }

        var attributes = {
            'textureAttributeMapList': this.textureAttributeMapList,
            'attributeMap': this.attributeMap
        };

        program = this.shaderGenerator.getOrCreateProgram(attributes);
        this.programs.push(this.getObjectPair(program, osg.StateAttribute.ON));
        return program;
    },

    popGeneratedProgram: function() {
        this.programs.pop();
    },

    applyWithoutProgram: function() {
        this.applyAttributeMap(this.attributeMap);
        this.applyTextureAttributeMapList(this.textureAttributeMapList);
    },

    apply: function() {
        this.applyAttributeMap(this.attributeMap);
        this.applyTextureAttributeMapList(this.textureAttributeMapList);

        this.pushGeneratedProgram();
        var program = this.programs.back().object;
        if (this.programs.lastApplied !== program) {
            program.apply(this);
            this.programs.lastApplied = program;
        }

	var programUniforms;
	var activeUniforms;
        var i;
        var key;
        if (program.generated !== undefined && program.generated === true) {
            // note that about TextureAttribute that need uniform on unit we would need to improve
            // the current uniformList ...

            programUniforms = program.uniformsCache;
            activeUniforms = program.activeUniforms;
            var regenrateKeys = false;
            for (i = 0 , l = activeUniforms.uniformKeys.length; i < l; i++) {
                var name = activeUniforms.uniformKeys[i];
                var location = programUniforms[name];
                if (location !== undefined) {
                    activeUniforms[name].apply(location);
                } else {
                    regenrateKeys = true;
                    delete activeUniforms[name];
                }
            }
            if (regenrateKeys) {
                var keys = [];
                for (key in activeUniforms) {
                    if (key !== "uniformKeys") {
                        keys.push(key);
                    }
                }
                activeUniforms.uniformKeys = keys;
            }
        } else {
            
            //this.applyUniformList(this.uniforms, {});

            // custom program so we will iterate on uniform from the program and apply them
            // but in order to be able to use Attribute in the state graph we will check if
            // our program want them. It must be defined by the user
            var programObject = program.program;
            var location1;
            var uniformStack;
            var uniform;

            programUniforms = program.uniformsCache;
            var uniformMap = this.uniforms;

            // first time we see attributes key, so we will keep a list of uniforms from attributes
            activeUniforms = [];
            var trackAttributes = program.trackAttributes;
            var trackUniforms = program.trackUniforms;
            var attribute;
            var uniforms;
            var a;
            // loop on wanted attributes and texture attribute to track state graph uniforms from those attributes
            if (trackAttributes !== undefined && trackUniforms === undefined) {
                var attributeKeys = program.trackAttributes.attributeKeys;
                for ( i = 0, l = attributeKeys.length; i < l; i++) {
                    key = attributeKeys[i];
                    attributeStack = this.attributeMap[key];
                    if (attributeStack === undefined) {
                        continue;
                    }
                    // we just need the uniform list and not the attribute itself
                    attribute = attributeStack.globalDefault;
                    if (attribute.getOrCreateUniforms === undefined) {
                        continue;
                    }
                    uniforms = attribute.getOrCreateUniforms();
                    for (a = 0, b = uniforms.uniformKeys.length; a < b; a++) {
                        activeUniforms.push(uniforms[uniforms.uniformKeys[a] ]);
                    }
                }

                var textureAttributeKeysList = program.trackAttributes.textureAttributeKeys;
                if (textureAttributeKeysList !== undefined) {
                    for (i = 0, l = textureAttributeKeysList.length; i < l; i++) {
                        var tak = textureAttributeKeysList[i];
                        if (tak === undefined) {
                            continue;
                        }
                        for (var j = 0, m = tak.length; j < m; j++) {
                            key = tak[j];
                            var attributeList = this.textureAttributeMapList[i];
                            if (attributeList === undefined) {
                                continue;
                            }
                            attributeStack = attributeList[key];
                            if (attributeStack === undefined) {
                                continue;
                            }
                            attribute = attributeStack.globalDefault;
                            if (attribute.getOrCreateUniforms === undefined) {
                                continue;
                            }
                            uniforms = attribute.getOrCreateUniforms(i);
                            for (a = 0, b = uniforms.uniformKeys.length; a < b; a++) {
                                activeUniforms.push(uniforms[uniforms.uniformKeys[a] ]);
                            }
                        }
                    }
                }
                // now we have a list on uniforms we want to track but we will filter them to use only what is needed by our program
                // not that if you create a uniforms whith the same name of a tracked attribute, and it will override it
                var uniformsFinal = {};
                for (i = 0, l = activeUniforms.length; i < l; i++) {
                    var u = activeUniforms[i];
                    var loc = gl.getUniformLocation(programObject, u.name);
                    if (loc !== undefined && loc !== null) {
                        uniformsFinal[u.name] = activeUniforms[i];
                    }
                }
                program.trackUniforms = uniformsFinal;
            }

            for (i = 0, l = programUniforms.uniformKeys.length; i < l; i++) {
                var uniformKey = programUniforms.uniformKeys[i];
                location1 = programUniforms[uniformKey];

                uniformStack = uniformMap[uniformKey];
                if (uniformStack === undefined) {
                    if (program.trackUniforms !== undefined) {
                        uniform = program.trackUniforms[uniformKey];
                        if (uniform !== undefined) {
                            uniform.apply(location1);
                        }
                    }
                } else {
                    if (uniformStack.length === 0) {
                        uniform = uniformStack.globalDefault;
                    } else {
                        uniform = uniformStack.back().object;
                    }
                    uniform.apply(location1);
                }
            }
        }
    },

    applyUniformList: function(uniformMap, uniformList) {

        var program = this.getLastProgramApplied();
        var programObject = program.program;
        var location;
        var uniformStack;
        var uniform;
        var uniformKeys = {};
        var key;

        var programUniforms = program.uniformsCache;

        for (var i = 0, l = programUniforms.uniformKeys.length; i < l; i++) {
            var uniformKey = programUniforms.uniformKeys[i];
            location = programUniforms[uniformKey];

            // get the one in the list
            uniform = uniformList[uniformKey];

            // not found ? check on the stack
            if (uniform === undefined) {
                uniformStack = uniformMap[uniformKey];
                if (uniformStack === undefined) {
                    continue;
                }
                if (uniformStack.length === 0) {
                    uniform = uniformStack.globalDefault;
                } else {
                    uniform = uniformStack.back().object;
                }
            }
            uniform.apply(location);
        }
    },

    applyAttributeMap: function(attributeMap) {
        var attributeStack;
        
        for (var i = 0, l = attributeMap.attributeKeys.length; i < l; i++) {
            var key = attributeMap.attributeKeys[i];

            attributeStack = attributeMap[key];
            if (attributeStack === undefined) {
                continue;
            }
            var attribute;
            if (attributeStack.length === 0) {
                attribute = attributeStack.globalDefault;
            } else {
                attribute = attributeStack.back().object;
            }

            if (attributeStack.lastApplied !== attribute || attribute.isDirty()) {
                if (attribute.apply) {
                    attribute.apply(this);
                }
                attributeStack.lastApplied = attribute;
                attributeStack.asChanged = true;
            }
        }
    },

    getObjectPair: function(uniform, value) {
        return { object: uniform, value: value};
    },
    pushUniformsList: function(uniformMap, uniformList) {
        var name;
        var uniform;
        for ( var i = 0, l = uniformList.uniformKeys.length; i < l; i++) {
            var key = uniformList.uniformKeys[i];
            uniformPair = uniformList[key];
            uniform = uniformPair.object;
            name = uniform.name;
            if (uniformMap[name] === undefined) {
                uniformMap[name] = osg.Stack.create();
                uniformMap[name].globalDefault = uniform;
                uniformMap.uniformKeys.push(name);
            }
            var stack = uniformMap[name];
            if (stack.length === 0) {
                stack.push(this.getObjectPair(uniform, uniformPair.value));
            } else if ((stack[stack.length-1].value & osg.StateAttribute.OVERRIDE) && !(uniformPair.value & osg.StateAttribute.PROTECTED) ) {
                stack.push(stack[stack.length-1]);
            } else {
                stack.push(this.getObjectPair(uniform, uniformPair.value));
            }
        }
    },
    popUniformsList: function(uniformMap, uniformList) {
        var uniform;
        for (var i = 0, l = uniformList.uniformKeys.length; i < l; i++) {
            var key = uniformList.uniformKeys[i];
            uniformMap[key].pop();
        }
    },

    applyTextureAttributeMapList: function(textureAttributesMapList) {
        var textureAttributeMap;

        for (var textureUnit = 0, l = textureAttributesMapList.length; textureUnit < l; textureUnit++) {
            textureAttributeMap = textureAttributesMapList[textureUnit];
            if (textureAttributeMap === undefined) {
                continue;
            }

            for (var i = 0, lt = textureAttributeMap.attributeKeys.length; i < lt; i++) {
                var key = textureAttributeMap.attributeKeys[i];

                var attributeStack = textureAttributeMap[key];
                if (attributeStack === undefined) {
                    continue;
                }

                var attribute;
                if (attributeStack.length === 0) {
                    attribute = attributeStack.globalDefault;
                } else {
                    attribute = attributeStack.back().object;
                }
                if (attributeStack.lastApplied !== attribute || attribute.isDirty()) {
                    gl.activeTexture(gl.TEXTURE0 + textureUnit);
                    attribute.apply(this.state);
                    attributeStack.lastApplied = attribute;
                }
            }
        }
    },
    setGlobalDefaultValue: function(attribute) {
        var key = attribute.getTypeMember();
        if (this.attributeMap[key]) {
            this.attributeMap[key].globalDefault = attribute;
        } else {
            this.attributeMap[key] = osg.Stack.create();
            this.attributeMap[key].globalDefault = attribute;

            this.attributeMap.attributeKeys.push(key);
        }
    },

    pushAttributeMap: function(attributeMap,  attributeList) {
        var attributeStack;
        for (var i = 0, l = attributeList.attributeKeys.length; i < l; i++ ) {
            var type = attributeList.attributeKeys[i];
            var attributePair = attributeList[type];
            var attribute = attributePair.object;
            if (attributeMap[type] === undefined) {
                attributeMap[type] = osg.Stack.create();
                attributeMap[type].globalDefault = attribute.cloneType();

                attributeMap.attributeKeys.push(type);
            }

            attributeStack = attributeMap[type];
            if (attributeStack.length === 0) {
                attributeStack.push(this.getObjectPair(attribute, attributePair.value));
            } else if ( (attributeStack[attributeStack.length-1].value & osg.StateAttribute.OVERRIDE) && !(attributePair.value & osg.StateAttribute.PROTECTED)) {
                attributeStack.push(attributeStack[attributeStack.length-1]);
            } else {
                attributeStack.push(this.getObjectPair(attribute, attributePair.value));
            }

            attributeStack.asChanged = true;
        }
    },
    popAttributeMap: function(attributeMap,  attributeList) {
        var attributeStack;
        for (var i = 0, l = attributeList.attributeKeys.length; i < l; i++) {
            type = attributeList.attributeKeys[i];
            attributeStack = attributeMap[type];
            attributeStack.pop();
            attributeStack.asChanged = true;
        }
    },

    setIndexArray: function(array) {
        if (this.currentIndexVBO !== array) {
            if (!array.buffer) {
                array.init();
            }
            gl.bindBuffer(array.type, array.buffer);
            this.currentIndexVBO = array;
        }
        if (array.isDirty()) {
            array.compile();
        }
    },

    lazyDisablingOfVertexAttributes: function() {
        var keys = this.vertexAttribMap._keys;
        for (var i = 0, l = keys.length; i < l; i++) {
            var attr = keys[i];
            if (this.vertexAttribMap[attr]) {
                this.vertexAttribMap._disable[attr] = true;
            }
        }
    },

    applyDisablingOfVertexAttributes: function() {
        var keys = this.vertexAttribMap._keys;
        for (var i = 0, l = keys.length; i < l; i++) {
            if (this.vertexAttribMap._disable[keys[i] ] === true) {
                var attr = keys[i];
                gl.disableVertexAttribArray(attr);
                this.vertexAttribMap._disable[attr] = false;
                this.vertexAttribMap[attr] = false;
            }
        }

        // it takes 4.26% of global cpu
        // there would be a way to cache it and track state if the program has not changed ...
        var program = this.programs.lastApplied;
        if (program.generated === true) {
            var updateColorUniform = false;
            if (this.previousAppliedProgram !== this.programs.lastApplied) {
                updateColorUniform = true;
                this.previousAppliedProgram = this.programs.lastApplied;
            } else {
                var colorAttrib = program.attributesCache.Color;
                if ( this.vertexAttribMap[colorAttrib] !== this.previousColorAttrib) {
                    updateColorUniform = true;
                }
            }

            if (updateColorUniform) {
                var colorAttrib = program.attributesCache.Color;
                if (colorAttrib !== undefined) {
                    if (this.vertexAttribMap[colorAttrib]) {
                        this.uniformArrayState.Color.set([1]);
                    } else {
                        this.uniformArrayState.Color.set([0]);
                    }
                    this.previousColorAttrib = this.vertexAttribMap[colorAttrib];
                    this.uniformArrayState.Color.apply(program.uniformsCache.ArrayColorEnabled);
                }
            }
        }
    },
    setVertexAttribArray: function(attrib, array, normalize) {
        this.vertexAttribMap._disable[ attrib ] = false;
        if (!array.buffer) {
            array.init();
        }
        if (array.isDirty()) {
            gl.bindBuffer(array.type, array.buffer);
            array.compile();
        }
        if (this.vertexAttribMap[attrib] !== array) {

            gl.bindBuffer(array.type, array.buffer);

            if (! this.vertexAttribMap[attrib]) {
                gl.enableVertexAttribArray(attrib);
                
                if ( this.vertexAttribMap[attrib] === undefined) {
                    this.vertexAttribMap._keys.push(attrib);
                }
            }

            this.vertexAttribMap[attrib] = array;
            gl.vertexAttribPointer(attrib, array.itemSize, gl.FLOAT, normalize, 0, 0);
        }
    }

};

osg.State.create = function() {
    var state = new osg.State();
    gl.hint(gl.NICEST, gl.GENERATE_MIPMAP_HINT);
    return state;
};
