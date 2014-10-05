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


    var NormalizeNormalAndEyeVector = function ( outputNormal, outputPosition, fnormal, fpos ) {
        NodeFunctions.apply( this );
        this._normal = fnormal;
        this._position = fpos;

        this._outputNormal = outputNormal;
        this.autoLink( this._outputNormal );

        this._outputEyeVector = outputPosition;
        this.autoLink( this._outputEyeVector );

        this.connectInputs( fnormal, fpos );
    };

    NormalizeNormalAndEyeVector.prototype = MACROUTILS.objectInherit( NodeFunctions.prototype, {
        type: 'NormalizeNormalAndEyeVector',

        computeFragment: function () {
            return utils.callFunction( 'normalizeNormalAndEyeVector', undefined, [
                this._normal,
                this._position,
                this._outputNormal,
                this._outputEyeVector
            ]);
        }
    } );


    var sRGBToLinear = function ( output, input, gamma ) {
        NodeFunctions.call( this, input );
        this.connectOutput( output );
        this._gamma = gamma;
    };

    sRGBToLinear.prototype = MACROUTILS.objectInherit( NodeFunctions.prototype, {

        type: 'sRGBToLinear',

        computeFragment: function () {
            return utils.callFunction( 'sRGBToLinear',
                                       this.getOutput().getVariable() + '.rgb',
                                       [ this._inputs[ 0 ].getVariable() + '.rgb',
                                         this._gamma
                                       ] );
        }

    } );



    var LinearTosRGB = function ( output, input, gamma ) {
        NodeFunctions.call( this, input );
        this.connectOutput( output );
        this._gamma = gamma;
    };

    LinearTosRGB.prototype = MACROUTILS.objectInherit( NodeFunctions.prototype, {

        type: 'LinearTosRGB',

        computeFragment: function () {
            return utils.callFunction( 'linearTosRGB',
                                       this.getOutput().getVariable() + '.rgb',
                                       [ this._inputs[ 0 ].getVariable() + '.rgb',
                                         this._gamma
                                       ] );
        }

    } );

    LinearTosRGB.defaultGamma = 2.2;



    var FrontNormal = function ( output, input ) {
        NodeFunctions.call( this, input );
        this.connectOutput( output );
    };
    FrontNormal.prototype = MACROUTILS.objectInherit( NodeFunctions.prototype, {
        type: 'FrontNormal',
        computeFragment: function () {
            return sprintf( '%s = gl_FrontFacing ? %s : -%s ;', [
                this.getOutput().getVariable(),
                this._inputs[ 0 ].getVariable(),
                this._inputs[ 0 ].getVariable()
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
