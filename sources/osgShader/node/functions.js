'use strict';
var MACROUTILS = require( 'osg/Utils' );
var utils = require( 'osgShader/utils' );
var Node = require( 'osgShader/node/Node' );

var sprintf = utils.sprintf;

// base to avoid redundant global declarations
// it's to keep node more readable
var NodeFunctions = function () {
    Node.call( this );
};

MACROUTILS.createPrototypeObject( NodeFunctions, MACROUTILS.objectInherit( Node.prototype, {

    globalFunctionDeclaration: function () {
        return '#pragma include "functions.glsl"';
    }

} ), 'osgShader', 'NodeFunctions' );


var Normalize = function () {
    NodeFunctions.call( this );
};
MACROUTILS.createPrototypeObject( Normalize, MACROUTILS.objectInherit( NodeFunctions.prototype, {
    type: 'Normalize',
    validInputs: [ 'vec' ],
    validOuputs: [ 'vec' ],
    computeShader: function () {
        return utils.callFunction( 'normalize', this._outputs.vec, [ this._inputs.vec ] );
    }
} ), 'osgShader', 'Normalize' );


var sRGBToLinear = function () {
    NodeFunctions.call( this );
};

MACROUTILS.createPrototypeObject( sRGBToLinear, MACROUTILS.objectInherit( NodeFunctions.prototype, {

    type: 'sRGBToLinear',

    validInputs: [ 'color' ],
    validOuputs: [ 'color' ],

    computeShader: function () {
        return this.computeConversion( 'sRGBToLinear' );
    },
    computeConversion: function ( funcName ) {
        var out = this._outputs.color;
        var color = this._inputs.color;
        var rgb = out.getType() !== color.getType() ? '.rgb' : '';

        return utils.callFunction( funcName, out.getVariable() + rgb, [ color.getVariable() + rgb ] );
    }

} ), 'osgShader', 'sRGBToLinear' );

var LinearTosRGB = function () {
    sRGBToLinear.call( this );
};

MACROUTILS.createPrototypeObject( LinearTosRGB, MACROUTILS.objectInherit( sRGBToLinear.prototype, {
    type: 'LinearTosRGB',
    computeShader: function () {
        return this.computeConversion( 'linearTosRGB' );
    }
} ), 'osgShader', 'LinearTosRGB' );

var FrontNormal = function () {
    NodeFunctions.call( this );
};

// https://twitter.com/pyalot/status/711956736639418369
// https://github.com/mrdoob/three.js/issues/10331
MACROUTILS.createPrototypeObject( FrontNormal, MACROUTILS.objectInherit( NodeFunctions.prototype, {

    type: 'FrontNormal',
    validInputs: [ 'normal' ],
    validOuputs: [ 'normal' ],

    computeShader: function () {
        return sprintf( '%s = gl_FrontFacing ? %s : -%s ;', [
            this._outputs.normal.getVariable(),
            this._inputs.normal.getVariable(),
            this._inputs.normal.getVariable()
        ] );
    }
} ), 'osgShader', 'FrontNormal' );

var getVec3 = function ( vec ) {
    return vec.getType && vec.getType() === 'vec4' ? vec.getVariable() + '.rgb' : vec;
};

var EncodeRGBM = function () {
    NodeFunctions.call( this );
};
MACROUTILS.createPrototypeObject( EncodeRGBM, MACROUTILS.objectInherit( NodeFunctions.prototype, {
    type: 'EncodeRGBM',
    validInputs: [ 'color', 'range' ],
    validOutputs: [ 'color' ],
    computeShader: function () {
        return utils.callFunction( 'encodeRGBM', this._outputs.color, [ getVec3( this._inputs.color ), this._inputs.range ] );
    }
} ), 'osgShader', 'EncodeRGBM' );

var DecodeRGBM = function () {
    NodeFunctions.call( this );
};
MACROUTILS.createPrototypeObject( DecodeRGBM, MACROUTILS.objectInherit( NodeFunctions.prototype, {
    type: 'DecodeRGBM',
    validInputs: [ 'color', 'range' ],
    validOutputs: [ 'color' ],
    computeShader: function () {
        return utils.callFunction( 'decodeRGBM', this._outputs.color, [ this._inputs.color, this._inputs.range ] );
    }
} ), 'osgShader', 'DecodeRGBM' );

var Define = function ( name ) {
    Node.call( this );
    this._defineName = name;
    this._defineValue = '';
};
MACROUTILS.createPrototypeObject( Define, MACROUTILS.objectInherit( Node.prototype, {
    type: 'Define',
    setValue: function ( value ) {
        this._defineValue = value;
        return this;
    },
    getDefines: function () {
        return [ '#define ' + this._defineName + ' ' + this._defineValue ];
    }
} ), 'osgShader', 'Define' );

module.exports = {
    NodeFunctions: NodeFunctions,
    Normalize: Normalize,
    sRGBToLinear: sRGBToLinear,
    LinearTosRGB: LinearTosRGB,
    FrontNormal: FrontNormal,
    DecodeRGBM: DecodeRGBM,
    EncodeRGBM: EncodeRGBM,
    Define: Define
};
