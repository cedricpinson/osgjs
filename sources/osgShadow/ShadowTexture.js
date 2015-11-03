define( [
    'osg/Hash',
    'osg/Map',
    'osg/Matrix',
    'osg/Notify',
    'osg/StateAttribute',
    'osg/Texture',
    'osg/Uniform',
    'osg/Utils',
    'osg/Vec4'
], function ( Hash, Map, Matrix, Notify, StateAttribute, Texture, Uniform, MACROUTILS, Vec4 ) {
    'use strict';


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
        this._mapSize = Vec4.create();
        this._lightUnit = -1; // default for a valid cloneType

        this._hash = Hash.hashComputeCodeFromString( this.getHashString() );

    };

    ShadowTexture.uniforms = {};
    /** @lends Texture.prototype */
    ShadowTexture.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Texture.prototype, {

        cloneType: function () {
            return new ShadowTexture();
        },

        setLightUnit: function ( lun ) {
            this._lightUnit = lun;
            this.dirty();
        },
        getLightUnit: function () {
            return this._lightUnit;
        },

        getUniformName: function ( name ) {
            var prefix = 'Shadow_' + this.getType() + this._lightUnit.toString();
            return prefix + '_uniform_' + name;
        },

        getVaryingName: function ( name ) {
            var prefix = this.getType() + this._lightUnit.toString();
            return prefix + '_varying_' + name;
        },

        getOrCreateUniforms: function ( unit ) {
            // uniform are once per CLASS attribute, not per instance
            var obj = ShadowTexture;

            Notify.assert( unit !== undefined );
            Notify.assert( this._lightUnit !== -1 );

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
        },

        apply: function ( state, texUnit ) {

            // Texture stuff: call parent class method
            Texture.prototype.apply.call( this, state, texUnit );

            if ( this._lightUnit === -1 )
                return;

            // update Uniforms
            var uniformMap = this.getOrCreateUniforms( texUnit );
            uniformMap.ViewMatrix.set( this._viewMatrix );
            uniformMap.ProjectionMatrix.set( this._projectionMatrix );
            uniformMap.DepthRange.set( this._depthRange );
            uniformMap.MapSize.set( this._mapSize );

            this.setDirty( false );
        },

        getHashString: function () {

            return this.getTypeMember() + '_' + this._lightUnit + '_' +
                this._type;

        }

    } ), 'osgShadow', 'ShadowTexture' );

    MACROUTILS.setTypeID( ShadowTexture );

    return ShadowTexture;
} );
