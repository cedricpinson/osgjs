define( [
    'osg/Utils',
    'osgShader/utils',
    'osgShader/node/Node'

], function ( MACROUTILS, utils, Node ) {
    'use strict';

    var NodeTextures = function () {
        Node.apply( this );
    };

    NodeTextures.prototype = MACROUTILS.objectInherit( Node.prototype, {

        type: 'TextureAbstractNode',

        // functionName is here to simplify all texture base functions
        // it's possible later it will have to move into another class
        // if base class needs to be more generic. But right now it simplify
        // all simple class to fetch texture ( seed above )
        functionName: 'noTextureFunction',

        validInputs: [ 'sampler', 'uv' ],
        validOutputs: [ 'color' ],

        computeFragment: function () {

            return utils.callFunction( this.functionName,
                this._outputs.color, [
                    this._inputs.sampler,
                    this._inputs.uv.getVariable() + '.xy'
                ] );
        },

        globalFunctionDeclaration: function () {
            return '#pragma include "textures.glsl"';
        }

    } );



    var TextureRGB = function () {
        NodeTextures.apply( this );
    };

    TextureRGB.prototype = MACROUTILS.objectInherit( NodeTextures.prototype, {

        type: 'TextureRGB',
        functionName: 'textureRGB'

    } );



    var TextureRGBA = function () {
        TextureRGB.apply( this );
    };

    TextureRGBA.prototype = MACROUTILS.objectInherit( TextureRGB.prototype, {

        type: 'TextureRGBA',
        functionName: 'textureRGBA'

    } );


    var TextureAlpha = function () {
        TextureRGB.apply( this );
    };

    TextureAlpha.prototype = MACROUTILS.objectInherit( TextureRGB.prototype, {

        type: 'TextureAlpha',
        functionName: 'textureAlpha'

    } );



    var TextureIntensity = function () {
        TextureRGB.apply( this );
    };

    TextureIntensity.prototype = MACROUTILS.objectInherit( TextureRGB.prototype, {

        type: 'TextureIntensity',
        functionName: 'textureIntensity'

    } );

    return {
        NodeTextures: NodeTextures,
        TextureRGB: TextureRGB,
        TextureRGBA: TextureRGBA,
        TextureAlpha: TextureAlpha,
        TextureIntensity: TextureIntensity
    };

} );
