import notify from 'osg/notify';
import utils from 'osg/utils';
import Node from 'osgShader/node/Node';

// Abstract class
// base operator contains helper for the constructor
// it helps to do that:
// arg0 = output
// arg1 = input0 or [ inputs ]
// arg2 = input1
// ...
var BaseOperator = function() {
    Node.call(this);
};

BaseOperator.prototype = Node.prototype;

// Add support this syntax:
// new Add( output, input0, input1, ... )
// new Add( output, [ inputs ] )
// glsl code output = input0 + input1 +...
var Add = function() {
    BaseOperator.call(this);
};

utils.createPrototypeObject(
    Add,
    utils.objectInherit(BaseOperator.prototype, {
        type: 'Add',

        operator: '+',

        _getFirstVariableCast: function() {
            var variable = this._inputs[0].getVariable();
            var inType = this._inputs[0].getType();
            var outType = this._outputs.getType();

            if (outType === inType) return variable;

            // upcast float
            if (inType === 'float') return outType + '(' + variable + ')';

            // downcast vector
            if (outType === 'vec3') return variable + '.rgb';
            if (outType === 'vec2') return variable + '.rg';
            if (outType === 'float') return variable + '.r';

            notify.error('Mismatch type : ' + outType + ' with ' + inType + ', ' + variable);
            return variable;
        },

        computeShader: function() {
            // force inputs type to be all the same from the output
            var outputType = this._outputs.getType();
            var addType = '';

            if (outputType === 'vec4') addType = '.rgba';
            else if (outputType === 'vec3') addType = '.rgb';
            else if (outputType === 'vec2') addType = '.rg';

            var firstVariable = this._getFirstVariableCast();
            var str = this._outputs.getVariable() + ' = ' + firstVariable;

            for (var i = 1, l = this._inputs.length; i < l; i++) {
                var input = this._inputs[i];
                str += this.operator + input.getVariable();

                var inType = input.getType();
                if (inType !== 'float' && inType !== outputType) {
                    str += addType;
                }
            }
            str += ';';
            return str;
        }
    }),
    'osgShader',
    'Add'
);

// Mult works like Add
// glsl code output = input0 * input1 * ...
var Mult = function() {
    Add.call(this);
};

utils.createPrototypeObject(
    Mult,
    utils.objectInherit(Add.prototype, {
        type: 'Mult',
        operator: '*'
    }),
    'osgShader',
    'Mult'
);

// basic assignement alias: output = input
// glsl code output = input0
var SetFromNode = function() {
    Add.call(this);
};

utils.createPrototypeObject(
    SetFromNode,
    utils.objectInherit(Add.prototype, {
        type: 'SetFromNode'
    }),
    'osgShader',
    'SetFromNode'
);

// Mult Matrix * vector4
// making the cast vector4(input.xyz, 0)
// if needed
// glsl code output = matrix * vector4(vec.xyz, 0)
var MatrixMultDirection = function() {
    Add.call(this);
    this._overwriteW = true; // if set to false, we copy the input alpha in the output alpha
    this._forceComplement = true;
    this._inverseOp = false;
};

utils.createPrototypeObject(
    MatrixMultDirection,
    utils.objectInherit(Add.prototype, {
        type: 'MatrixMultDirection',
        operator: '*',
        validInputs: ['vec', 'matrix'],
        validOutputs: ['vec'],
        complement: '0.',
        setInverse: function(bool) {
            this._inverseOp = bool;
            return this;
        },
        setForceComplement: function(bool) {
            this._forceComplement = bool;
            return this;
        },
        setOverwriteW: function(bool) {
            this._overwriteW = bool;
            return this;
        },
        computeShader: function() {
            // force inputs type to be all the same from the output
            // and handle vector complement
            var vecIn = this._inputs.vec.getVariable();
            var matrix = this._inputs.matrix.getVariable();
            var vecOut = this._outputs.vec.getVariable();

            var inputType = this._inputs.vec.getType();
            var outputType = this._outputs.vec.getType();
            var matrixType = this._inputs.matrix.getType();

            var strOut = vecOut;

            if (matrixType === 'mat4') {
                strOut += ' = ';

                if (outputType !== 'vec4') strOut += outputType + '(';

                var strCasted = vecIn;
                if (this._forceComplement || inputType !== 'vec4')
                    strCasted = 'vec4(' + vecIn + '.xyz, ' + this.complement + ')';

                strOut += this._inverseOp
                    ? strCasted + this.operator + matrix
                    : matrix + this.operator + strCasted;

                if (outputType !== 'vec4') strOut += ')';

                strOut += ';';

                if (!this._overwriteW && inputType === 'vec4')
                    strOut += '\n' + vecOut + '.a = ' + vecIn + '.a;';
            } else {
                if (outputType === 'vec4') strOut += '.xyz';
                strOut += ' = ';

                var strvec3 = vecIn + '.xyz';
                strOut +=
                    (this._inverseOp
                        ? strvec3 + this.operator + matrix
                        : matrix + this.operator + strvec3) + ';';

                if (!this._overwriteW && outputType === 'vec4' && inputType === 'vec4')
                    strOut += '\n' + vecOut + '.a = ' + vecIn + '.a;';
            }

            return strOut;
        }
    }),
    'osgShader',
    'MatrixMultDirection'
);

