import utils from 'osg/utils';
import shaderUtils from 'osgShader/utils';
import Node from 'osgShader/node/Node';

var sprintf = shaderUtils.sprintf;

// Base Class for all variables Nodes
// TODO: add precision
// type {string} vec3/4/2, float, int, etc.
// prefix {string} vec3/4/2, float, int, etc.
var Variable = function(type, prefix) {
    Node.call(this);
    this._name = 'Variable';
    this._prefix = prefix;
    this._type = type;
    this._value = undefined;
};

utils.createPrototypeObject(
    Variable,
    utils.objectInherit(Node.prototype, {
        getType: function() {
            return this._type;
        },

        getVariable: function() {
            return this._prefix;
        },

        setValue: function(value) {
            this._value = value;
            return this;
        },

        toString: function() {
            var str = this._name + ' ' + this._prefix;
            if (this._type) str += ' (' + this._type + ')';
            str += ' - id:' + this._id;
            return str;
        },

        declare: function() {
            if (this._value !== undefined) {
                return sprintf('%s %s = %s;', [this._type, this.getVariable(), this._value]);
            } else {
                return sprintf('%s %s;', [this._type, this.getVariable()]);
            }
        },

        isEmpty: function() {
            return this._value === undefined && this._inputs.length === 0;
        },

        reset: function() {
            this._inputs = [];
            this._outputs = null;
            this._value = undefined;
            this._text = undefined;
        }
    }),
    'osgShader',
    'Variable'
);

// Constant Variable
// help glsl compiler and make sure no one writes in it :)
var Constant = function(type, prefix) {
    Variable.call(this, type, prefix);
};

utils.createPrototypeObject(
    Constant,
    utils.objectInherit(Variable.prototype, {
        declare: function() {
            return sprintf('const %s %s = %s;', [this._type, this.getVariable(), this._value]);
        }
    }),
    'osgShader',
    'Constant'
);

var Uniform = function(type, prefix, size) {
    Variable.call(this, type, prefix);
    this._size = size;
};

utils.createPrototypeObject(
    Uniform,
    utils.objectInherit(Variable.prototype, {
        declare: function() {
            return undefined;
        },

        globalDeclaration: function() {
            if (this._size) {
                return sprintf('uniform %s %s[%s];', [this._type, this.getVariable(), this._size]);
            } else {
                return sprintf('uniform %s %s;', [this._type, this.getVariable()]);
            }
        }
    }),
    'osgShader',
    'Uniform'
);

// Vertex Attribute Variables
var Attribute = function(type, prefix) {
    Variable.call(this, type, prefix);
};

utils.createPrototypeObject(
    Attribute,
    utils.objectInherit(Variable.prototype, {
        declare: function() {
            return undefined;
        },

        globalDeclaration: function() {
            return sprintf('attribute %s %s;', [this._type, this.getVariable()]);
        }
    }),
    'osgShader',
    'Attribute'
);

var Varying = function(type, prefix) {
    Variable.call(this, type, prefix);
};

utils.createPrototypeObject(
    Varying,
    utils.objectInherit(Variable.prototype, {
        declare: function() {
            return undefined;
        },

        globalDeclaration: function() {
            return sprintf('varying %s %s;', [this._type, this.getVariable()]);
        }
    }),
    'osgShader',
    'Varying'
);

var Sampler = function(type, prefix) {
    Variable.call(this, type, prefix);
};

utils.createPrototypeObject(
    Sampler,
    utils.objectInherit(Variable.prototype, {
        declare: function() {
            return undefined;
        },

        globalDeclaration: function() {
            return sprintf('uniform %s %s;', [this._type, this.getVariable()]);
        }
    }),
    'osgShader',
    'Sampler'
);

// Graph Root Node Abstract Class
// Derive from that for new outputs
// gl_FragDepth, etc.
var Output = function(type, wholeName) {
    Variable.call(this, type, wholeName);
};

utils.createPrototypeObject(
    Output,
    utils.objectInherit(Variable.prototype, {
        _unique: true,
        isUnique: function() {
            return this._unique;
        },
        outputs: function() {
            /* do nothing for variable */
            return this;
        },
        getVariable: function() {
            return this._prefix;
        }
    }),
    'osgShader',
    'Output'
);

// Graph Root Nodes
var glFragColor = function() {
    Output.call(this, 'vec4', 'gl_FragColor');
    this._name = 'glFragColor';
};

utils.createPrototypeObject(
    glFragColor,
    utils.objectInherit(Output.prototype, {}),
    'osgShader',
    'glFragColor'
);

var glPosition = function() {
    Output.call(this, 'vec4', 'gl_Position');
    this._name = 'glPosition';
};

utils.createPrototypeObject(
    glPosition,
    utils.objectInherit(Output.prototype, {}),
    'osgShader',
    'glPosition'
);

var glPointSize = function() {
    Output.call(this, 'float', 'gl_PointSize');
    this._name = 'glPointSize';
};

utils.createPrototypeObject(
    glPointSize,
    utils.objectInherit(Output.prototype, {}),
    'osgShader',
    'glPointSize'
);

var Define = function(name) {
    Node.call(this);
    this._defineName = name;
    this._defineValue = '';
};
utils.createPrototypeObject(
    Define,
    utils.objectInherit(Node.prototype, {
        type: 'Define',
        setValue: function(value) {
            this._defineValue = value;
            return this;
        },
        getDefines: function() {
            return ['#define ' + this._defineName + ' ' + this._defineValue];
        }
    }),
    'osgShader',
    'Define'
);

export default {
    Output: Output,
    glPointSize: glPointSize,
    glPosition: glPosition,
    glFragColor: glFragColor,
    Sampler: Sampler,
    Variable: Variable,
    Constant: Constant,
    Attribute: Attribute,
    Varying: Varying,
    Uniform: Uniform,
    Define: Define
};
