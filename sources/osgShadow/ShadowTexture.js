'use strict';

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
var ShadowTexture = function () {

    Texture.call( this );

    this._uniforms = {};
    this._mapSize = vec4.create();
    this._renderSize = vec4.create();
    this._lightNumber = -1; // default for a valid cloneType

};

ShadowTexture.uniforms = {};
/** @lends Texture.prototype */
ShadowTexture.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Texture.prototype, {

    cloneType: function () {
        return new ShadowTexture();
    },
    hasLightNumber: function ( lightNum ) {
        return this._lightNumber === lightNum;
    },
    setLightNumber: function ( lun ) {
        this._lightNumber = lun;
    },
    getLightNumber: function () {
        return this._lightNumber;
    },

    getUniformName: function ( name ) {
        var prefix = 'Shadow_' + this.getType() + this._lightNumber.toString();
        return 'u' + prefix + '_' + name;
    },

    getVaryingName: function ( name ) {
        var prefix = this.getType() + this._lightNumber.toString();
        return 'v' + prefix + '_' + name;
    },

    getOrCreateUniforms: function ( unit ) {
        // uniform are once per CLASS attribute, not per instance
        var obj = ShadowTexture;

        Notify.assert( unit !== undefined );
        Notify.assert( this._lightNumber !== -1 );

        if ( obj.uniforms[ unit ] !== undefined ) return obj.uniforms[ unit ];

        var uniforms = obj.uniforms[ unit ] = {
            ViewMatrix: Uniform.createMat4( this.getUniformName( 'viewMatrix' ) ),
            ProjectionMatrix: Uniform.createMat4( this.getUniformName( 'projectionMatrix' ) ),
            DepthRange: Uniform.createFloat4( this.getUniformName( 'depthRange' ) ),
            MapSize: Uniform.createFloat4( this.getUniformName( 'mapSize' ) ),
            RenderSize: Uniform.createFloat4( this.getUniformName( 'renderSize' ) )
        };

        // Dual Uniform of texture, needs:
        // - Sampler (type of texture)
        // - Int (texture unit)
        // tells Shader Program where to find it
        var name = 'Texture' + unit;
        var uniform = Uniform.createInt1( unit, name );
        uniforms[ name ] = uniform;

        return obj.uniforms[ unit ];
    },
    setViewMatrix: function ( viewMatrix ) {
        this._viewMatrix = viewMatrix;
    },

    setProjectionMatrix: function ( projectionMatrix ) {
        this._projectionMatrix = projectionMatrix;
    },

    setDepthRange: function ( depthRange ) {
        this._depthRange = depthRange;
    },

    setTextureSize: function ( w, h ) {
        Texture.prototype.setTextureSize.call( this, w, h );
        this.dirty();
        this._mapSize[ 0 ] = w;
        this._mapSize[ 1 ] = h;
        this._mapSize[ 2 ] = 1.0 / w;
        this._mapSize[ 3 ] = 1.0 / h;

        this._renderSize[ 0 ] = w;
        this._renderSize[ 1 ] = h;
        this._renderSize[ 2 ] = 1.0 / w;
        this._renderSize[ 3 ] = 1.0 / h;
    },

    apply: function ( state, texNumber ) {

        // Texture stuff: call parent class method
        Texture.prototype.apply.call( this, state, texNumber );

        if ( this._lightNumber === -1 )
            return;

        // update Uniforms
        var uniformMap = this.getOrCreateUniforms( texNumber );
        uniformMap.ViewMatrix.setMatrix4( this._viewMatrix );
        uniformMap.ProjectionMatrix.setMatrix4( this._projectionMatrix );
        uniformMap.DepthRange.setFloat4( this._depthRange );
        uniformMap.MapSize.setFloat4( this._mapSize );
        uniformMap.RenderSize.setFloat4( this._renderSize );

    },

    getHash: function () {
        return this.getTypeMember() + '_' + this._lightNumber + '_' + this._type;
    }

} ), 'osgShadow', 'ShadowTexture' );

MACROUTILS.setTypeID( ShadowTexture );

module.exports = ShadowTexture;
