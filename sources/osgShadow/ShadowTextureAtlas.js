'use strict';

var notify = require( 'osg/notify' );
var Texture = require( 'osg/Texture' );
var Uniform = require( 'osg/Uniform' );
var MACROUTILS = require( 'osg/Utils' );
var vec4 = require( 'osg/glMatrix' ).vec4;


/**
 * ShadowTexture Attribute encapsulate Texture webgl object
 * with Shadow specificities (no need of texcoord,fragtexcoord)
 * trigger hash change when changing texture precision from float to byt
 * shadowSettings.js header for param explanations
 * @class ShadowTexture
 * @inherits StateAttribute
 */
var ShadowTextureAtlas = function () {

    Texture.call( this );

    this._uniforms = {};
    this._lightNumberArray = []; // default for a valid cloneType

    this._viewMatrices = [];
    this._projectionMatrices = [];
    this._depthRanges = [];
    this._mapSizes = [];
    this._renderSize = vec4.create();

};

ShadowTextureAtlas.uniforms = {};
/** @lends Texture.prototype */
ShadowTextureAtlas.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Texture.prototype, {

    cloneType: function () {
        return new ShadowTextureAtlas();
    },

    gettLightNumberArray: function () {
        return this._lightNumberArray;
    },

    hasLightNumber: function ( lightNum ) {
        return this._lightNumberArray.indexOf( lightNum ) !== -1;
    },

    setLightNumberArray: function ( lightNumberArray ) {

        this._lightNumberArray = lightNumberArray;

        var l = lightNumberArray.length;
        this._viewMatrices.length = l;
        this._projectionMatrices.length = l;
        this._depthRanges.length = l;
        this._mapSizes.length = l;

    },

    getUniformName: function ( lightNumber, name ) {

        var prefix = 'Shadow_' + this.getType() + lightNumber.toString();
        return 'u' + prefix + '_' + name;

    },

    getVaryingName: function ( lightNumber, name ) {

        var prefix = this.getType() + lightNumber.toString();
        return 'v' + prefix + '_' + name;

    },

    getOrCreateUniforms: function ( unit ) {

        // uniform are once per CLASS attribute, not per instance
        var obj = ShadowTextureAtlas;
        notify.assert( unit !== undefined || this._lightNumberArray.length !== 0 );

        if ( obj.uniforms[ unit ] !== undefined ) {
            return obj.uniforms[ unit ];
        }

        var uniforms = obj.uniforms[ unit ] = {};

        // shadowmap texture size used for texel space which is viewport independant
        var renderSizeUniform = Uniform.createFloat4( this.getUniformName( 0, 'renderSize' ) );
        uniforms[ 'RenderSize' ] = renderSizeUniform;

        for ( var i = 0, l = this._lightNumberArray.length; i < l; i++ ) {

            var lightNumber = this._lightNumberArray[ i ];
            uniforms[ 'ViewMatrix_' + lightNumber ] = Uniform.createMat4( this.getUniformName( lightNumber, 'viewMatrix' ) );
            uniforms[ 'ProjectionMatrix_' + lightNumber ] = Uniform.createMat4( this.getUniformName( lightNumber, 'projectionMatrix' ) );
            uniforms[ 'DepthRange_' + lightNumber ] = Uniform.createFloat4( this.getUniformName( lightNumber, 'depthRange' ) );
            uniforms[ 'MapSize_' + lightNumber ] = Uniform.createFloat4( this.getUniformName( lightNumber, 'mapSize' ) );
            uniforms[ 'RenderSize_' + lightNumber ] = renderSizeUniform;

        }


        // Dual Uniform of texture, needs:
        // - Sampler (type of texture)
        // - Int (texture unit)
        // tells Shader Program where to find it
        var name = 'Texture' + unit;
        var uniform = Uniform.createInt1( unit, name );
        uniforms[ name ] = uniform;

        return obj.uniforms[ unit ];
    },

    setViewMatrix: function ( lighNumberArrayIndex, viewMatrix ) {
        this._viewMatrices[ lighNumberArrayIndex ] = viewMatrix;
    },

    setProjectionMatrix: function ( lighNumberArrayIndex, projectionMatrix ) {
        this._projectionMatrices[ lighNumberArrayIndex ] = projectionMatrix;
    },

    setDepthRange: function ( lighNumberArrayIndex, depthRange ) {
        this._depthRanges[ lighNumberArrayIndex ] = depthRange;
    },

    setTextureSize: function ( w, h ) {

        this._renderSize[ 0 ] = w;
        this._renderSize[ 1 ] = h;
        this._renderSize[ 2 ] = 1.0 / w;
        this._renderSize[ 3 ] = 1.0 / h;
        Texture.prototype.setTextureSize.call( this, w, h );
        this.dirty();

    },

    setLightShadowMapSize: function ( lighNumberArrayIndex, dimension ) {

        this._mapSizes[ lighNumberArrayIndex ] = dimension;

    },

    apply: function ( state, texUnit ) {

        // Texture stuff: call parent class method
        Texture.prototype.apply.call( this, state, texUnit );

        if ( this._lightNumberArray.length === 0 )
            return;

        // update Uniforms
        var uniformMap = this.getOrCreateUniforms( texUnit );

        for ( var i = 0, l = this._lightNumberArray.length; i < l; i++ ) {

            var lightNumber = this._lightNumberArray[ i ];
            uniformMap[ 'ViewMatrix_' + lightNumber ].setMatrix4( this._viewMatrices[ i ] );
            uniformMap[ 'ProjectionMatrix_' + lightNumber ].setMatrix4( this._projectionMatrices[ i ] );
            uniformMap[ 'DepthRange_' + lightNumber ].setFloat4( this._depthRanges[ i ] );
            uniformMap[ 'MapSize_' + lightNumber ].setFloat4( this._mapSizes[ i ] );
            uniformMap[ 'RenderSize_' + lightNumber ].setFloat4( this._renderSize );

        }

        uniformMap[ 'RenderSize' ].setFloat4( this._renderSize );

    },

    getHash: function () {

        var hash = this.getTypeMember();
        for ( var i = 0, l = this._lightNumberArray.length; i < l; i++ ) {
            hash += '_' + this._lightNumberArray[ i ];
        }
        hash += '_' + this._type;
        return hash;

    }

} ), 'osgShadow', 'ShadowTextureAtlas' );

MACROUTILS.setTypeID( ShadowTextureAtlas );

module.exports = ShadowTextureAtlas;
