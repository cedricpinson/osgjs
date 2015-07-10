define( [
    'osg/Utils',
    'osg/Texture',
    'osgShader/utils',
    'osgShader/node/Node'
], function ( MACROUTILS, Texture, ShaderUtils, Node ) {
    'use strict';

    var AnimationNode = function () {
        Node.apply( this );
    };

    AnimationNode.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'Animation',
        validOutputs: [ 'mat4' ],

        globalFunctionDeclaration: function () {
            return '#pragma include "skeletal.glsl"';
        },


        computeShader: function () {

            // common inputs for func
            var inputs = [
                this._inputs.weights,
                this._inputs.bonesIndex,
            ];

            return ShaderUtils.callFunction(
                'skeletalTransform',
                this._outputs.mat4,
                inputs );
        }


    } );

    return {
        Animation: AnimationNode
    };
} );
