define( [
    'osg/Utils',
    'osg/Notify',
    'osg/StateAttribute',
    'osg/Texture',
    'osg/Uniform',
    'osg/Matrix',
    'osg/Vec3',
    'osg/Vec4',
    'osg/Viewport',
    'osg/Map'
], function ( MACROUTILS, Notify, StateAttribute, Texture, Uniform, Matrix, Vec3, Vec4, Viewport, Map ) {
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
        this._cameraDirty = false;
    };

    ShadowTexture.uniforms = {};
    /** @lends Texture.prototype */
    ShadowTexture.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( Texture.prototype, {
        attributeType: 'Texture',


        cloneType: function () {
            var t = new ShadowTexture();
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
        getVaryingName: function ( name ) {
            var prefix = this.getType() + this._lightUnit.toString();
            return prefix + '_varying_' + name;
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
        setCamera: function ( camera ) {
            if ( this._camera !== camera ) {
                this._cameraDirty = true;
                this._camera = camera;
            }
        },
        getCamera: function () {
            return this._camera;
        },
        setTextureSize: function ( w, h ) {
            Texture.prototype.setTextureSize.call( this, w, h );

            this._mapSize[ 0 ] = w;
            this._mapSize[ 1 ] = h;
            this._mapSize[ 2 ] = 1.0 / w;
            this._mapSize[ 3 ] = 1.0 / h;
            this._cameraDirty = true; // have to resize framebuffers
        },
        apply: function ( state, texUnit ) {

            var gl = state.getGraphicContext();
            if ( this._camera && this._dirty ) { /*this._cameraDirty */

                var frameBuffer = this._camera.frameBufferObject;
                this._camera.attachments = undefined;
                if ( frameBuffer ) {
                    frameBuffer.attachments = [];
                    frameBuffer.dirty();
                }

                this._camera.attachTexture( gl.COLOR_ATTACHMENT0, this );
                this._camera.attachRenderBuffer( gl.DEPTH_ATTACHMENT, gl.DEPTH_COMPONENT16 );

                this._camera.setViewport( new Viewport( 0, 0, this._textureWidth, this._textureHeight ) );
                this._cameraDirty = false;
            }

            // Texture stuff: call parent class method
            Texture.prototype.apply.call( this, state, texUnit );

            // update Uniforms
            var uniformMap = this.getOrCreateUniforms( texUnit );
            uniformMap.ViewMatrix.set( this._viewMatrix );
            uniformMap.ProjectionMatrix.set( this._projectionMatrix );
            uniformMap.DepthRange.set( this._depthRange );
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
