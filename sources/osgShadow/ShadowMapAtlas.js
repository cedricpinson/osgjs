'use strict';
var notify = require( 'osg/notify' );
var StateAttribute = require( 'osg/StateAttribute' );
var Texture = require( 'osg/Texture' );
var Uniform = require( 'osg/Uniform' );
var MACROUTILS = require( 'osg/Utils' );
var Scissor = require( 'osg/Scissor' );
var vec4 = require( 'osg/glMatrix' ).vec4;
var ShadowTechnique = require( 'osgShadow/ShadowTechnique' );
var ShadowTextureAtlas = require( 'osgShadow/ShadowTextureAtlas' );
var ShadowMap = require( 'osgShadow/ShadowMap' );

/**
 *  ShadowMapAtlas provides an implementation of shadow textures.
 * here, one shadow
 *  @class ShadowMapAtlas
 */
var ShadowMapAtlas = function ( settings ) {

    this._lights = [];
    this._shadowMaps = [];
    this._viewportDimension = [];

    ShadowTechnique.apply( this, arguments );
    this._shadowSettings = settings;
    this._texture = new ShadowTextureAtlas();
    this._textureUnitBase = 4;
    this._textureUnit = this._textureUnitBase;

    // see shadowSettings.js header for param explanations
    this._textureMagFilter = undefined;
    this._textureMinFilter = undefined;


    this._textureSize = 1024;
    this._shadowMapSize = 256;

    this._receivingStateset = undefined;

    this._shaderProcessor = undefined;

    if ( settings ) {

        this.setShadowSettings( settings );
        if ( settings.atlasSize ) this._textureSize = settings.atlasSize;
        if ( settings.textureSize ) this._shadowMapSize = settings.textureSize;

    }

    this._texelSizeUniform = Uniform.createFloat1( 1.0 / this._textureSize, 'texelSize' );

    var unifRenderSize = Uniform.createFloat2( 'RenderSize' );
    this._renderSize = unifRenderSize.getInternalArray();
    this._renderSize[ 0 ] = this._renderSize[ 1 ] = this._textureSize;

    this._numShadowWidth = this._textureSize / this._shadowMapSize;
    this._numShadowHeight = this._textureSize / this._shadowMapSize;

};


