define( [
    'osg/Utils',
    'osg/Texture',
    'osgShader/utils',
    'osgShader/node/Node'
], function ( MACROUTILS, Texture, ShaderUtils, Node ) {
    'use strict';

    var ShadowNode = function () {
        Node.apply( this );

    };

    ShadowNode.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'Shadow',
        validOutputs: [ 'float' ],

        globalFunctionDeclaration: function () {
            return '#pragma include "shadowsReceive.glsl"';
        },

        setShadowAttribute: function ( shadowAttr ) {
            this._shadow = shadowAttr;
        },

        // TODO: remove either here or in node shadow: code repetition ?
        // ... otherwise caster and receiver doesn't get same defines
        // if any change done here and not overthere
        defines: function () {
            var defines = [];

            var textureType = this._shadow.getPrecision();
            var algo = this._shadow.getAlgorithm();

            var isFloat = false;
            var isLinearFloat = false;

            if ( ( typeof textureType === 'string' && textureType !== 'BYTE' ) || textureType !== Texture.UNSIGNED_BYTE ) {
                isFloat = true;
            }

            if ( isFloat && ( ( typeof textureType === 'string' && textureType.indexOf( 'LINEAR' ) !== -1 ) || textureType === Texture.HALF_FLOAT_LINEAR || textureType === Texture.FLOAT_LINEAR ) ) {
                isLinearFloat = true;
            }
            if ( algo === 'ESM' ) {
                defines.push( '#define _ESM' );
            } else if ( algo === 'NONE' ) {
                defines.push( '#define _NONE' );
            } else if ( algo === 'PCF' ) {
                defines.push( '#define _PCF' );
            } else if ( algo === 'VSM' ) {
                defines.push( '#define _VSM' );
            } else if ( algo === 'EVSM' ) {
                defines.push( '#define _EVSM' );
            }

            if ( isFloat ) {
                defines.push( '#define  _FLOATTEX' );
            }
            if ( isLinearFloat ) {
                defines.push( '#define  _FLOATLINEAR' );
            }

            return defines.join( '\n' );
        },

        computeFragment: function () {

            var inputs = [
                this._inputs.lighted,
                this._inputs.shadowVertexProjected,
                this._inputs.shadowZ,
                this._inputs.shadowTexture,
                this._inputs.shadowTextureMapSize,
                this._inputs.shadowTextureDepthRange,
                this._inputs.lightEyePos,
                this._inputs.lightNDL,

                this._inputs.normal,
                this._inputs.shadowbias,
                this._inputs.shadowvsmEpsilon,
                this._inputs.shadowexponent0,
                this._inputs.shadowexponent1
            ];

            return ShaderUtils.callFunction(
                'computeShadow',
                this._outputs.float,
                inputs );
        }


    } );

    return {
        Shadow: ShadowNode
    };
} );
