import utils from 'osg/utils';
import notify from 'osg/notify';
import Node from 'osgShader/node/Node';

/*

Nodes are automatically created when parsing a glsl file

=== function name ===
* First letter of your glsl function will be converted to upperCase
* You can override the function name with NODE_NAME:myNewName

=== variable name ===
* The output variable is always named result, other variable names are unchanged
* You can override a variable name by writing glslName:jsName

=== overloading matching ===
* Overloading is supported, it will select the best matching depending of the js inputs/outputs
* For now you need to put the overload functions in the same glsl file
* Overloading will prioritize variable name matching first, then output types, and finally input types
* When there is a mismatch in types, it'll downcast your input (e.g: by transforming your vec4 into a vec3)

=== misc ===
* Shader nodes have a function addExtensions if you want to enable extensions
* Shader nodes have a function addDefines if you want to provides defines

* /!\ hack: Extensions in pragma is partially supported: for now only by writing DERIVATIVES:enable after the pragma will work

* /!\ hack: you can declare functions as defines too but it will only perform name checking
            No type checking/downcasting and no in/out validation

* /!\ hack: Optional argument are handled with define that have the structure : OPT_ARG_myOptVar
            The variable will be named myOptVar in that example
            No type checking/downcasting and no in/out validation for the optional variable


Try to stick with the simple example if possible

============================
====== SIMPLE EXAMPLE ======
============================

---- glsl ----
#pragma DECLARE_FUNCTION
vec3 myFunc(const in float myVarIn, out float myVarOut) {
    // do stuffs
}

---- js ----
this.getNode('MyFunc')
    .inputs({
        myVarIn: var1
    })
    .outputs({
        result: var2,
        myVarOut: var3
    });

============================
====== COMPLEX EXAMPLE =====
============================

---- glsl ----
#pragma DECLARE_FUNCTION NODE_NAME:myFuncTiti result:resOut myVarIn:totoIn optVariable:optVar DERIVATIVES:enable
vec3 myFunc(const in float myVarIn, out float myVarOut, OPT_ARG_optVariable) {
    // do stuffs
}

---- js ----
this.getNode('myFuncTiti')
    .inputs({
        totoIn: var1,
        optVar: var2
    })
    .outputs({
        resOut: var4,
        myVarOut: var5
    })
    .addDefines(['#define TOTO']);

*/

var sprintf = function(string, args) {
    if (!string || !args) {
        return '';
    }

    var arg;

    for (var index in args) {
        arg = args[index];

        if (arg === undefined) {
            continue;
        }

        if (arg.getVariable) {
            arg = arg.getVariable();
        }
        string = string.replace('%s', arg);
    }
    return string;
};

var checkVariableType = function(vars, optionalPrefix) {
    var inputs = vars;
    var varsList = [];
    var prefix = optionalPrefix;
    if (optionalPrefix === undefined) {
        prefix = '';
    }

    for (var i = 0, l = inputs.length; i < l; i++) {
        var variable = inputs[i];
        var output;

        if (variable === undefined) {
            output = 'undefined';
        } else if (typeof variable === 'string') {
            output = variable;
        } else if (variable.getType) {
            output = variable.getType() + ' ' + variable.getVariable();
        } else {
            output = variable.getVariable();
        }

        varsList.push(prefix + output);
    }

    return varsList;
};

var callFunction = function(funcName, output, inputs) {
    var osgShader = require('osgShader/osgShader').default;

    var debug = [];
    var callString = '';

    // debug
    if (osgShader.debugShaderNode) {
        debug.push('\n// output');
        Array.prototype.push.apply(debug, checkVariableType([output], '// '));
    }

    if (output) {
        callString = (output.getVariable ? output.getVariable() : output) + ' = ';
    }

    callString = callString + funcName + '( ';

    if (inputs && inputs.length > 0) {
        // debug
        if (osgShader.debugShaderNode) {
            debug.push('// inputs');
            Array.prototype.push.apply(debug, checkVariableType(inputs, '// '));
        }

        for (var i = 0, l = inputs.length; i < l; i++) {
            callString += inputs[i].getVariable ? inputs[i].getVariable() : inputs[i];
            if (i !== l - 1) callString += ', ';
        }
    }

    callString += ' );\n';

    if (osgShader.debugShaderNode) {
        return debug.join('\n') + '\n' + callString;
    }

    return callString;
};

