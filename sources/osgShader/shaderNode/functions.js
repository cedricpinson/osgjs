define( [
    'osg/Utils',
    'osgShader/utils/sprintf',
    'osgShader/shaderNode/Node'

], function ( MACROUTILS, sprintf, Node ) {
    'use strict';


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


    // TODO populate function.glsl replacement
    var NormalizeNormalAndEyeVector = function ( fnormal, fpos ) {
        Node.apply( this, arguments );
        this._normal = fnormal;
        this._position = fpos;
    };
    NormalizeNormalAndEyeVector.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'NormalizeNormalAndEyeVector',
        connectOutputNormal: function ( n ) {
            this._outputNormal = n;
            this.autoLink( this._outputNormal );
        },
        connectOutputEyeVector: function ( n ) {
            this._outputEyeVector = n;
            this.autoLink( this._outputEyeVector );
        },
        computeFragment: function () {
            var str = [ '',
                this._outputNormal.getVariable() + ' = normalize(' + this._normal.getVariable() + ');',
                this._outputEyeVector.getVariable() + ' = -normalize(' + this._position.getVariable() + ');'
            ].join( '\n' );
            return str;
        }
    } );


    var sRGBToLinear = function ( input, output, gamma ) {
        NodeFunctions.call( this, input );
        this.connectOutput( output );
        this._gamma = gamma;
    };

    sRGBToLinear.prototype = MACROUTILS.objectInherit( NodeFunctions.prototype, {

        type: 'sRGBToLinear',

        computeFragment: function () {
            //var inputType = this._inputs[ 0 ].getType();
            return sprintf( '%s.rgb = sRGBToLinear( %s.rgb, %s );', [ this.getOutput().getVariable(),
                this._inputs[ 0 ].getVariable(),
                this._gamma.getVariable()
            ] );
        }

    } );



    var LinearTosRGB = function ( input, output, gamma ) {
        Node.call( this, input );
        this.connectOutput( output );
        this._gamma = gamma;
    };

    LinearTosRGB.prototype = MACROUTILS.objectInherit( NodeFunctions.prototype, {

        type: 'LinearTosRGB',

        computeFragment: function () {
            return sprintf( '%s.rgb = linearTosRGB( %s.rgb, %s );', [ this.getOutput().getVariable(),
                this._inputs[ 0 ].getVariable(),
                this._gamma.getVariable()
            ] );
        }

    } );

    LinearTosRGB.defaultGamma = 2.4;


    return {
        'NormalizeNormalAndEyeVector': NormalizeNormalAndEyeVector,
        'sRGBToLinear': sRGBToLinear,
        'LinearTosRGB': LinearTosRGB
    };

} );
