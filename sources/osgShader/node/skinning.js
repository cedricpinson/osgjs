define( [
    'osg/Utils',
    'osg/Texture',
    'osgShader/utils',
    'osgShader/node/Node'
], function ( MACROUTILS, Texture, ShaderUtils, Node ) {
    'use strict';

    var Skinning = function () {
        Node.apply( this );
    };

    Skinning.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'Skinning',
        validInputs: [ 'weights', 'bonesIndex', 'matrixPalette' ],
        validOutputs: [ 'mat4' ],

        globalFunctionDeclaration: function () {
            return '#pragma include "skinning.glsl"';
        },

        computeShader: function () {
            // For now matrixPalette is used as a global (uBones) because an array means a dynamic function signature in the glsl...
            return ShaderUtils.callFunction( 'skeletalTransform', this._outputs.mat4, [ this._inputs.weights, this._inputs.bonesIndex ] );
        }
    } );

    return {
        Skinning: Skinning
    };
} );
