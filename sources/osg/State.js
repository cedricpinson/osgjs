'use strict';

var mat4 = require('osg/glMatrix').mat4;
var mat3 = require('osg/glMatrix').mat3;
var Notify = require('osg/notify');
var Object = require('osg/Object');
var Program = require('osg/Program');
var StateAttribute = require('osg/StateAttribute');
var PooledArray = require('osg/PooledArray');
var StackObjectPairPool = require('osg/StackObjectPairPool');
var Uniform = require('osg/Uniform');
var MACROUTILS = require('osg/Utils');
var WebGLCaps = require('osg/WebGLCaps');

var checkUniformCache = [
    undefined,
    function uniformCheck1(uniformArray, cacheArray) {
        if (uniformArray[0] === cacheArray[0]) return true;
        cacheArray[0] = uniformArray[0];
        return false;
    },

    function uniformCheck2(uniformArray, cacheArray) {
        if (uniformArray[0] === cacheArray[0] && uniformArray[1] === cacheArray[1]) return true;
        cacheArray[0] = uniformArray[0];
        cacheArray[1] = uniformArray[1];
        return false;
    },

    function uniformCheck3(uniformArray, cacheArray) {
        if (
            uniformArray[0] === cacheArray[0] &&
            uniformArray[1] === cacheArray[1] &&
            uniformArray[2] === cacheArray[2]
        )
            return true;
        cacheArray[0] = uniformArray[0];
        cacheArray[1] = uniformArray[1];
        cacheArray[2] = uniformArray[2];
        return false;
    },

    function uniformCheck4(uniformArray, cacheArray) {
        if (
            uniformArray[0] === cacheArray[0] &&
            uniformArray[1] === cacheArray[1] &&
            uniformArray[2] === cacheArray[2] &&
            uniformArray[3] === cacheArray[3]
        )
            return true;
        cacheArray[0] = uniformArray[0];
        cacheArray[1] = uniformArray[1];
        cacheArray[2] = uniformArray[2];
        cacheArray[3] = uniformArray[3];
        return false;
    }
];

var STANDARD_UNIFORMS = {
    uProjectionMatrix: true,
    uModelMatrix: true,
    uViewMatrix: true,
    uModelViewMatrix: true,
    uModelNormalMatrix: true,
    uModelViewNormalMatrix: true,
    uArrayColorEnabled: true
};

var State = function(shaderGeneratorProxy) {
    Object.call(this);

    this._graphicContext = undefined;
    this._shaderGeneratorProxy = shaderGeneratorProxy;

    if (shaderGeneratorProxy === undefined) console.break();

    this._currentVAO = null;
    this._currentIndexVBO = null;

    this._stateSets = new PooledArray();
    this._shaderGeneratorNames = new StackObjectPairPool();
    this._uniforms = {};

    this._textureAttributeArrayList = [];
    this._attributeArray = [];

    this._projectionMatrix = Uniform.createMatrix4(mat4.create(), 'uProjectionMatrix');
    this._modelMatrix = Uniform.createMatrix4(mat4.create(), 'uModelMatrix');
    this._viewMatrix = Uniform.createMatrix4(mat4.create(), 'uViewMatrix');
    this._modelViewMatrix = Uniform.createMatrix4(mat4.create(), 'uModelViewMatrix');
    this._modelNormalMatrix = Uniform.createMatrix3(mat3.create(), 'uModelNormalMatrix');
    this._modelViewNormalMatrix = Uniform.createMatrix3(mat3.create(), 'uModelViewNormalMatrix');

    // track uniform for color array enabled
    var arrayColorEnable = new StackObjectPairPool();
    arrayColorEnable._globalDefault = Uniform.createFloat1(0.0, 'uArrayColorEnabled');

    this._uniforms.ArrayColorEnabled = arrayColorEnable;

    this._previousColorAttribPair = {};
    this._vertexAttribMap = {};
    this._vertexAttribMap._disable = [];
    this._vertexAttribMap._keys = [];

    this._frameStamp = undefined;

    // we dont use Map because in this use case with a few entries
    // {} is faster
    this._programCommonUniformsCache = {};

    // keep pointer on the last applied modelview and projection matrix
    this._lastAppliedModelViewMatrix = undefined;
    this._lastAppliedProjectionMatrix = undefined;

    // keep track of last applied program
    this._program = undefined;
    // inject a default program to initialize the stack Program
    var program = new Program();
    this.applyAttribute(program);

    // cache programAttribute access
    this._programType = MACROUTILS.getOrCreateStateAttributeTypeMemberIndex(program);
    this._programAttribute = this._attributeArray[this._programType];

    this._numPushStateSet = 0;
    this._numApply = 0;

    this._programUniformCache = [];
    this._cacheUniformId = 0;

    this.resetStats();
};