/** @lends ShadowMapAtlas.prototype */
MACROUTILS.createPrototypeObject( ShadowMapAtlas, MACROUTILS.objectInherit( ShadowTechnique.prototype, {

    getTexture: function () {
        return this._texture;
    },

    isDirty: function ( ligthtIndex ) {
        if ( ligthtIndex !== undefined ) {
            return this._shadowMaps[ ligthtIndex ].isDirty();
        } else {
            for ( var i = 0, l = this._shadowMaps.length; i < l; i++ ) {
                if ( this._shadowMaps[ i ].isDirty() ) return true;
            }
        }
        return false;
    },
    /**
     * at which Texture unit number we start adding texture shadow
     */
    setTextureUnitBase: function ( unitBase ) {
        this._textureUnitBase = unitBase;
        this._textureUnit = unitBase;

        for ( var i = 0, l = this._shadowMaps.length; i < l; i++ ) {
            this._shadowMaps[ i ].setTextureUnitBase( unitBase );
        }
    },

    /* Sets  shadowSettings
     */
    setShadowSettings: function ( shadowSettings ) {

        if ( !shadowSettings ) return;
        this._shadowSettings = shadowSettings;

        for ( var i = 0, l = this._shadowMaps.length; i < l; i++ )
            this._shadowMaps[ i ].setShadowSettings( shadowSettings );

        this.setTextureSize( shadowSettings.textureSize );
        this.setTexturePrecision( shadowSettings.textureType );

    },

    setCastsShadowDrawTraversalMask: function ( mask ) {

        for ( var i = 0, l = this._shadowMaps.length; i < l; i++ ) {
            this._shadowMaps[ i ].setCastsShadowDrawTraversalMask( mask );
        }

    },

    getCastsShadowDrawTraversalMask: function ( numShadow ) {

        if ( numShadow !== undefined ) {
            return this._shadowMaps[ numShadow ].getCastsShadowDrawTraversalMask();
        } else if ( this._shadowMaps.length !== 0 ) {
            return this._shadowMaps[ 0 ].getCastsShadowDrawTraversalMask();
        }

    },

    setCastsShadowBoundsTraversalMask: function ( mask ) {

        for ( var i = 0, l = this._shadowMaps.length; i < l; i++ ) {
            this._shadowMaps[ i ].setCastsShadowBoundsTraversalMask( mask );
        }

    },

    getCastsShadowBoundsTraversalMask: function ( numShadow ) {

        if ( numShadow !== undefined ) {
            return this._shadowMaps[ numShadow ].getCastsShadowDrawTraversalMask();
        } else if ( this._shadowMaps.length !== 0 ) {
            return this._shadowMaps[ 0 ].getCastsShadowDrawTraversalMask();
        }

    },


    getNormalBias: function ( numShadow ) {

        if ( numShadow !== undefined ) {
            return this._shadowMaps[ numShadow ].getNormalBias();
        } else if ( this._shadowMaps.length !== 0 ) {
            return this._shadowMaps[ 0 ].getNormalBias();
        }

    },

    setNormalBias: function ( value ) {

        for ( var i = 0, l = this._shadowMaps.length; i < l; i++ ) {
            this._shadowMaps[ i ].setNormalBias( value );
        }

    },

    getBias: function ( numShadow ) {

        if ( numShadow !== undefined ) {
            return this._shadowMaps[ numShadow ].getBias();
        } else if ( this._shadowMaps.length !== 0 ) {
            return this._shadowMaps[ 0 ].getBias();
        }

    },

    setBias: function ( value ) {

        for ( var i = 0, l = this._shadowMaps.length; i < l; i++ ) {
            this._shadowMaps[ i ].setBias( value );
        }

    },

    getKernelSizePCF: function ( numShadow ) {

        if ( numShadow !== undefined ) {
            return this._shadowMaps[ numShadow ].getKernelSizePCF();
        } else if ( this._shadowMaps.length !== 1 ) {
            return this._shadowMaps[ 0 ].getKernelSizePCF();
        }

    },

    setKernelSizePCF: function ( value ) {

        for ( var i = 0, l = this._shadowMaps.length; i < l; i++ ) {
            this._shadowMaps[ i ].setKernelSizePCF( value );
        }
    },

    setShadowedScene: function ( shadowedScene ) {

        ShadowTechnique.prototype.setShadowedScene.call( this, shadowedScene );
        this._receivingStateset = this._shadowedScene.getReceivingStateSet();

        for ( var i = 0, l = this._shadowMaps.length; i < l; i++ ) {
            this._shadowMaps[ i ].setShadowedScene( shadowedScene );
        }

    },

    setTexturePrecision: function ( value ) {

        for ( var i = 0, l = this._shadowMaps.length; i < l; i++ ) {
            this._shadowMaps[ i ].setTexturePrecision( value );
        }

    },

    getTexturePrecision: function ( numShadow ) {

        if ( numShadow !== undefined ) {
            return this._shadowMaps[ numShadow ].getTexturePrecision();
        } else if ( this._shadowMaps.length !== 1 ) {
            return this._shadowMaps[ 0 ].getTexturePrecision();
        }

    },


    setTextureSize: function ( mapSize ) {

        if ( mapSize === this._textureSize ) return;

        //this._textureSize = mapSize;
        //this._textureSize = settings.atlasSize;
        this._shadowMapSize = mapSize;


        this._numShadowWidth = this._textureSize / this._shadowMapSize;
        this._numShadowHeight = this._textureSize / this._shadowMapSize;

        this.dirty();
    },

    getShadowMap: function ( lightNum ) {
        return this._shadowMaps[ lightNum ];
    },

    addLight: function ( light ) {

        if ( !light || this._lights.indexOf( light ) !== -1 ) {
            notify.warn( 'no light or light already added' );
            return -1;
        }

        var lightCount = this._lights.length;
        if ( lightCount === ( this._numShadowWidth * this._numShadowHeight ) ) {
            notify.warn( 'can\'t allocate shadow for light ' + light.getLightNumber() + ' ShadowAtlas already full ' );
            return undefined;
        }

        this._lights.push( light );
        this._shadowSettings.setLight( light );
        var shadowMap = new ShadowMap( this._shadowSettings, this._texture );
        this._shadowMaps.push( shadowMap );

        var mapSize = this._shadowMapSize;
        var y = mapSize * ( lightCount % ( this._numShadowWidth ) );
        var x = mapSize * ( Math.floor( lightCount / ( this._numShadowHeight ) ) );

        shadowMap.setShadowedScene( this._shadowedScene );
        this._viewportDimension.push( vec4.fromValues( x, y, mapSize, mapSize ) );

        return shadowMap;

    },


    /** initialize the ShadowedScene and local cached data structures.*/
    init: function () {

        if ( !this._shadowedScene ) return;

        this.initTexture();
        var lightNumberArray = [];
        for ( var k = 0; k < this._lights.length; k++ ) {
            lightNumberArray.push( this._lights[ k ].getLightNumber() );
        }
        this._texture.setLightNumberArray( lightNumberArray );

        this._textureUnit = this._textureUnitBase;
        this._texture.setName( 'ShadowTexture' + this._textureUnit );

        this._numShadowWidth = this._textureSize / this._shadowMapSize;
        this._numShadowHeight = this._textureSize / this._shadowMapSize;

        var unifRenderSize = Uniform.createFloat2( 'RenderSize' );
        this._texelSizeUniform = Uniform.createFloat1( 1.0 / this._textureSize, 'texelSize' );
        this._renderSize = unifRenderSize.getInternalArray();
        this._renderSize[ 0 ] = this._renderSize[ 1 ] = this._textureSize;

        for ( var i = 0, l = this._shadowMaps.length; i < l; i++ ) {

            var mapSize = this._shadowMapSize;
            var y = mapSize * ( i % ( this._numShadowWidth ) );
            var x = mapSize * ( Math.floor( i / ( this._numShadowHeight ) ) );


            this._viewportDimension[ i ] = vec4.fromValues( x, y, mapSize, mapSize );
            this._shadowMaps[ i ].init( this._texture, i, this._textureUnitBase );
            this._texture.setLightShadowMapSize( i, this._viewportDimension[ i ] );

            var st = this._shadowMaps[ i ].getCamera().getOrCreateStateSet();
            var scissor = new Scissor( x, y, mapSize, mapSize );
            st.setAttributeAndModes( scissor, StateAttribute.ON | StateAttribute.OVERRIDE );

        }

    },
    valid: function () {
        // checks
        return true;
    },

    updateShadowTechnique: function ( nv ) {

        for ( var i = 0, l = this._shadowMaps.length; i < l; i++ ) {
            this._shadowMaps[ i ].updateShadowTechnique( nv, this._viewportDimension[ i ] );
        }

    },

    // internal texture allocation
    // handle any change like resize, filter param, etc.
    initTexture: function () {

        if ( !this._dirty ) return;

        if ( !this._texture ) {
            this._texture = new ShadowTextureAtlas();
            this._textureUnit = this._textureUnitBase;
        }


        this._texture.setTextureSize( this._textureSize, this._textureSize );
        this._texelSizeUniform.setFloat( 1.0 / this._textureSize );
        this._renderSize[ 0 ] = this._textureSize;
        this._renderSize[ 1 ] = this._textureSize;

        var textureFormat;
        // luminance Float format ?
        textureFormat = Texture.RGBA;

        ShadowMap.prototype.setTextureFiltering.call( this );
        this._texture.setInternalFormat( textureFormat );

        this._texture.setWrapS( Texture.CLAMP_TO_EDGE );
        this._texture.setWrapT( Texture.CLAMP_TO_EDGE );

        this._texture.dirty();

    },

    // Defines the frustum from light param.
    //
    cullShadowCasting: function ( cullVisitor ) {

        for ( var i = 0, l = this._shadowMaps.length; i < l; i++ ) {
            this._shadowMaps[ i ].cullShadowCasting( cullVisitor );
        }

    },

    cleanReceivingStateSet: function () {

        if ( this._receivingStateset ) {

            if ( this._texture ) {
                // remove this._texture, but not if it's not this._texture
                if ( this._receivingStateset.getTextureAttribute( this._textureUnit, this._texture.getTypeMember() ) === this._texture )
                    this._receivingStateset.removeTextureAttribute( this._textureUnit, this._texture.getTypeMember() );
            }

            for ( var i = 0, l = this._shadowMaps.length; i < l; i++ ) {
                this._shadowMaps[ i ].cleanReceivingStateSet();
            }

        }

    },
    cleanSceneGraph: function () {
        // TODO: need state
        //this._texture.releaseGLObjects();
        //this._shadowReceiveAttribute = undefined;
        this._texture = undefined;
        this._shadowedScene = undefined;
    },

    setDebug: function ( enable, lightNum ) {

        if ( !lightNum ) {
            for ( var i = 0, l = this._shadowMaps.length; i < l; i++ ) {
                this._shadowMaps[ i ].setDebug( enable );
            }
        } else {
            this._shadowMaps[ lightNum ].setDebug( enable );
        }

    }

} ), 'osgShadow', 'ShadowMapAtlas' );

module.exports = ShadowMapAtlas;