var extractPragmaArgs = function(option) {
    // extract glslVar:jsVar pattern
    // res: ["DERIVATIVES:enable", "glslVarIn:jsVarIn", "glslVarOut:jsVarOut"]
    var res = option.match(/([^\s]+):([^\s]+)/g);

    var map = {};
    if (!res) return map;

    for (var i = 0; i < res.length; ++i) {
        var split = res[i].split(':');
        map[split[0]] = split[1];
    }

    return map;
};

var extractSignature = function(option, signature) {
    var openParen = signature.indexOf('(');
    var closeParen = signature.indexOf(')');

    // preSignature: "vec3 myFunction"
    var preSignature = signature.substring(0, openParen);
    preSignature = preSignature
        .replace(/[\r\n|\r|\n]/g, '')
        .trim()
        .replace(/\s+/g, ' ');

    var splitPre = preSignature.split(/\s/);
    var firstWord = splitPre[0];
    var nameFunc = splitPre[1];

    // override variable names
    var pragmaArgs = extractPragmaArgs(option);
    var returnName = pragmaArgs.result || 'result';

    // override node name
    var nodeName = pragmaArgs.NODE_NAME;
    if (!nodeName) {
        nodeName = nameFunc[0].toUpperCase() + nameFunc.substring(1);
    }

    // extensions
    var extensions = [];
    if (pragmaArgs.DERIVATIVES) {
        extensions.push('#extension GL_OES_standard_derivatives : ' + pragmaArgs.DERIVATIVES);
    }

    var outputs = [];
    var returnVariable;
    var isDefine = firstWord === '#define';
    // return variable
    if (firstWord !== 'void') {
        returnVariable = {
            name: returnName,
            type: !isDefine && firstWord
        };
        outputs.push(returnVariable);
    }

    // postSignature: "const in vec3 varIn,    const out float varOut"
    var postSignature = signature.substring(openParen + 1, closeParen);
    postSignature = postSignature.replace(/[\r\n|\r|\n]/g, '');

    // array of arguments
    var argumentList = postSignature.split(/OPT_ARG_|,/);
    var hasOptionalArgs = postSignature.indexOf('OPT_ARG_') !== -1;

    var inputs = [];
    var orderedArgs = [];
    for (var i = 0; i < argumentList.length; ++i) {
        var argi = argumentList[i];
        if (!argi) continue;

        // cleanArg: "const in vec3 varIn"
        var cleanArg = argi
            .trim()
            .replace(/\s+/g, ' ')
            .split('[')[0];
        var splits = cleanArg.split(/\s/);
        var nbSplits = splits.length;

        var isOutput = nbSplits >= 3 && splits[nbSplits - 3].indexOf('out') !== -1;
        var glslName = splits[nbSplits - 1];
        var res = {
            isOutput: isOutput,
            type: splits[nbSplits - 2],
            name: pragmaArgs[glslName] || glslName,
            optional: hasOptionalArgs && postSignature.indexOf('OPT_ARG_' + glslName) !== -1
        };

        orderedArgs.push(res);
        if (res.optional) continue;

        if (isOutput) outputs.push(res);
        else inputs.push(res);
    }

    return {
        nodeName: nodeName,
        functionName: nameFunc,
        signature: {
            returnVariable: returnVariable,
            orderedArgs: orderedArgs,
            outputs: outputs,
            inputs: inputs,
            extensions: extensions
        }
    };
};