// override only for complement.
// glsl code output = matrix * vector4(vec.xyz, 1)
var MatrixMultPosition = function() {
    MatrixMultDirection.call(this);
    this._forceComplement = false;
};

utils.createPrototypeObject(
    MatrixMultPosition,
    utils.objectInherit(MatrixMultDirection.prototype, {
        type: 'MatrixMultPosition',
        complement: '1.'
    }),
    'osgShader',
    'MatrixMultPosition'
);

var Blend = function() {
    BaseOperator.apply(this);
    this._mode = 'MIX';
};
utils.createPrototypeObject(
    Blend,
    utils.objectInherit(BaseOperator.prototype, {
        type: 'Blend',
        mode: function(mode) {
            this._mode = mode;
            return this;
        },
        computeShader: function() {
            return this[this._mode === undefined ? 'MIX' : this._mode]();
        },
        ADD: function() {
            return (
                this._outputs.getVariable() +
                ' = ' +
                this._inputs[0].getVariable() +
                ' + (' +
                this._inputs[1].getVariable() +
                ' * ' +
                this._inputs[2].getVariable() +
                ');'
            );
        },
        MIX: function() {
            // result = val0*(1.0-t) + t*val1
            return (
                this._outputs.getVariable() +
                ' = mix(' +
                this._inputs[0].getVariable() +
                ', ' +
                this._inputs[1].getVariable() +
                ', ' +
                this._inputs[2].getVariable() +
                ');'
            );
        },
        MULTIPLY: function() {
            return (
                this._outputs.getVariable() +
                ' = ' +
                this._inputs[0].getVariable() +
                ' * mix( ' +
                this._inputs[0].getType() +
                '(1.0), ' +
                this._inputs[1].getVariable() +
                ', ' +
                this._inputs[2].getVariable() +
                ');'
            );
        }
    })
);

// For all you custom needs.
//
// call Code() with variable input/output replace
// indexed by the '%'
// getNode( 'InlineCode' ).code( '%out = %input;' ).inputs( {
//             input: this.getOrCreateConstant( 'float', 'unitFloat' ).setValue( '1.0' )
//        } ).outputs( {
//            out: this.getNode( 'glPointSize' )
// }
//
var InlineCode = function() {
    Node.call(this);
};

utils.createPrototypeObject(
    InlineCode,
    utils.objectInherit(Node.prototype, {
        type: 'InlineCode',
        code: function(txt) {
            this._text = txt;
            return this;
        },
        computeShader: function() {
            // merge inputs and outputs dict to search in both
            var replaceVariables = utils.objectMix({}, this._inputs);
            replaceVariables = utils.objectMix(replaceVariables, this._outputs);

            // find all %string
            var r = new RegExp('%[A-Za-z0-9_]+', 'gm');
            var text = this._text;
            var result = this._text.match(r);

            var done = new Set(); // keep trace of replaced string

            for (var i = 0; i < result.length; i++) {
                var str = result[i].substr(1);
                if (!done.has(str)) {
                    if (!replaceVariables[str]) {
                        notify.error('error with inline code\n' + this._text);
                        notify.error('input ' + str + ' not provided for ' + result[i]);
                    }
                    var reg = new RegExp(result[i].toString(), 'gm');
                    text = text.replace(reg, replaceVariables[str].getVariable());
                    done.add(str);
                }
            }

            return text;
        }
    }),
    'osgShader',
    'InlineCode'
);

export default {
    BaseOperator: BaseOperator,
    Mult: Mult,
    MatrixMultPosition: MatrixMultPosition,
    MatrixMultDirection: MatrixMultDirection,
    Add: Add,
    Blend: Blend,
    InlineCode: InlineCode,
    SetFromNode: SetFromNode
};
