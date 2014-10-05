define( [
    'osg/Utils',
    'osgShader/utils',
    'osgShader/node/Node'

], function ( MACROUTILS, utils, Node ) {
    'use strict';

    var NodeTextures = function ( sampler, uv, output ) {

        Node.call( this );

        this._sampler = sampler;
        this.connectInputs( sampler );
        this.connectInputs( uv );

        if ( output !== undefined ) {
            this.connectOutput( output );
        }

        this._uv = uv;
    };

    NodeTextures.prototype = MACROUTILS.objectInherit( Node.prototype, {

        // functionName is here to simplify all texture base functions
        // it's possible later it will have to move into another class
        // if base class needs to be more generic. But right now it simplify
        // all simple class to fetch texture ( seed above )
        functionName: 'noTextureFunction',

        computeFragment: function () {
            return utils.callFunction( this.functionName,
                this.getOutput(), [ this._sampler,
                    this._uv.getVariable() + '.xy'
                ]
            );
        },

        globalFunctionDeclaration: function () {
            return '#pragma include "textures.glsl"';
        }

    } );



    var TextureRGB = function ( /*sampler, uv, output*/) {
        NodeTextures.apply( this, arguments );
    };

    TextureRGB.prototype = MACROUTILS.objectInherit( NodeTextures.prototype, {

        type: 'TextureRGB',
        functionName: 'textureRGB'

    } );



    var TextureRGBA = function ( /*sampler, uv, output*/) {
        TextureRGB.apply( this, arguments );
    };

    TextureRGBA.prototype = MACROUTILS.objectInherit( TextureRGB.prototype, {

        type: 'TextureRGBA',
        functionName: 'textureRGBA'

    } );


    var TextureAlpha = function ( /*sampler, uv, output*/) {
        TextureRGB.apply( this, arguments );
    };

    TextureAlpha.prototype = MACROUTILS.objectInherit( TextureRGB.prototype, {

        type: 'TextureAlpha',
        functionName: 'textureAlpha'

    } );



    var TextureIntensity = function ( /*sampler, uv, output*/) {
        TextureRGB.apply( this, arguments );
    };

    TextureIntensity.prototype = MACROUTILS.objectInherit( TextureRGB.prototype, {

        type: 'TextureIntensity',
        functionName: 'textureIntensity'

    } );

    return {
        'TextureRGB': TextureRGB,
        'TextureRGBA': TextureRGBA,
        'TextureAlpha': TextureAlpha,
        'TextureIntensity': TextureIntensity
    };

} );