var createNode = function(res, fileName) {
    var NodeCustom = function() {
        Node.call(this);
        this._defines = [];
        this._extensions = [];
        this._missingArgs = false;
    };

    utils.createPrototypeObject(
        NodeCustom,
        utils.objectInherit(Node.prototype, {
            type: res.nodeName,
            signatures: [res.signature],
            globalDeclare: '#pragma include "' + fileName + '"',

            checkInputsOutputs: function() {},

            globalFunctionDeclaration: function() {
                return this.globalDeclare;
            },

            addExtensions: function(exts) {
                this._extensions.push.apply(this._extensions, exts);
                return this;
            },

            getExtensions: function() {
                this.getOrCreateSignature();
                return this._extensions;
            },

            addDefines: function(defines) {
                this._defines.push.apply(this._defines, defines);
                return this;
            },

            getDefines: function() {
                return this._defines;
            },

            _validateSameVariables: function(glslArray, jsObj) {
                var nbGlsl = glslArray.length;
                for (var i = 0; i < nbGlsl; ++i) {
                    if (!jsObj[glslArray[i].name]) return false;
                }
                return glslArray.length === Object.keys(jsObj).length;
            },

            _validateSameType: function(glslArray, jsObj) {
                var nbGlsl = glslArray.length;
                for (var i = 0; i < nbGlsl; ++i) {
                    var jsVar = jsObj[glslArray[i].name];
                    if (jsVar.getType() !== glslArray[i].type) return false;
                }
                return true;
            },

            _getSignatureBestMatch: function() {
                if (this.signatures.length === 1) return this.signatures[0];

                var matchNames = [];
                var matchOutput = [];
                var matchInput = [];
                var nbSignatures = this.signatures.length;
                for (var i = 0; i < nbSignatures; ++i) {
                    var sig = this.signatures[i];
                    if (!this._validateSameVariables(sig.outputs, this._outputs)) continue;
                    if (!this._validateSameVariables(sig.inputs, this._inputs)) continue;
                    matchNames.push(sig);

                    if (!this._validateSameType(sig.outputs, this._outputs)) continue;
                    matchOutput.push(sig);

                    if (!this._validateSameType(sig.inputs, this._inputs)) continue;
                    matchInput.push(sig);
                }

                if (!matchNames.length) return this.signatures[0];
                if (matchNames.length === 1 || !matchOutput.length) return matchNames[0];
                if (matchOutput.length === 1 || !matchInput.length) return matchOutput[0];
                return matchInput[0];
            },

            getOrCreateSignature: function() {
                if (!this._signature) {
                    this._signature = this._getSignatureBestMatch();
                    this.addExtensions(this._signature.extensions);
                }
                return this._signature;
            },

            _typeDownCast: function(glslArg) {
                var jsArg;
                if (glslArg.optional) {
                    jsArg = this._inputs[glslArg.name] || this._outputs[glslArg.name];
                    if (!jsArg) return;
                } else {
                    jsArg = glslArg.isOutput
                        ? this._outputs[glslArg.name]
                        : this._inputs[glslArg.name];
                }

                if (!jsArg) {
                    var typeIn = glslArg.isOutput ? 'output' : 'input';
                    notify.error(
                        'missing ' + typeIn + ' ' + glslArg.name + ' on NodeCustom ' + res.nodeName
                    );
                    this._missingArgs = true;
                    return;
                }

                var realType = jsArg.getType();
                var validType = glslArg.type;

                if (!validType || validType === realType) return jsArg;
                if (validType === 'vec3') return jsArg.getVariable() + '.rgb';
                if (validType === 'vec2') return jsArg.getVariable() + '.rg';
                if (validType === 'float') return jsArg.getVariable() + '.r';
                return jsArg;
            },

            computeShader: function() {
                var signature = this.getOrCreateSignature();

                var ret = signature.returnVariable && signature.returnVariable.name;
                var returnOut = ret ? this._outputs[ret] : undefined;
                if (ret && !returnOut) {
                    notify.error('missing output ' + ret + ' on NodeCustom ' + res.nodeName);
                    this._missingArgs = true;
                }

                var orderedArgs = [];
                for (var i = 0; i < signature.orderedArgs.length; ++i) {
                    var input = this._typeDownCast(signature.orderedArgs[i]);
                    if (input) orderedArgs.push(input);
                }

                if (this._missingArgs) return '';
                return callFunction(res.functionName, returnOut, orderedArgs);
            }
        }),
        'osgShader',
        res.nodeName
    );

    return NodeCustom;
};

var shaderNodeClassGlobal = {};

var extractFunctions = function(shaderLib, fileName) {
    var signatures = shaderLib[fileName].split(/#pragma DECLARE_FUNCTION(.*)[\r\n|\r|\n]/);
    var nbSignatures = (signatures.length - 1) / 2;

    var shaderNodeClassLocal = {};
    for (var i = 0; i < nbSignatures; ++i) {
        var result = extractSignature(signatures[i * 2 + 1], signatures[i * 2 + 2]);
        var nodeName = result.nodeName;
        var shaderNode = shaderNodeClassLocal[nodeName];
        if (shaderNode) {
            shaderNode.prototype.signatures.push(result.signature);
            continue;
        }
        // new shadernode in this local shaderLib
        shaderNode = shaderNodeClassGlobal[nodeName];
        if (shaderNode) {
            // replace shader node globally
            shaderNode.prototype.signatures = [result.signature];
            shaderNode.prototype.globalDeclare = '#pragma include "' + fileName + '"';
        } else {
            shaderNode = createNode(result, fileName);
        }
        shaderNodeClassLocal[nodeName] = shaderNode;
        shaderNodeClassGlobal[nodeName] = shaderNode;
    }

    return shaderNodeClassLocal;
};

export default {
    callFunction: callFunction,
    checkVariableType: checkVariableType,
    sprintf: sprintf,
    extractFunctions: extractFunctions
};
