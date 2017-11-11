import utils from 'osg/utils';
import notify from 'osg/notify';
import Program from 'osg/Program';
import Shader from 'osg/Shader';
import Compiler from 'osgShader/Compiler';
import ShaderProcessor from 'osgShader/ShaderProcessor';

var ShaderGenerator = function() {
    this._cache = {};

    // ShaderProcessor singleton used by ShaderGenerator
    // but user can replace it if needed
    this._shaderProcessor = new ShaderProcessor();

    // ShaderCompiler Object to instanciate
    this._ShaderCompiler = undefined;

    this.setShaderCompiler(Compiler);
};

ShaderGenerator.prototype = {
    // setShaderCompiler that will be used to createShader
    setShaderCompiler: function(ShaderCompiler) {
        this._ShaderCompiler = ShaderCompiler;
        if (!ShaderCompiler._validAttributeTypeMemberCache)
            this._computeStateAttributeCache(ShaderCompiler);
    },

    getShaderCompiler: function() {
        return this._ShaderCompiler;
    },

    getShaderProcessor: function() {
        return this._shaderProcessor;
    },

    setShaderProcessor: function(shaderProcessor) {
        this._shaderProcessor = shaderProcessor;
    },

    // filter input types and write the result in the outputs array
    filterAttributeTypes: function(attribute) {
        // works for attribute that contains isEnabled
        // Light, Shadow. It let us to filter them to build a shader if not enabled
        if (attribute.isEnabled && !attribute.isEnabled()) return true;

        return false;
    },

    // get actives attribute that comes from state listed by compiler cache type
    getActiveAttributeList: function(state, list) {
        var hash = '';
        var _attributeArray = state._attributeArray;
        var cacheType = this._ShaderCompiler._validAttributeTypeMemberCache;

        for (var j = 0, k = cacheType.length; j < k; j++) {
            var type = cacheType[j];
            var attributeStack = type < _attributeArray.length ? _attributeArray[type] : undefined;
            if (!attributeStack) continue;

            var attribute = attributeStack._lastApplied;

            if (!attribute || this.filterAttributeTypes(attribute)) continue;

            hash += attribute.getHash();
            list.push(attribute);
        }

        return hash;
    },

    // create a hash from actives attribute listed by compiler cache type
    getActiveAttributeListCache: function(state) {
        var hash = '';

        var cacheType = this._ShaderCompiler._validAttributeTypeMemberCache;
        for (var i = 0, l = cacheType.length; i < l; i++) {
            var type = cacheType[i];
            var attributeStack =
                type < state._attributeArray.length ? state._attributeArray[type] : undefined;
            if (attributeStack) {
                var attribute = attributeStack._lastApplied;
                if (!attribute || this.filterAttributeTypes(attribute)) continue;

                hash += attributeStack._lastApplied.getHash();
            }
        }

        return hash;
    },

    // create a hash from actives texture attribute listed by compiler cache type
    getActiveTextureAttributeListCache: function(state) {
        var hash = '';

        var cacheType = this._ShaderCompiler._validTextureAttributeTypeMemberCache;
        var textureUnitList = state._textureAttributeArrayList;
        for (var j = 0; j < textureUnitList.length; j++) {
            var textureUnit = textureUnitList[j];
            if (!textureUnit) continue;

            var textureUnitLength = textureUnit.length;
            for (var i = 0; i < cacheType.length; i++) {
                var type = cacheType[i];
                var attributeStack = type < textureUnitLength ? textureUnit[type] : undefined;
                if (attributeStack) {
                    var attribute = attributeStack._lastApplied;

                    if (
                        !attribute ||
                        this.filterAttributeTypes(attribute) ||
                        attribute.isTextureNull()
                    )
                        continue;

                    // we check to filter texture null in hash
                    // but it's probably better to just set the hash correctly of a tetxure null, to remove this custom code
                    hash += attribute.getHash();
                }
            }
        }

        return hash;
    },

    // get actives texture attribute that comes from state
    getActiveTextureAttributeList: function(state, list) {
        var hash = '';
        var _attributeArrayList = state._textureAttributeArrayList;
        var i, l;
        var cacheType = this._ShaderCompiler._validTextureAttributeTypeMemberCache;

        for (i = 0, l = _attributeArrayList.length; i < l; i++) {
            var _attributeArrayForUnit = _attributeArrayList[i];

            if (!_attributeArrayForUnit) continue;

            list[i] = [];

            for (var j = 0, m = cacheType.length; j < m; j++) {
                var type = cacheType[j];

                var attributeStack =
                    type < _attributeArrayForUnit.length ? _attributeArrayForUnit[type] : undefined;
                if (!attributeStack) continue;

                var attribute = attributeStack._lastApplied;
                if (!attribute || this.filterAttributeTypes(attribute) || attribute.isTextureNull())
                    continue;

                hash += attribute.getHash();
                list[i].push(attribute);
            }
        }
        return hash;
    },

    getActiveUniforms: function(state, attributeList, textureAttributeList) {
        var uniforms = {};

        for (var i = 0, l = attributeList.length; i < l; i++) {
            var at = attributeList[i];
            if (at.getOrCreateUniforms) {
                var attributeUniformMap = at.getOrCreateUniforms();
                // It could happen that uniforms are declared conditionally
                if (attributeUniformMap !== undefined) {
                    for (var keyAttribute in attributeUniformMap) {
                        var uniform = attributeUniformMap[keyAttribute];
                        uniforms[uniform.getName()] = uniform;
                    }
                }
            }
        }

        for (var a = 0, n = textureAttributeList.length; a < n; a++) {
            var tat = textureAttributeList[a];
            if (tat) {
                for (var b = 0, o = tat.length; b < o; b++) {
                    var attr = tat[b];

                    var texUniformMap = attr.getOrCreateUniforms(a);

                    for (var tname in texUniformMap) {
                        var tuniform = texUniformMap[tname];
                        uniforms[tuniform.getName()] = tuniform;
                    }
                }
            }
        }

        return uniforms;
    },

    _computeStateAttributeCache: function(CompilerShader) {
        var typeMemberNames = CompilerShader.stateAttributeConfig.attribute || [];
        var validTypeMemberList = [];
        var typeMemberName;
        var i, il, cache;
        var id;
        for (i = 0, il = typeMemberNames.length; i < il; i++) {
            typeMemberName = typeMemberNames[i];
            id = utils.getIdFromTypeMember(typeMemberName);
            if (id !== undefined) {
                if (validTypeMemberList.indexOf(id) !== -1) {
                    notify.warn(
                        'Compiler ' +
                            CompilerShader.name +
                            ' contains duplicate attribute entry ' +
                            typeMemberName +
                            ', check the Compiler configuration'
                    );
                } else {
                    validTypeMemberList.push(id);
                }
            }
        }
        cache = new Uint8Array(validTypeMemberList);
        CompilerShader._validAttributeTypeMemberCache = cache;

        typeMemberNames = CompilerShader.stateAttributeConfig.textureAttribute || [];
        validTypeMemberList = [];
        for (i = 0, il = typeMemberNames.length; i < il; i++) {
            typeMemberName = typeMemberNames[i];
            id = utils.getTextureIdFromTypeMember(typeMemberName);
            if (validTypeMemberList.indexOf(id) !== -1) {
                notify.warn(
                    'Compiler ' +
                        CompilerShader.name +
                        ' contains duplicate texture attribute entry ' +
                        typeMemberName +
                        ', check the Compiler configuration'
                );
            } else {
                validTypeMemberList.push(id);
            }
        }
        cache = new Uint8Array(validTypeMemberList);
        CompilerShader._validTextureAttributeTypeMemberCache = cache;
    },

    _createWaitingProgram: function(state, attributes, textureAttributes) {
        var vsDefault =
            'attribute vec3 Vertex;uniform mat4 uModelViewMatrix;uniform mat4 uProjectionMatrix;void main(void) {  gl_Position = vec4(10.0,10.0,10.0,1.0);}\n';

        var fsDefault =
            '#define SHADER_NAME WaitSafe\nprecision lowp float; void main(void) { gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);}\n';

        var program = new Program(
            new Shader(Shader.VERTEX_SHADER, vsDefault),
            new Shader(Shader.FRAGMENT_SHADER, fsDefault)
        );

        this.getActiveAttributeList(state, attributes);
        program.setActiveUniforms(this.getActiveUniforms(state, attributes, textureAttributes));
        program.generated = true;
        program.apply(state);
        return program;
    },

    getOrCreateProgram: (function() {
        var textureAttributes = [];
        var attributes = [];

        return function(state) {
            // extract valid attributes
            var hash =
                this.getActiveAttributeListCache(state) +
                this.getActiveTextureAttributeListCache(state);

            var cachedProgram = this._getProgram(hash, state, attributes, textureAttributes);
            if (cachedProgram !== undefined) {
                return cachedProgram;
            }

            var program = this._createProgram(hash, state, attributes, textureAttributes);

            return program;
        };
    })(),

    _getProgram: function(hash) {
        return this._cache[hash];
    },

    // slow path to generate shader
    _createProgram: function(hash, state, attributes, textureAttributes) {
        attributes.length = 0;
        textureAttributes.length = 0;

        this.getActiveAttributeList(state, attributes);
        this.getActiveTextureAttributeList(state, textureAttributes);

        // use ShaderCompiler, it can be overrided by a custom one
        var ShaderCompiler = this._ShaderCompiler;
        var shaderGen = new ShaderCompiler(attributes, textureAttributes, this._shaderProcessor);

        /* develblock:start */
        // Logs hash, attributes and compiler
        notify.debug('New Compilation ', false, true);
        notify.debug(
            {
                Attributes: attributes,
                Texture: textureAttributes,
                Hash: hash,
                Compiler: shaderGen.getFragmentShaderName()
            },
            false,
            true
        );
        /* develblock:end */

        var fragmentshader = shaderGen.createFragmentShader();
        var vertexshader = shaderGen.createVertexShader();

        var program = new Program(
            new Shader(Shader.VERTEX_SHADER, vertexshader),
            new Shader(Shader.FRAGMENT_SHADER, fragmentshader)
        );

        program.hash = hash;
        program.setActiveUniforms(this.getActiveUniforms(state, attributes, textureAttributes));
        program.generated = true;
        this._cache[hash] = program;

        program.apply(state);

        return program;
    },
    resetCache: function() {
        this._cache = {};
    }
};

export default ShaderGenerator;
