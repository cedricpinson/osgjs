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
        validInputs: [ 'weights', 'bonesIndex', 'matrixPalette' ],
        validOutputs: [ 'mat4' ],

        globalFunctionDeclaration: function () {
            return '#pragma include "skeletal.glsl"';
        },

        computeShader: function () {
            // TODO for now matrixPalette is used as a global (uBones) because an array means a dynamic function signature in the glsl...
            return ShaderUtils.callFunction( 'skeletalTransform', this._outputs.mat4, [ this._inputs.weights, this._inputs.bonesIndex ] );
        }
    } );

    return {
        Animation: AnimationNode
    };
} );
