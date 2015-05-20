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
        getDefines: function () {
            return this._shadow.getDefines();
        },
        getExtensions: function () {
            return this._shadow.getExtensions();
        },
        computeFragment: function () {


            // common inputs
            var inputs = [
                this._inputs.lighted,
                this._inputs.shadowTexture,
                this._inputs.shadowTextureMapSize,
                this._inputs.shadowTextureProjectionMatrix,
                this._inputs.shadowTextureViewMatrix,
                this._inputs.shadowTextureDepthRange,
                this._inputs.lightEyePos,
                this._inputs.lightNDL,

                this._inputs.vertexWorld,
                this._inputs.normal,
                this._inputs.shadowbias
            ];


            var algo = this._shadow.getAlgorithm();
            if ( algo === 'ESM' ) {
                inputs.push( this._inputs.shadowexponent0 );
                inputs.push( this._inputs.shadowexponent1 );
            } else if ( algo === 'EVSM' ) {
                inputs.push( this._inputs.shadowepsilonVSM );
                inputs.push( this._inputs.shadowexponent0 );
                inputs.push( this._inputs.shadowexponent1 );
            } else if ( algo === 'VSM' ) {
                inputs.push( this._inputs.shadowepsilonVSM );
            }

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
