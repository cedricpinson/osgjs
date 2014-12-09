define( [
    'osg/Utils',
    'osg/StateAttribute',
    'osg/Texture',
    'osg/Uniform',
    'osg/Matrix',
    'osg/Vec3',
    'osg/Vec4',
    'osg/Map'
], function ( MACROUTILS, StateAttribute, Texture, Uniform, Matrix, Vec3, Vec4, Map ) {
    'use strict';


    /**
     * ShadowTexture Attribute encapsulate Texture webgl object
     * with Shadow specificities (no need of texcoord,fragtexcoord)
     * trigger hash change when changing texture precision from float to byt
     * @class ShadowTexture
     * @inherits StateAttribute
     */
    var ShadowTexture = function () {
        Texture.call( this );
        this._uniforms = {};
        this._mapSize = new Array( 4 );
    };

    /** @lends Texture.prototype */
    ShadowTexture.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( Texture.prototype, {
        attributeType: 'ShadowTexture',

        cloneType: function () {
            var t = new ShadowTexture();
            t.defaultType = true;
            return t;
        },

        setLightUnit: function ( lun ) {
            this._lightUnit = lun;
        },
        getUniformName: function ( name ) {
            var prefix = this.getType() + this._lightUnit.toString();
            return prefix + '_uniform_' + name;
        },

        getOrCreateUniforms: function () {
            var uniformList = {
                'ViewMatrix': 'createMat4',
                'ProjectionMatrix': 'createMat4',
                'DepthRange': 'createFloat4',
                'MapSize': 'createFloat4'
            };

            var uniforms = {};

            Object.keys( uniformList ).forEach( function ( key ) {

                var type = uniformList[ key ];
                var func = Uniform[ type ];
                uniforms[ key ] = func( this.getUniformName( key ) );

            }.bind( this ) );

            this._uniforms = new Map( uniforms );

            return this._uniforms;
        },

        setViewMatrix: function ( viewMatrix ) {
            this._viewMatrix = viewMatrix;
            this.setDirty( true );
        },
        setProjectionMatrix: function ( projectionMatrix ) {
            this._projectionMatrix = projectionMatrix;
            this.setDirty( true );
        },
        setDepthRange: function ( depthRange ) {
            this._depthRange = depthRange;
            this.setDirty( true );
        },
        apply: function ( /*state*/) {

            var uniformMap = this.getOrCreateUniforms();

            uniformMap.ViewMatrix.set( this._viewMatrix );

            uniformMap.ProjectionMatrix.set( this._projectionMatrix );

            uniformMap.DepthRange.set( this._depthRange );

            // get that from texture size
            // TODO: handle Dirty Size change using apply tex2D callback?
            this._mapSize[ 0 ] = this._textureWidth;
            this._mapSize[ 1 ] = this._textureHeight;
            this._mapSize[ 3 ] = 1.0 / this._textureWidth;
            this._mapSize[ 4 ] = 1.0 / this._textureHeight;
            uniformMap.MapSize.set( this._mapSize );

            this.setDirty( false );
        },
        getHash: function () {
            return this.getTypeMember() + this._type;
        }

    } ), 'osg', 'ShadowTexture' );

    MACROUTILS.setTypeID( ShadowTexture );

    return ShadowTexture;
} );
