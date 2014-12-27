define( [
    'osg/Utils',
    'osg/Notify',
    'osg/StateAttribute',
    'osg/Texture',
    'osg/Uniform',
    'osg/Matrix',
    'osg/Vec3',
    'osg/Vec4',
    'osg/Map'
], function ( MACROUTILS, Notify, StateAttribute, Texture, Uniform, Matrix, Vec3, Vec4, Map ) {
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
        this._lightUnit = -1; // default for a valid cloneType
    };

    ShadowTexture.uniforms = {};
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
        getLightUnit: function () {
            return this._lightUnit;
        },
        getUniformName: function ( name ) {
            var prefix = this.getType() + this._lightUnit.toString();
            return prefix + '_uniform_' + name;
        },

        getOrCreateUniforms: function ( unit ) {
            // uniform are once per CLASS attribute, not per instance
            var obj = ShadowTexture;

            Notify.assert( unit !== undefined );

            if ( obj.uniforms[ unit ] !== undefined ) return obj.uniforms[ unit ];

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


            var name = 'ShadowTexture' + unit;
            var uniform = Uniform.createInt1( unit, name );
            uniforms[ 'ShadowTexture' + unit ] = uniform;

            obj.uniforms[ unit ] = new Map( uniforms );

            this.latestUnit = unit;
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
        apply: function ( state, texUnit ) {

            // Texture stuff: call parent class method
            Texture.prototype.apply.call( this, state, texUnit );

            // update Uniforms
            var uniformMap = this.getOrCreateUniforms( texUnit );
            uniformMap.ViewMatrix.set( this._viewMatrix );
            uniformMap.ProjectionMatrix.set( this._projectionMatrix );
            uniformMap.DepthRange.set( this._depthRange );

            // get that from texture size
            // TODO: handle Dirty Size change using apply tex2D callback?
            this._mapSize[ 0 ] = this._textureWidth;
            this._mapSize[ 1 ] = this._textureHeight;
            this._mapSize[ 2 ] = 1.0 / this._mapSize[ 0 ];
            this._mapSize[ 3 ] = 1.0 / this._mapSize[ 1 ];
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
