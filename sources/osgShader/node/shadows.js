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
            var defines = this._shadow.getDefines();
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
                this._inputs.shadowepsilonVSM,
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
