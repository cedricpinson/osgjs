'use strict';
var Map = require( 'osg/Map' );
var Notify = require( 'osg/notify' );
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
    this._lightUnit = -1; // default for a valid cloneType
    this._lightNumber = 0;
    this._lightRange = 0;

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

    setLightNumber: function ( value ) {
        this._lightNumber = value;
    },

    getLightNumber: function () {
        return this._lightNumber;
    },

    hasThisLight: function ( lightNum ) {
        return this._lightNumber <= lightNum && this._lightNumber + this._lightRange > lightNum;
    },

    getLightRange: function () {
        return this._lightRange;
    },

    setLightRange: function ( range ) {

        this._lightRange = range;

        this._viewMatrices.length = range;
        this._projectionMatrices.length = range;
        this._depthRanges.length = range;
        this._mapSizes.length = range;
    },

    setLightUnit: function ( lun ) {

        this._lightUnit = lun;

    },
    getLightUnit: function () {

        return this._lightUnit;

    },

    getUniformName: function ( name, lightNumber ) {

        var prefix = 'Shadow_' + this.getType() + this._lightUnit.toString();
        if ( lightNumber !== undefined ) prefix += '_' + lightNumber;
        return 'u' + prefix + '_' + name;

    },

    getVaryingName: function ( name, lightNumber ) {

        var prefix = this.getType() + ( this._lightUnit + lightNumber ).toString();
        return 'v' + prefix + '_' + name;

    },

    getOrCreateUniforms: function ( unit ) {

        // uniform are once per CLASS attribute, not per instance
        var obj = ShadowTextureAtlas;
        console.assert( unit !== undefined );
        Notify.assert( this._lightUnit !== -1 );

        if ( obj.uniforms[ unit ] !== undefined ) {
            return obj.uniforms[ unit ];
        }

        var uniforms = {};


        // shadowmap texture size used for texel space which is viewport independant
        var renderSizeUniform = Uniform.createFloat4( this.getUniformName( 'renderSize' ) );
        uniforms[ 'RenderSize' ] = renderSizeUniform;

        for ( var i = 0; i < this._lightRange; i++ ) {

            uniforms[ 'ViewMatrix_' + i ] = Uniform.createMat4( this.getUniformName( 'viewMatrix', i ) );
            uniforms[ 'ProjectionMatrix_' + i ] = Uniform.createMat4( this.getUniformName( 'projectionMatrix', i ) );
            uniforms[ 'DepthRange_' + i ] = Uniform.createFloat4( this.getUniformName( 'depthRange', i ) );
            uniforms[ 'MapSize_' + i ] = Uniform.createFloat4( this.getUniformName( 'mapSize', i ) );
            uniforms[ 'RenderSize_' + i ] = renderSizeUniform;

        }


        // Dual Uniform of texture, needs:
        // - Sampler (type of texture)
        // - Int (texture unit)
        // tells Shader Program where to find it
        var name = 'Texture' + unit;
        var uniform = Uniform.createInt1( unit, name );
        uniforms[ name ] = uniform;

        // Per Class Uniform Cache
        obj.uniforms[ unit ] = new Map( uniforms );

        return obj.uniforms[ unit ];
    },

    setViewMatrix: function ( viewMatrix, lightNumber ) {
        this._viewMatrices[ lightNumber ] = viewMatrix;
    },

    setProjectionMatrix: function ( projectionMatrix, lightNumber ) {
        this._projectionMatrices[ lightNumber ] = projectionMatrix;
    },

    setDepthRange: function ( depthRange, lightNumber ) {
        this._depthRanges[ lightNumber ] = depthRange;
    },

    setTextureSize: function ( w, h ) {

        this._renderSize[ 0 ] = w;
        this._renderSize[ 1 ] = h;
        this._renderSize[ 2 ] = 1.0 / w;
        this._renderSize[ 3 ] = 1.0 / h;
        Texture.prototype.setTextureSize.call( this, w, h );
        this.dirty();

    },

    setMapSize: function ( dimension, lightNumber ) {

        this._mapSizes[ lightNumber ] = dimension;

    },

    apply: function ( state, texUnit ) {

        // Texture stuff: call parent class method
        Texture.prototype.apply.call( this, state, texUnit );

        if ( this._lightUnit === -1 )
            return;

        // update Uniforms
        var uniformMap = this.getOrCreateUniforms( texUnit );

        for ( var i = 0; i < this._lightRange; i++ ) {

            uniformMap[ 'ViewMatrix_' + i ].setMatrix4( this._viewMatrices[ i ] );
            uniformMap[ 'ProjectionMatrix_' + i ].setMatrix4( this._projectionMatrices[ i ] );
            uniformMap[ 'DepthRange_' + i ].setFloat4( this._depthRanges[ i ] );
            uniformMap[ 'MapSize_' + i ].setFloat4( this._mapSizes[ i ] );
            uniformMap[ 'RenderSize_' + i ].setFloat4( this._renderSize );
        }

        uniformMap[ 'RenderSize' ].setFloat4( this._renderSize );

    },

    getHash: function () {
        return this.getTypeMember() + '_' + this._lightUnit + '_' + this._lightNumber + '_' + this._type;
    }

} ), 'osgShadow', 'ShadowTextureAtlas' );

MACROUTILS.setTypeID( ShadowTextureAtlas );

module.exports = ShadowTextureAtlas;
