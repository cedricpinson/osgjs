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

        defines: function () {
            var defines = [];

            var floatTex = this._shadow.getPrecision();
            var isFloat = false;
            if ( floatTex !== 'BYTE' && floatTex !== Texture.UNSIGNED_BYTE ) {
                isFloat = true;
            }

            var algo = this._shadow.getAlgorithm();
            if ( algo === 'ESM' ) {
                defines.push( '#define _ESM' );
            } else if ( algo === 'PCF' ) {
                defines.push( '#define _PCF' );
            } else if ( algo === 'VSM' ) {
                defines.push( '#define _VSM' );
            } else if ( algo === 'EVSM' && isFloat ) {
                defines.push( '#define _EVSM' );
            } else { //
                defines.push( '#define _NONE' );
            }

            if ( isFloat ) defines.push( '#define _FLOATTEX' );

            defines.push( '#define _PCF' );
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
