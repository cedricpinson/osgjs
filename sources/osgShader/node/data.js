'use strict';
var MACROUTILS = require( 'osg/Utils' );
var utils = require( 'osgShader/utils' );
var Node = require( 'osgShader/node/Node' );

var sprintf = utils.sprintf;

// Base Class for all variables Nodes
// TODO: add precision
// type {string} vec3/4/2, float, int, etc.
// prefix {string} vec3/4/2, float, int, etc.
var Variable = function ( type, prefix ) {
    Node.call( this );
    this._name = 'Variable';
    this._prefix = prefix;
    this._type = type;
    this._value = undefined;
};

MACROUTILS.createPrototypeObject( Variable, MACROUTILS.objectInherit( Node.prototype, {

    getType: function () {
        return this._type;
    },

    getVariable: function () {
        return this._prefix;
    },

    setValue: function ( value ) {
        this._value = value;
        return this;
    },

    toString: function () {
        var str = 'prefix : ' + this._prefix;
        str += ', name : ' + this._prefix;
        if ( this.type ) str += ' (' + this.type + ')';
        return str;
    },

    declare: function () {
        if ( this._value !== undefined ) {
            return sprintf( '%s %s = %s;', [ this._type, this.getVariable(), this._value ] );
        } else {
            return sprintf( '%s %s;', [ this._type, this.getVariable() ] );
        }
    },

    isEmpty: function () {
        return this._value === undefined && this._inputs.length === 0;
    },

    reset: function () {
        this._inputs = [];
        this._outputs = null;
        this._value = undefined;
        this._text = undefined;
    }
} ), 'osgShader', 'Variable' );

// Constant Variable
// help glsl compiler and make sure no one writes in it :)
var Constant = function ( type, prefix ) {
    Variable.call( this, type, prefix );
};

MACROUTILS.createPrototypeObject( Constant, MACROUTILS.objectInherit( Variable.prototype, {

    declare: function () {
        return sprintf( 'const %s %s = %s;', [ this._type, this.getVariable(), this._value ] );
    }
} ), 'osgShader', 'Constant' );

var Uniform = function ( type, prefix, size ) {
    Variable.call( this, type, prefix );
    this._size = size;
};

MACROUTILS.createPrototypeObject( Uniform, MACROUTILS.objectInherit( Variable.prototype, {
    declare: function () {
        return undefined;
    },

    globalDeclaration: function () {
        if ( this._size ) {
            return sprintf( 'uniform %s %s[%s];', [ this._type, this.getVariable(), this._size ] );
        } else {
            return sprintf( 'uniform %s %s;', [ this._type, this.getVariable() ] );
        }
    }

} ), 'osgShader', 'Uniform' );

// Vertex Attribute Variables
var Attribute = function ( type, prefix ) {
    Variable.call( this, type, prefix );
};

MACROUTILS.createPrototypeObject( Attribute, MACROUTILS.objectInherit( Variable.prototype, {
    declare: function () {
        return undefined;
    },

    globalDeclaration: function () {
        return sprintf( 'attribute %s %s;', [ this._type, this.getVariable() ] );
    }

} ), 'osgShader', 'Attribute' );


var Varying = function ( type, prefix ) {
    Variable.call( this, type, prefix );
};

MACROUTILS.createPrototypeObject( Varying, MACROUTILS.objectInherit( Variable.prototype, {
    declare: function () {
        return undefined;
    },

    globalDeclaration: function () {
        return sprintf( 'varying %s %s;', [ this._type, this.getVariable() ] );
    }
} ), 'osgShader', 'Varying' );


var Sampler = function ( type, prefix ) {
    Variable.call( this, type, prefix );
};

MACROUTILS.createPrototypeObject( Sampler, MACROUTILS.objectInherit( Variable.prototype, {
    declare: function () {
        return undefined;
    },

    globalDeclaration: function () {
        return sprintf( 'uniform %s %s;', [ this._type, this.getVariable() ] );
    }

} ), 'osgShader', 'Sampler' );

// Graph Root Node Abstract Class
// Derive from that for new outputs
// gl_FragDepth, etc.
var Output = function ( type, wholeName ) {
    Variable.call( this, type, wholeName );
};

MACROUTILS.createPrototypeObject( Output, MACROUTILS.objectInherit( Variable.prototype, {
    _unique: true,
    isUnique: function () {
        return this._unique;
    },
    outputs: function () { /* do nothing for variable */
        return this;
    },
    getVariable: function () {
        return this._prefix;
    }
} ), 'osgShader', 'Output' );

// Graph Root Nodes
var glFragColor = function () {
    Output.call( this, 'vec4', 'gl_FragColor' );
    this._name = 'glFragColor';
};

MACROUTILS.createPrototypeObject( glFragColor, MACROUTILS.objectInherit( Output.prototype, {} ), 'osgShader', 'glFragColor' );

var glPosition = function () {
    Output.call( this, 'vec4', 'gl_Position' );
    this._name = 'glPosition';
};

MACROUTILS.createPrototypeObject( glPosition, MACROUTILS.objectInherit( Output.prototype, {} ), 'osgShader', 'glPosition' );


var glPointSize = function () {
    Output.call( this, 'float', 'gl_PointSize' );
    this._name = 'glPointSize';
};

MACROUTILS.createPrototypeObject( glPointSize, MACROUTILS.objectInherit( Output.prototype, {} ), 'osgShader', 'glPointSize' );

module.exports = {
    Output: Output,
    glPointSize: glPointSize,
    glPosition: glPosition,
    glFragColor: glFragColor,
    Sampler: Sampler,
    Variable: Variable,
    Constant: Constant,
    Attribute: Attribute,
    Varying: Varying,
    Uniform: Uniform
};
