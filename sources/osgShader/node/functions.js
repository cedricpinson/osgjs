define( [
    'osg/Utils',
    'osgShader/utils',
    'osgShader/node/Node'

], function ( MACROUTILS, utils, Node ) {
    'use strict';

    var sprintf = utils.sprintf;

    // base to avoid redundant global declarations
    // it's to keep node more readable
    var NodeFunctions = function () {
        Node.apply( this );
    };

    NodeFunctions.prototype = MACROUTILS.objectInherit( Node.prototype, {

        globalFunctionDeclaration: function () {
            return '#pragma include "functions.glsl"';
        }

    } );


    var NormalizeNormalAndEyeVector = function () {
        NodeFunctions.apply( this );
    };

    NormalizeNormalAndEyeVector.prototype = MACROUTILS.objectInherit( NodeFunctions.prototype, {

        type: 'NormalizeNormalAndEyeVector',

        validInputs: [
            'normal',
            'position'
        ],
        validOuputs: [
            'normal',
            'eyeVector'
        ],

        computeFragment: function () {
            return utils.callFunction( 'normalizeNormalAndEyeVector', undefined, [
                this._inputs.normal,
                this._inputs.position,
                this._outputs.normal,
                this._outputs.eyeVector
            ] );
        }
    } );


    var sRGBToLinear = function () {
        NodeFunctions.apply( this );
    };

    sRGBToLinear.prototype = MACROUTILS.objectInherit( NodeFunctions.prototype, {

        type: 'sRGBToLinear',

        validInputs: [ 'color' /*, 'gamma'*/ ],
        validOuputs: [ 'color' ],

        computeFragment: function () {
            return this.computeConversion( 'sRGBToLinear' );
        },
        computeConversion: function ( funcName ) {
            var gamma = this._inputs.gamma ? this._inputs.gamma : 'DefaultGamma';
            var out = this._outputs.color;
            var color = this._inputs.color;
            var rgb = out.getType() !== color.getType() ? '.rgb' : '';

            return utils.callFunction( funcName, out.getVariable() + rgb, [ color.getVariable() + rgb, gamma ] );
        }

    } );

    var LinearTosRGB = function () {
        sRGBToLinear.apply( this );
    };

    LinearTosRGB.prototype = MACROUTILS.objectInherit( sRGBToLinear.prototype, {
        type: 'LinearTosRGB',
        computeFragment: function () {
            return this.computeConversion( 'linearTosRGB' );
        }
    } );

    var FrontNormal = function () {
        NodeFunctions.apply( this );
    };

    FrontNormal.prototype = MACROUTILS.objectInherit( NodeFunctions.prototype, {

        type: 'FrontNormal',
        validInputs: [ 'normal' ],
        validOuputs: [ 'normal' ],

        computeFragment: function () {
            return sprintf( '%s = gl_FrontFacing ? %s : -%s ;', [
                this._outputs.normal.getVariable(),
                this._inputs.normal.getVariable(),
                this._inputs.normal.getVariable()
            ] );
        }
    } );

    var getVec3 = function ( vec ) {
        return vec.getType && vec.getType() === 'vec4' ? vec.getVariable() + '.rgb' : vec;
    };
    var EncodeRGBM = function () {
        NodeFunctions.apply( this );
    };
    EncodeRGBM.prototype = MACROUTILS.objectInherit( NodeFunctions.prototype, {
        type: 'EncodeRGBM',
        validInputs: [ 'color', 'range' ],
        validOutputs: [ 'color' ],
        computeFragment: function () {
            return utils.callFunction( 'encodeRGBM', this._outputs.color, [ getVec3( this._inputs.color ), this._inputs.range ] );
        }
    } );

    var DecodeRGBM = function () {
        NodeFunctions.apply( this );
    };
    DecodeRGBM.prototype = MACROUTILS.objectInherit( NodeFunctions.prototype, {
        type: 'DecodeRGBM',
        validInputs: [ 'color', 'range' ],
        validOutputs: [ 'color' ],
        computeFragment: function () {
            return utils.callFunction( 'decodeRGBM', this._outputs.color, [ this._inputs.color, this._inputs.range ] );
        }
    } );

    return {
        NodeFunctions: NodeFunctions,
        NormalizeNormalAndEyeVector: NormalizeNormalAndEyeVector,
        sRGBToLinear: sRGBToLinear,
        LinearTosRGB: LinearTosRGB,
        FrontNormal: FrontNormal,
        DecodeRGBM: DecodeRGBM,
        EncodeRGBM: EncodeRGBM
    };

} );
