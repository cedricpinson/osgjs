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

        // must return an array of defines
        // because it will be passed to the ShaderGenerator
        defines: function () {
            return this._shadow.getDefines();
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
