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
        Node.apply( this, arguments );
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
        NodeFunctions.apply( this, arguments );
    };

    sRGBToLinear.prototype = MACROUTILS.objectInherit( NodeFunctions.prototype, {

        type: 'sRGBToLinear',

        validInputs: [
            'gamma',
            'color'
        ],

        validOuputs: [ 'color' ],

        computeFragment: function () {
            return utils.callFunction( 'sRGBToLinear',
                this._outputs.color.getVariable() + '.rgb', [ this._inputs.color.getVariable() + '.rgb',
                    this._inputs.gamma
                ] );
        }

    } );



    var LinearTosRGB = function () {
        sRGBToLinear.apply( this, arguments );
    };

    LinearTosRGB.prototype = MACROUTILS.objectInherit( NodeFunctions.prototype, {

        type: 'LinearTosRGB',

        computeFragment: function () {
            return utils.callFunction( 'linearTosRGB',
                this._outputs.color.getVariable() + '.rgb', [ this._inputs.color.getVariable() + '.rgb',
                    this._inputs.gamma
                ] );
        }

    } );

    LinearTosRGB.defaultGamma = 2.2;



    var FrontNormal = function () {
        NodeFunctions.apply( this, arguments );
    };

    FrontNormal.prototype = MACROUTILS.objectInherit( NodeFunctions.prototype, {

        type: 'FrontNormal',

        computeFragment: function () {
            return sprintf( '%s = gl_FrontFacing ? %s : -%s ;', [
                this._outputs.getVariable(),
                this._inputs[0].getVariable(),
                this._inputs[0].getVariable()
            ] );
        }
    } );


    return {
        'NormalizeNormalAndEyeVector': NormalizeNormalAndEyeVector,
        'sRGBToLinear': sRGBToLinear,
        'LinearTosRGB': LinearTosRGB,
        'FrontNormal': FrontNormal
    };

} );