MACROUTILS.createPrototypeObject(
    State,
    MACROUTILS.objectInherit(Object.prototype, {
        getCacheUniformsApplyRenderLeaf: function() {
            return this._programCommonUniformsCache;
        },

        setGraphicContext: function(graphicContext) {
            this._graphicContext = graphicContext;
            this._extVAO = WebGLCaps.instance(graphicContext).getWebGLExtension(
                'OES_vertex_array_object'
            );
        },

        getGraphicContext: function() {
            return this._graphicContext;
        },

        getShaderGeneratorProxy: function() {
            return this._shaderGeneratorProxy;
        },

        pushCheckOverride: function(stack, object, maskValue) {
            var result = this._evaluateOverrideObjectOnStack(stack, object, maskValue);
            // override and protected case
            if (result !== object) stack.push(result, stack._back.value);
            else stack.push(object, maskValue);
        },

        _evaluateOverrideObjectOnStack: function(stack, object, maskValue) {
            var back = stack._back;
            // object can be a Uniform, an Attribute, or a shader generator name
            if (stack._length === 0) {
                return object;
            } else if (
                back.value & StateAttribute.OVERRIDE &&
                !(maskValue & StateAttribute.PROTECTED)
            ) {
                return back.object;
            } else {
                return object;
            }
        },

        pushStateSet: function(stateset) {
            this._numPushStateSet++;
            this._stateSets.push(stateset);

            this.pushAttributeMap(
                this._attributeArray,
                stateset._attributeArray,
                stateset._activeAttribute
            );

            var textureAttributeArrayList = stateset._textureAttributeArrayList;
            var activeTextureUnits = stateset._activeTextureAttributeUnit;
            var activeTextureAttribute = stateset._activeTextureAttribute;

            for (var i = 0, l = activeTextureUnits.length; i < l; i++) {
                var unit = activeTextureUnits[i];
                var _attributeArray = textureAttributeArrayList[unit];

                var textureUnitAttributeArray = this.getOrCreateTextureAttributeArray(unit);
                this.pushAttributeMap(
                    textureUnitAttributeArray,
                    _attributeArray,
                    activeTextureAttribute
                );
            }

            if (stateset.hasUniform())
                this.pushUniformsList(this._uniforms, stateset.getUniformList());

            var generatorPair = stateset.getShaderGeneratorPair();
            if (generatorPair)
                this.pushCheckOverride(
                    this._shaderGeneratorNames,
                    generatorPair.getShaderGeneratorName(),
                    generatorPair.getValue()
                );
        },

        getStateSetStackSize: function() {
            return this._stateSets.length;
        },

        insertStateSet: (function() {
            var tmpStack = new PooledArray();
            var tmpStackArray = tmpStack.getArray();
            return function(pos, stateSet) {
                tmpStack.reset();
                var length = this.getStateSetStackSize();
                while (length > pos) {
                    tmpStack.push(this._stateSets.back());
                    this.popStateSet();
                    length--;
                }

                this.pushStateSet(stateSet);

                for (var i = tmpStack.length - 1; i >= 0; i--) {
                    this.pushStateSet(tmpStackArray[i]);
                }
            };
        })(),

        removeStateSet: (function() {
            var tmpStack = new PooledArray();
            var tmpStackArray = tmpStack.getArray();
            return function(pos) {
                var length = this.getStateSetStackSize();
                if (pos >= length) {
                    Notify.warn('Warning State:removeStateSet ' + pos + ' out of range');
                    return;
                }

                tmpStack.reset();

                // record the StateSet above the one we intend to remove
                while (length - 1 > pos) {
                    tmpStack.push(this._stateSets.back());
                    this.popStateSet();
                    length--;
                }

                // remove the intended StateSet as well
                this.popStateSet();

                // push back the original ones that were above the remove StateSet
                for (var i = tmpStack.length - 1; i >= 0; i--) {
                    this.pushStateSet(tmpStackArray[i]);
                }
            };
        })(),

        // needed because we use a cache during the frame to avoid
        // applying uniform or operation. At each frame we need to
        // invalidate those informations
        resetCacheFrame: function() {
            this._lastAppliedModelViewMatrix = this._lastAppliedProjectionMatrix = undefined;
        },

        resetStats: function() {
            this._numApply = 0;
            this._numPushStateSet = 0;
        },

        // apply program if needed
        applyProgram: function(program) {
            if (this._program === program) return;
            this._program = program;
            this.getGraphicContext().useProgram(program);
        },

        applyModelViewMatrix: (function() {
            var normal = mat3.create();

            return function StateApplyModelViewMatrix(matrix, matrixModel) {
                if (this._lastAppliedModelViewMatrix === matrix) return false;

                var program = this.getLastProgramApplied();
                var uniformCache = program.getUniformsCache();
                var mu = this._modelViewMatrix;
                var mul = uniformCache.uModelViewMatrix;
                var gc = this.getGraphicContext();
                if (mul) {
                    mu.setMatrix4(matrix);
                    mu.apply(gc, mul);
                }

                var sendNormal;
                if (this._lastAppliedModelViewMatrix) {
                    // check if we need to push normal
                    // test rotation component, if not diff
                    // we dont need to send normal
                    var m2 = this._lastAppliedModelViewMatrix;
                    for (var i = 0; i < 11; i++) {
                        if (matrix[i] !== m2[i]) {
                            sendNormal = true;
                            break;
                        }
                    }
                } else {
                    sendNormal = true;
                }

                if (sendNormal) {
                    mu = this._modelViewNormalMatrix;
                    mul = uniformCache.uModelViewNormalMatrix;
                    if (mul) {
                        mat3.normalFromMat4(normal, matrix);
                        mu.setMatrix3(normal);
                        mu.apply(gc, mul);
                    }

                    mul = uniformCache.uModelNormalMatrix;
                    if (mul) {
                        mat3.normalFromMat4(normal, matrixModel);
                        mu.setMatrix3(normal);
                        mu.apply(gc, mul);
                    }
                }

                this._lastAppliedModelViewMatrix = matrix;
                return true;
            };
        })(),

        applyProjectionMatrix: function(matrix) {
            if (this._lastAppliedProjectionMatrix === matrix) return;

            this._lastAppliedProjectionMatrix = matrix;
            var program = this.getLastProgramApplied();
            var mu = this._projectionMatrix;

            var mul = program.getUniformsCache()[mu.getName()];
            if (mul) {
                mu.setMatrix4(matrix);
                mu.apply(this.getGraphicContext(), mul);
            }
        },

        getCurrentShaderGeneratorStateSet: function(stateset) {
            var programStack = this._programAttribute;
            var stateSetProgramPair = stateset._attributeArray[this._programType];

            if (
                (programStack._length !== 0 && programStack._back.value !== StateAttribute.OFF) ||
                (stateSetProgramPair && stateSetProgramPair.getValue() !== StateAttribute.OFF)
            )
                return undefined;

            var stateSetGeneratorPair = stateset.getShaderGeneratorPair();
            var generatorStack = this._shaderGeneratorNames;
            var generator;

            if (stateSetGeneratorPair) {
                var maskValue = stateSetGeneratorPair.getValue();
                var stateSetGenerator = stateSetGeneratorPair.getShaderGeneratorName();
                generator = this._evaluateOverrideObjectOnStack(
                    this._shaderGeneratorNames,
                    stateSetGenerator,
                    maskValue
                );
            } else if (generatorStack._length) {
                generator = generatorStack._back.object;
            }

            // no custom program look into the stack of ShaderGenerator name
            // what we should use to generate a program
            var last = generator;
            var shaderGenerator = this._shaderGeneratorProxy.getShaderGenerator(last);
            return shaderGenerator;
        },

        _applyAttributeMapStateSet: function(_attributeArray, stateSetAttributeArray) {
            var max =
                _attributeArray.length > stateSetAttributeArray.length
                    ? _attributeArray.length
                    : stateSetAttributeArray.length;
            for (var i = 0, l = max; i < l; i++) {
                var attribute;
                var attributeId = i;
                var attributeStack = _attributeArray[attributeId];

                var stateSetAttributePair = stateSetAttributeArray[attributeId];

                var hasStateAttributeStack = attributeStack !== undefined;
                var hasStateAttributeStackChanged =
                    hasStateAttributeStack && attributeStack._changed;

                if (!stateSetAttributePair && !hasStateAttributeStackChanged) continue;

                var stateSetAttribute = stateSetAttributePair
                    ? stateSetAttributePair.getAttribute()
                    : undefined;

                if (!hasStateAttributeStack) {
                    attributeStack = this._createAttributeStack(
                        _attributeArray,
                        attributeId,
                        stateSetAttribute.cloneType()
                    );
                    attributeStack._changed = true;
                    this._applyAttributeStack(stateSetAttribute, attributeStack);
                } else if (stateSetAttribute) {
                    var maskValue = stateSetAttributePair.getValue();
                    attribute = this._evaluateOverrideObjectOnStack(
                        attributeStack,
                        stateSetAttribute,
                        maskValue
                    );
                    if (attribute !== stateSetAttribute) {
                        // override

                        if (attributeStack._changed) {
                            this._applyAttributeStack(attribute, attributeStack);
                            attributeStack._changed = false;
                        }
                    } else if (this._applyAttributeStack(attribute, attributeStack)) {
                        attributeStack._changed = true;
                    }
                } else if (attributeStack._length) {
                    attributeStack._changed = false;
                    this._applyAttributeStack(attributeStack._back.object, attributeStack);
                } else {
                    attributeStack._changed = false;
                    this._applyAttributeStack(attributeStack._globalDefault, attributeStack);
                }
            }
        },

        _applyTextureAttributeMapListStateSet: function(
            _textureAttributesArrayList,
            stateSetTextureAttributeArrayList
        ) {
            var _textureAttributeArray;

            var stateSetTextureAttributeLength, stateTextureAttributeLength;

            // very interesting JIT optimizer behavior
            // max texture is supposed to be the max of activeTexture or stateSet texture list
            // if the loop is fix, for example max value that could be 16. It's faster than using the max of textureUnit of State and StateSet even if the value is 8 for example
            var maxTexture = 16;
            for (var i = 0, l = maxTexture; i < l; i++) {
                var textureUnit = i;

                _textureAttributeArray = _textureAttributesArrayList[textureUnit];
                var stateSetTextureAttributeArray = stateSetTextureAttributeArrayList[textureUnit];

                if (!_textureAttributeArray && !stateSetTextureAttributeArray) continue;

                stateSetTextureAttributeLength = stateTextureAttributeLength = 0;

                if (!_textureAttributeArray) {
                    _textureAttributeArray = this.getOrCreateTextureAttributeArray(textureUnit);
                    stateSetTextureAttributeLength = stateSetTextureAttributeArray.length;
                } else {
                    stateTextureAttributeLength = _textureAttributeArray.length;
                    if (stateSetTextureAttributeArray)
                        stateSetTextureAttributeLength = stateSetTextureAttributeArray.length;
                }

                var lt =
                    stateTextureAttributeLength > stateSetTextureAttributeLength
                        ? stateTextureAttributeLength
                        : stateSetTextureAttributeLength;
                for (var j = 0; j < lt; j++) {
                    var attributeId = j;
                    var attributeStack = _textureAttributeArray[attributeId];
                    var stateSetAttributePair = stateSetTextureAttributeArray
                        ? stateSetTextureAttributeArray[attributeId]
                        : undefined;
                    var hasStateAttributeStack = attributeStack !== undefined;
                    var hasStateAttributeStackChanged =
                        hasStateAttributeStack && attributeStack._changed;
                    var attribute;

                    if (!stateSetAttributePair && !hasStateAttributeStackChanged) continue;

                    var stateSetAttribute = stateSetAttributePair
                        ? stateSetAttributePair.getAttribute()
                        : undefined;

                    if (!hasStateAttributeStack) {
                        attribute = stateSetAttributePair.getAttribute();
                        attributeStack = this._createAttributeStack(
                            _textureAttributeArray,
                            attributeId,
                            attribute.cloneType()
                        );
                        attributeStack._changed = true;
                        this._applyTextureAttribute(textureUnit, attribute, attributeStack);
                    } else if (stateSetAttribute) {
                        var maskValue = stateSetAttributePair.getValue();
                        attribute = this._evaluateOverrideObjectOnStack(
                            attributeStack,
                            stateSetAttribute,
                            maskValue
                        );
                        if (attribute !== stateSetAttribute) {
                            // override

                            if (attributeStack._changed) {
                                this._applyTextureAttribute(textureUnit, attribute, attributeStack);
                                attributeStack._changed = false;
                            }
                        } else if (
                            this._applyTextureAttribute(textureUnit, attribute, attributeStack)
                        ) {
                            attributeStack._changed = true;
                        }
                    } else if (attributeStack._length) {
                        attributeStack._changed = false;
                        this._applyTextureAttribute(
                            textureUnit,
                            attributeStack._back.object,
                            attributeStack
                        );
                    } else {
                        attributeStack._changed = false;
                        this._applyTextureAttribute(
                            textureUnit,
                            attributeStack._globalDefault,
                            attributeStack
                        );
                    }
                }
            }
        },

        applyStateSet: function(stateset) {
            this._numApply++;

            var previousProgram = this.getLastProgramApplied();

            // needed before calling applyAttributeMap because
            // we cache needed StateAttribute from the compiler
            this._currentShaderGenerator = this.getCurrentShaderGeneratorStateSet(stateset);

            this._applyAttributeMapStateSet(this._attributeArray, stateset._attributeArray);
            this._applyTextureAttributeMapListStateSet(
                this._textureAttributeArrayList,
                stateset._textureAttributeArrayList
            );

            var lastApplied;
            if (this._currentShaderGenerator) {
                // no custom program look into the stack of ShaderGenerator name
                // what we should use to generate a program
                var generatedProgram = this._currentShaderGenerator.getOrCreateProgram(this);
                this.applyAttribute(generatedProgram);
                lastApplied = generatedProgram;

                // will cache uniform and apply them with the program
                this._applyGeneratedProgramUniforms(generatedProgram, stateset);
            } else {
                lastApplied = this.getLastProgramApplied();
                // custom program so we will iterate on uniform from the program and apply them
                // but in order to be able to use Attribute in the state graph we will check if
                // our program want them. It must be defined by the user
                this._applyCustomProgramUniforms(lastApplied, stateset);
            }

            // reset reference of last applied matrix
            if (previousProgram !== lastApplied) {
                this._lastAppliedModelViewMatrix = undefined;
                this._lastAppliedProjectionMatrix = undefined;
            }
        },

        popAllStateSets: function() {
            while (this._stateSets.length) {
                this.popStateSet();
            }
        },

        popStateSet: function() {
            if (!this._stateSets.length) return;

            var stateset = this._stateSets.pop();

            this.popAttributeMap(
                this._attributeArray,
                stateset._attributeArray,
                stateset._activeAttribute
            );

            var textureAttributeArrayList = stateset._textureAttributeArrayList;
            var activeTextureUnits = stateset._activeTextureAttributeUnit;
            var activeTextureAttribute = stateset._activeTextureAttribute;

            for (var i = 0, l = activeTextureUnits.length; i < l; i++) {
                var unit = activeTextureUnits[i];
                var _attributeArray = textureAttributeArrayList[unit];

                var textureUnitAttributeArray = this.getOrCreateTextureAttributeArray(unit);
                this.popAttributeMap(
                    textureUnitAttributeArray,
                    _attributeArray,
                    activeTextureAttribute
                );
            }

            if (stateset.hasUniform())
                this.popUniformsList(this._uniforms, stateset.getUniformList());

            if (stateset.getShaderGeneratorPair()) {
                this._shaderGeneratorNames.pop();
            }
        },

        _createAttributeStack: function(_attributeArray, index, globalDefault) {
            var attributeStack = new StackObjectPairPool();
            attributeStack._globalDefault = globalDefault;

            _attributeArray[index] = attributeStack;

            return attributeStack;
        },

        haveAppliedAttribute: function(attribute) {
            if (!attribute) return;

            var index = MACROUTILS.getOrCreateStateAttributeTypeMemberIndex(attribute);
            var attributeStack = this._attributeArray[index];
            if (!attributeStack) {
                attributeStack = this._createAttributeStack(
                    this._attributeArray,
                    index,
                    attribute.cloneType()
                );
            }
            attributeStack._lastApplied = attribute;
            attributeStack._changed = true;
        },

        applyAttribute: function(attribute) {
            var index = MACROUTILS.getOrCreateStateAttributeTypeMemberIndex(attribute);

            var _attributeArray = this._attributeArray;
            var attributeStack = _attributeArray[index];
            if (!attributeStack)
                attributeStack = this._createAttributeStack(
                    _attributeArray,
                    index,
                    attribute.cloneType()
                );

            attributeStack._changed = true;
            this._applyAttributeStack(attribute, attributeStack);
        },

        _applyAttributeStack: function(attribute, attributeStack) {
            if (attributeStack._lastApplied === attribute) return false;

            if (attribute.apply) attribute.apply(this);

            attributeStack._lastApplied = attribute;
            return true;
        },

        _applyTextureAttribute: function(unit, attribute, attributeStack) {
            if (attributeStack._lastApplied === attribute) return false;

            attributeStack._lastApplied = attribute;

            if (!attribute.apply) return true;

            var gl = this.getGraphicContext();
            gl.activeTexture(gl.TEXTURE0 + unit);

            // there is a texture we bind it.
            attribute.apply(this, unit);

            return true;
        },

        applyTextureAttribute: function(unit, attribute) {
            var index = MACROUTILS.getOrCreateTextureStateAttributeTypeMemberIndex(attribute);
            var textureUnitAttributeArray = this.getOrCreateTextureAttributeArray(unit);
            var attributeStack = textureUnitAttributeArray[index];

            if (!attributeStack)
                attributeStack = this._createAttributeStack(
                    textureUnitAttributeArray,
                    index,
                    attribute.cloneType()
                );

            attributeStack._changed = true;
            this._applyTextureAttribute(unit, attribute, attributeStack);
        },

        getLastProgramApplied: function() {
            return this._programAttribute._lastApplied;
        },

        applyDefault: function() {
            this.popAllStateSets();

            this._currentShaderGenerator = undefined;

            this.applyAttributeMap(this._attributeArray);
            this.applyTextureAttributeMapList(this._textureAttributeArrayList);
        },

        applyAttributeMap: function(_attributeArray) {
            var attributeStack;
            for (var i = 0, l = _attributeArray.length; i < l; i++) {
                attributeStack = _attributeArray[i];
                if (!attributeStack) continue;

                var attribute;
                if (attributeStack._length) attribute = attributeStack._back.object;
                else attribute = attributeStack._globalDefault;

                if (!attributeStack._changed) continue;

                if (attributeStack._lastApplied !== attribute) {
                    if (attribute.apply) attribute.apply(this);

                    attributeStack._lastApplied = attribute;
                }

                attributeStack._changed = false;
            }
        },

        pushUniformsList: function(uniformMap, stateSetUniformMap) {
            /*jshint bitwise: false */
            var name;
            var uniform;

            for (var key in stateSetUniformMap) {
                var uniformPair = stateSetUniformMap[key];
                uniform = uniformPair.getUniform();
                name = uniform.getName();
                if (!uniformMap[name]) {
                    this._createAttributeStack(uniformMap, name, uniform);
                }

                this.pushCheckOverride(uniformMap[name], uniform, uniformPair.getValue());
            }
            /*jshint bitwise: true */
        },

        popUniformsList: function(uniformMap, stateSetUniformMap) {
            for (var key in stateSetUniformMap) {
                uniformMap[key].pop();
            }
        },

        applyTextureAttributeMapList: function(textureAttributesArrayList) {
            var gl = this._graphicContext;
            var textureAttributeArray;

            for (
                var textureUnit = 0, l = textureAttributesArrayList.length;
                textureUnit < l;
                textureUnit++
            ) {
                textureAttributeArray = textureAttributesArrayList[textureUnit];
                if (!textureAttributeArray) continue;

                for (var i = 0, lt = textureAttributeArray.length; i < lt; i++) {
                    var attributeStack = textureAttributeArray[i];

                    // skip if not stack or not changed in stack
                    if (!attributeStack) continue;

                    var attribute;
                    if (attributeStack._length) attribute = attributeStack._back.object;
                    else attribute = attributeStack._globalDefault;

                    if (!attributeStack._changed) continue;

                    // if the the stack has changed but the last applied attribute is the same
                    // then we dont need to apply it again
                    if (attributeStack._lastApplied !== attribute) {
                        gl.activeTexture(gl.TEXTURE0 + textureUnit);
                        attribute.apply(this, textureUnit);

                        attributeStack._lastApplied = attribute;
                    }

                    attributeStack._changed = false;
                }
            }
        },

        setGlobalDefaultAttribute: function(attribute) {
            var _attributeArray = this._attributeArray;
            var index = MACROUTILS.getOrCreateStateAttributeTypeMemberIndex(attribute);
            if (_attributeArray[index] === undefined) {
                this._createAttributeStack(_attributeArray, index, attribute);
            } else {
                _attributeArray[index]._globalDefault = attribute;
            }
        },

        getGlobalDefaultAttribute: function(typeMember) {
            var _attributeArray = this._attributeArray;
            var index = MACROUTILS.getIdFromTypeMember(typeMember);
            if (index === undefined) return undefined;
            return _attributeArray[index] ? _attributeArray[index]._globalDefault : undefined;
        },

        setGlobalDefaultTextureAttribute: function(unit, attribute) {
            var _attributeArray = this.getOrCreateTextureAttributeArray(unit);
            var index = MACROUTILS.getOrCreateTextureStateAttributeTypeMemberIndex(attribute);

            if (_attributeArray[index] === undefined) {
                this._createAttributeStack(_attributeArray, index, attribute);
            } else {
                _attributeArray[index]._globalDefault = attribute;
            }
        },

        getGlobalDefaultTextureAttribute: function(unit, typeMember) {
            var _attributeArray = this.getOrCreateTextureAttributeArray(unit);
            var index = MACROUTILS.getTextureIdFromTypeMember(typeMember);
            if (index === undefined) return undefined;
            return _attributeArray[index] ? _attributeArray[index]._globalDefault : undefined;
        },

        getOrCreateTextureAttributeArray: function(unit) {
            if (!this._textureAttributeArrayList[unit]) this._textureAttributeArrayList[unit] = [];
            return this._textureAttributeArrayList[unit];
        },

        pushAttributeMap: function(_attributeArray, stateSetAttributeArray, validAttributeArray) {
            /*jshint bitwise: false */
            var attributeStack;

            for (var i = 0, l = validAttributeArray.length; i < l; i++) {
                var index = validAttributeArray[i];
                var attributePair = stateSetAttributeArray[index];
                var attribute = attributePair.getAttribute();

                attributeStack = _attributeArray[index];
                if (!attributeStack) {
                    this._createAttributeStack(_attributeArray, index, attribute.cloneType());
                    attributeStack = _attributeArray[index];
                }

                this.pushCheckOverride(attributeStack, attribute, attributePair.getValue());
                attributeStack._changed = true;
            }
        },

        popAttributeMap: function(_attributeArray, stateSetAttributeArray, activeAttribute) {
            for (var i = 0, l = activeAttribute.length; i < l; i++) {
                var index = activeAttribute[i];
                var attributeStack = _attributeArray[index];

                attributeStack.pop();
                attributeStack._changed = true;
            }
        },

        setIndexArray: function(array) {
            var gl = this._graphicContext;

            if (this._currentIndexVBO !== array) {
                array.bind(gl);
                this._currentIndexVBO = array;
            }

            if (array.isDirty()) {
                array.compile(gl);
            }
        },

        lazyDisablingOfVertexAttributes: function() {
            var keys = this._vertexAttribMap._keys;
            for (var i = 0, l = keys.length; i < l; i++) {
                var attr = keys[i];
                if (this._vertexAttribMap[attr]) {
                    this._vertexAttribMap._disable[attr] = true;
                }
            }
        },

        enableVertexColor: function() {
            var program = this._programAttribute._lastApplied;

            if (
                !program.getUniformsCache().uArrayColorEnabled ||
                !program.getAttributesCache().Color
            )
                return; // no color uniform or attribute used, exit

            // update uniform
            var uniform = this._uniforms.ArrayColorEnabled._globalDefault;

            var previousColorEnabled = this._previousColorAttribPair[program.getInstanceID()];

            if (!previousColorEnabled) {
                uniform.setFloat(1.0);
                uniform.apply(
                    this.getGraphicContext(),
                    program.getUniformsCache().uArrayColorEnabled
                );
                this._previousColorAttribPair[program.getInstanceID()] = true;
            }
        },

        disableVertexColor: function() {
            var program = this._programAttribute._lastApplied;

            if (
                !program.getUniformsCache().uArrayColorEnabled ||
                !program.getAttributesCache().Color
            )
                return; // no color uniform or attribute used, exit

            // update uniform
            var uniform = this._uniforms.ArrayColorEnabled._globalDefault;

            var previousColorEnabled = this._previousColorAttribPair[program.getInstanceID()];

            if (previousColorEnabled) {
                uniform.setFloat(0.0);
                uniform.apply(
                    this.getGraphicContext(),
                    program.getUniformsCache().uArrayColorEnabled
                );
                this._previousColorAttribPair[program.getInstanceID()] = false;
            }
        },

        applyDisablingOfVertexAttributes: function() {
            var keys = this._vertexAttribMap._keys;
            for (var i = 0, l = keys.length; i < l; i++) {
                if (this._vertexAttribMap._disable[keys[i]] === true) {
                    var attr = keys[i];
                    this._graphicContext.disableVertexAttribArray(attr);
                    this._vertexAttribMap._disable[attr] = false;
                    this._vertexAttribMap[attr] = false;
                }
            }
        },

        clearVertexAttribCache: function() {
            var vertexAttribMap = this._vertexAttribMap;
            var keys = vertexAttribMap._keys;
            for (var i = 0, l = keys.length; i < l; i++) {
                var attr = keys[i];
                vertexAttribMap[attr] = undefined;
                vertexAttribMap._disable[attr] = false;
            }

            this._vertexAttribMap._disable.length = 0;
            this._vertexAttribMap._keys.length = 0;
        },

        /**
     *  set a vertex array object.
     *  return true if binded the vao and false
     *  if was already binded
     */
        setVertexArrayObject: function(vao) {
            if (this._currentVAO !== vao) {
                this._graphicContext.bindVertexArray(vao);
                this._currentVAO = vao;

                // disable cache to force a re enable of array
                if (!vao) this.clearVertexAttribCache();

                // disable currentIndexVBO to force to bind indexArray from Geometry
                // if there is a change of vao
                this._currentIndexVBO = undefined;

                return true;
            }
            return false;
        },

        setVertexAttribArray: function(attrib, array, normalize) {
            var vertexAttribMap = this._vertexAttribMap;
            vertexAttribMap._disable[attrib] = false;
            var gl = this._graphicContext;
            var binded = false;

            if (array.isDirty()) {
                array.bind(gl);
                array.compile(gl);
                binded = true;
            }

            var currentArray = vertexAttribMap[attrib];
            if (currentArray !== array) {
                if (!binded) {
                    array.bind(gl);
                }

                if (!currentArray) {
                    gl.enableVertexAttribArray(attrib);

                    // can be === false (so undefined check is important)
                    if (currentArray === undefined) vertexAttribMap._keys.push(attrib);
                }

                vertexAttribMap[attrib] = array;
                gl.vertexAttribPointer(
                    attrib,
                    array.getItemSize(),
                    array.getType(),
                    normalize,
                    0,
                    0
                );
            }
        },

        _getActiveUniformsFromProgramAttributes: function(program, activeUniformsList) {
            var _attributeArrayStack = this._attributeArray;

            var attributeKeys = program.getTrackAttributes().attributeKeys;

            if (attributeKeys.length > 0) {
                for (var i = 0, l = attributeKeys.length; i < l; i++) {
                    var key = attributeKeys[i];
                    var index = this.typeMember[key];
                    var attributeStack = _attributeArrayStack[index];
                    if (attributeStack === undefined) {
                        continue;
                    }

                    // we just need the uniform list and not the attribute itself
                    var attribute = attributeStack._globalDefault;
                    if (attribute.getOrCreateUniforms === undefined) {
                        continue;
                    }

                    var uniformMap = attribute.getOrCreateUniforms();
                    for (var keyUniform in uniformMap) {
                        activeUniformsList.push(uniformMap[keyUniform]);
                    }
                }
            }
        },

        _getActiveUniformsFromProgramTextureAttributes: function(program, activeUniformsList) {
            var textureAttributeKeysList = program.getTrackAttributes().textureAttributeKeys;
            if (textureAttributeKeysList === undefined) return;

            for (var unit = 0, nbUnit = textureAttributeKeysList.length; unit < nbUnit; unit++) {
                var textureAttributeKeys = textureAttributeKeysList[unit];
                if (textureAttributeKeys === undefined) continue;

                var unitTextureAttributeList = this._textureAttributeArrayList[unit];
                if (unitTextureAttributeList === undefined) continue;

                for (var i = 0, l = textureAttributeKeys.length; i < l; i++) {
                    var key = textureAttributeKeys[i];

                    var attributeStack = unitTextureAttributeList[key];
                    if (attributeStack === undefined) {
                        continue;
                    }
                    // we just need the uniform list and not the attribute itself
                    var attribute = attributeStack._globalDefault;
                    if (attribute.getOrCreateUniforms === undefined) {
                        continue;
                    }
                    var uniformMap = attribute.getOrCreateUniforms();
                    for (var keyUniform in uniformMap) {
                        activeUniformsList.push(uniformMap[keyUniform]);
                    }
                }
            }
        },

        _cacheUniformsForCustomProgram: function(program, activeUniformsList) {
            this._getActiveUniformsFromProgramAttributes(program, activeUniformsList);

            this._getActiveUniformsFromProgramTextureAttributes(program, activeUniformsList);

            var gl = this._graphicContext;

            // now we have a list on uniforms we want to track but we will filter them to use only what is needed by our program
            // not that if you create a uniforms whith the same name of a tracked attribute, and it will override it
            var uniformsFinal = {};

            for (var i = 0, l = activeUniformsList.length; i < l; i++) {
                var u = activeUniformsList[i];
                var uniformName = u.getName();
                var loc = gl.getUniformLocation(program._program, uniformName);
                if (loc !== undefined && loc !== null) {
                    uniformsFinal[uniformName] = u;
                }
            }
            program.trackUniforms = uniformsFinal;
        },

        _applyCustomProgramUniforms: (function() {
            var activeUniformsList = [];

            return function(program, stateset) {
                // custom program so we will iterate on uniform from the program and apply them
                // but in order to be able to use Attribute in the state graph we will check if
                // our program want them. It must be defined by the user

                // first time we see attributes key, so we will keep a list of uniforms from attributes
                activeUniformsList.length = 0;

                // fill the program with cached active uniforms map from attributes and texture attributes
                if (
                    program.getTrackAttributes() !== undefined &&
                    program.trackUniforms === undefined
                ) {
                    this._cacheUniformsForCustomProgram(program, activeUniformsList);
                }

                var programUniformMap = program.getUniformsCache();
                var uniformMapStack = this._uniforms;

                var programTrackUniformMap;
                if (program.trackUniforms) programTrackUniformMap = program.trackUniforms;

                var uniform;
                for (var uniformName in programUniformMap) {
                    var location = programUniformMap[uniformName];
                    var uniformStack = uniformMapStack[uniformName];

                    var hasStateSetUniformPair = stateset && stateset.uniforms[uniformName];

                    if (!uniformStack && !hasStateSetUniformPair) {
                        if (programTrackUniformMap === undefined) {
                            this._checkErrorUniform(uniformName);
                            continue;
                        }

                        uniform = programTrackUniformMap[uniformName];
                    } else if (hasStateSetUniformPair) {
                        var stateSetUniformPair = stateset.uniforms[uniformName];
                        var maskValue = stateSetUniformPair.getValue();
                        var stateSetUniform = stateSetUniformPair.getUniform();
                        if (uniformStack)
                            uniform = this._evaluateOverrideObjectOnStack(
                                uniformStack,
                                stateSetUniform,
                                maskValue
                            );
                        else uniform = stateSetUniform;
                    } else if (uniformStack._length) {
                        uniform = uniformStack._back.object;
                    } else {
                        uniform = uniformStack._globalDefault;
                    }

                    uniform.apply(this._graphicContext, location);
                }
            };
        })(),

        _checkErrorUniform: function(uniformName) {
            var unit = uniformName.substr(7);
            if (this._textureAttributeArrayList[unit] && uniformName === 'Texture' + unit) {
                return;
            }

            if (STANDARD_UNIFORMS[uniformName]) {
                return;
            }

            STANDARD_UNIFORMS[uniformName] = 1; // avoid multiple spammy errors

            Notify.error('Uniform not in the scene hierarchy : ' + uniformName);
        },

        _computeForeignUniforms: function(programUniformMap, activeUniformMap) {
            var foreignUniforms = [];

            for (var keyUniform in programUniformMap) {
                var location = programUniformMap[keyUniform];

                // filter 'standard' uniform matrix that will be applied for all shader
                if (location !== undefined && activeUniformMap[keyUniform] === undefined) {
                    if (!STANDARD_UNIFORMS[keyUniform]) {
                        foreignUniforms.push(keyUniform);
                    }
                }
            }

            return foreignUniforms;
        },

        _removeUniformsNotRequiredByProgram: function(activeUniformMap, programUniformMap) {
            for (var keyUniform in activeUniformMap) {
                var location = programUniformMap[keyUniform];
                if (location === undefined || location === null) {
                    delete activeUniformMap[keyUniform];
                }
            }
        },

        _cacheUniformsForGeneratedProgram: function(program) {
            var shaderUniforms = program.getUniformsCache(); // declared in the shader
            var stateSetUniforms = program.getActiveUniforms(); // present in last stateset

            var foreignUniforms = this._computeForeignUniforms(shaderUniforms, stateSetUniforms);
            program.setForeignUniforms(foreignUniforms);

            // remove uniforms listed by attributes (getActiveUniforms) but not required by the program
            this._removeUniformsNotRequiredByProgram(stateSetUniforms, shaderUniforms);
        },

        _copyUniformEntry: function(uniform) {
            var internalArray = uniform.getInternalArray();
            var cacheData;
            if (internalArray.length < 16) {
                cacheData = new internalArray.constructor(internalArray.length);
            }

            return cacheData;
        },

        _initUniformCache: function(program) {
            var activeUniformMap = program.getActiveUniforms();

            var foreignUniformKeys = program.getForeignUniforms();
            var uniformMapStack = this._uniforms;

            var cacheForeignUniforms = [];
            var cacheActiveUniforms = [];

            var i, l, cache, name, cacheData, uniform;

            program._cacheUniformId = this._cacheUniformId++;
            this._programUniformCache[program._cacheUniformId] = {};

            if (foreignUniformKeys.length) {
                cache = cacheForeignUniforms;
                for (i = 0, l = foreignUniformKeys.length; i < l; i++) {
                    name = foreignUniformKeys[i];
                    var uniStack = uniformMapStack[name];
                    if (uniStack) {
                        uniform = uniStack._globalDefault;
                        cacheData = this._copyUniformEntry(uniform);
                        cache.push(cacheData);
                    }
                }
            }

            for (var keyUniform in activeUniformMap) {
                uniform = activeUniformMap[keyUniform];
                cacheData = this._copyUniformEntry(uniform);
                cacheActiveUniforms.push(cacheData);
            }

            this._programUniformCache[program._cacheUniformId].foreign = cacheForeignUniforms;
            this._programUniformCache[program._cacheUniformId].active = cacheActiveUniforms;
        },

        _checkCacheAndApplyUniform: function(
            uniform,
            cacheArray,
            indexCache,
            programUniformMap,
            nameUniform
        ) {
            var isCached;
            var internalArray = uniform.getInternalArray();
            var uniformArrayLength = internalArray.length;
            if (uniformArrayLength <= 4) {
                var uniformCache = cacheArray[indexCache];
                isCached = checkUniformCache[uniformArrayLength](internalArray, uniformCache);
            } else {
                isCached = false;
            }

            if (!isCached) {
                var location = programUniformMap[nameUniform];
                uniform.apply(this._graphicContext, location);
            }
        },

        // note that about TextureAttribute that need uniform on unit we would need to improve
        // the current uniformList ...

        // when we apply the shader for the first time, we want to compute the active uniforms for this shader and the list of uniforms not extracted from attributes called foreignUniforms
        _applyGeneratedProgramUniforms: function(program, stateset) {
            var uniformMapStack = this._uniforms;
            var uniform, uniformName, uniformStack, i;

            var foreignUniformKeys = program.getForeignUniforms();
            if (!foreignUniformKeys) {
                this._cacheUniformsForGeneratedProgram(program);
                foreignUniformKeys = program.getForeignUniforms();

                // be sure to create a stack for foreign uniform for this program
                // it's needed to do it here because of the cache of uniform
                if (stateset) {
                    var stateSetUniforms = stateset.uniforms;
                    for (i = 0; i < foreignUniformKeys.length; i++) {
                        uniformName = foreignUniformKeys[i];

                        // already exist
                        if (uniformMapStack[uniformName]) continue;

                        // does not exist check to initialize with stateSet uniforms
                        if (!stateSetUniforms[uniformName]) continue;

                        uniform = stateSetUniforms[uniformName].getUniform();
                        this._createAttributeStack(uniformMapStack, uniformName, uniform);
                    }
                }

                this._initUniformCache(program);
            }

            var programUniformMap = program.getUniformsCache();
            var activeUniformMap = program.getActiveUniforms();

            var cacheUniformsActive = this._programUniformCache[program._cacheUniformId].active;
            var cacheUniformsForeign = this._programUniformCache[program._cacheUniformId].foreign;

            // apply active uniforms
            // caching uniforms from attribtues make it impossible to overwrite uniform with a custom uniform instance not used in the attributes
            var indexCache = 0;
            for (var keyUniform in activeUniformMap) {
                uniform = activeUniformMap[keyUniform];
                this._checkCacheAndApplyUniform(
                    uniform,
                    cacheUniformsActive,
                    indexCache,
                    programUniformMap,
                    keyUniform
                );
                indexCache++; // TODO not good, for in ordered consistency, etc...
            }

            // apply now foreign uniforms, it's uniforms needed by the program but not contains in attributes used to generate this program
            indexCache = 0;
            var nbForeigns = foreignUniformKeys.length;
            for (i = 0; i < nbForeigns; i++) {
                uniformName = foreignUniformKeys[i];

                uniformStack = uniformMapStack[uniformName];
                var hasStateSetUniformPair = stateset && stateset.uniforms[uniformName];

                if (!hasStateSetUniformPair && !uniformStack) {
                    this._checkErrorUniform(uniformName);
                    continue;
                }

                if (hasStateSetUniformPair) {
                    var stateSetUniformPair = stateset.uniforms[uniformName];
                    var maskValue = stateSetUniformPair.getValue();
                    var stateSetUniform = stateSetUniformPair.getUniform();
                    uniform = this._evaluateOverrideObjectOnStack(
                        uniformStack,
                        stateSetUniform,
                        maskValue
                    );
                } else if (uniformStack._length) {
                    uniform = uniformStack._back.object;
                } else {
                    uniform = uniformStack._globalDefault;
                    this._checkErrorUniform(uniformName);
                }

                this._checkCacheAndApplyUniform(
                    uniform,
                    cacheUniformsForeign,
                    indexCache,
                    programUniformMap,
                    uniformName
                );
                indexCache++;
            }
        },

        // Use to detect changes in RenderLeaf between call to avoid to applyStateSet
        _setStateSetsDrawID: function(id) {
            var values = this._stateSets.getArray();
            for (var i = 0, nbStateSets = this._stateSets.length; i < nbStateSets; i++) {
                values[i].setDrawID(id);
            }
        },

        _stateSetStackChanged: function(id, nbLast) {
            var values = this._stateSets.getArray();
            var nbStateSets = this._stateSets.length;
            if (nbLast !== nbStateSets) return true;

            for (var i = 0; i < nbStateSets; i++) {
                if (id !== values[i].getDrawID()) return true;
            }

            return false;
        }
    }),
    'osg',
    'State'
);

module.exports = State;
