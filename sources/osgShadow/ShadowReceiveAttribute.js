'use strict';

var MACROUTILS = require( 'osg/Utils' );
var StateAttribute = require( 'osg/StateAttribute' );
var Uniform = require( 'osg/Uniform' );
var Notify = require( 'osg/notify' );


/**
 * ShadowReceiveAttribute encapsulate Shadow Main State object
 * @class ShadowReceiveAttribute
 * @inherits StateAttribute
 */
var ShadowReceiveAttribute = function ( lightNum, disable ) {
    StateAttribute.call( this );

    this._lightNumber = lightNum;


    // see shadowSettings.js header for shadow algo param explanations
    // hash change var


    // shadow depth bias as projected in shadow camera space texture
    // and viewer camera space projection introduce its bias
    this._bias = 0.001;

    // shadow normal bias from normal exploding offset technique
    this._normalBias = undefined;
    // shader compilation different upon texture precision
    this._precision = 'UNSIGNED_BYTE';
    // kernel size & type for pcf
    this._kernelSizePCF = undefined;

    this._fakePCF = true;

    this._rotateOffset = false;

    this._enable = !disable;
    this._isAtlasTexture = false;
};

ShadowReceiveAttribute.uniforms = {};
ShadowReceiveAttribute.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( StateAttribute.prototype, {

    attributeType: 'ShadowReceive',

    cloneType: function () {
        return new ShadowReceiveAttribute( this._lightNumber, true );
    },

    getTypeMember: function () {
        return this.attributeType + this.getLightNumber();
    },

    getLightNumber: function () {
        return this._lightNumber;
    },

    getUniformName: function ( name ) {
        var prefix = this.getType() + this.getLightNumber().toString();
        return 'u' + prefix + '_' + name;
    },

    getAtlas: function () {
        return this._isAtlasTexture;
    },
    setAtlas: function ( v ) {
        this._isAtlasTexture = v;
    },

    setBias: function ( bias ) {
        this._bias = bias;
    },

    getBias: function () {
        return this._bias;
    },

    setNormalBias: function ( bias ) {
        this._normalBias = bias;
    },

    getNormalBias: function () {
        return this._normalBias;
    },

    getKernelSizePCF: function () {
        return this._kernelSizePCF;
    },

    setKernelSizePCF: function ( v ) {
        this._kernelSizePCF = v;
    },

    setPrecision: function ( precision ) {
        this._precision = precision;
    },

    getPrecision: function () {
        return this._precision;
    },

    setLightNumber: function ( lightNum ) {
        this._lightNumber = lightNum;
    },

    getOrCreateUniforms: function () {
        // uniform are once per CLASS attribute, not per instance
        var obj = ShadowReceiveAttribute;

        var typeMember = this.getTypeMember();

        if ( obj.uniforms[ typeMember ] ) return obj.uniforms[ typeMember ];

        obj.uniforms[ typeMember ] = {
            bias: Uniform.createFloat( this.getUniformName( 'bias' ) ),
            normalBias: Uniform.createFloat( this.getUniformName( 'normalBias' ) )
        };

        return obj.uniforms[ typeMember ];
    },

    getExtensions: function () {
        return [ '#extension GL_OES_standard_derivatives : enable' ];
    },

    // Here to be common between  caster and receiver
    // (used by shadowMap and shadow node shader)
    getDefines: function () {

        var textureType = this.getPrecision();
        var defines = [];

        var isFloat = false;

        if ( textureType !== 'UNSIGNED_BYTE' )
            isFloat = true;

        var pcf = this.getKernelSizePCF();
        switch ( pcf ) {
        case '4Tap(16texFetch)':
            defines.push( '#define _PCFx4' );
            break;
        case '9Tap(36texFetch)':
            defines.push( '#define _PCFx9' );
            break;
        case '16Tap(64texFetch)':
            defines.push( '#define _PCFx25' );
            break;
        default:
        case '1Tap(4texFetch)':
            defines.push( '#define _PCFx1' );
            break;
        }

        if ( isFloat ) {
            defines.push( '#define _FLOATTEX' );
        }

        if ( this.getAtlas() ) {
            defines.push( '#define _ATLAS_SHADOW' );
        }

        if ( this.getNormalBias() ) {
            defines.push( '#define _NORMAL_OFFSET' );
        }

        return defines;
    },

    apply: function () {

        if ( !this._enable ) return;

        var uniformMap = this.getOrCreateUniforms();

        uniformMap.normalBias.setFloat( this._normalBias );
        uniformMap.bias.setFloat( this._bias );

    },

    // need a isEnabled to let the ShaderGenerator to filter
    // StateAttribute from the shader compilation
    isEnabled: function () {
        return this._enable;
    },

    // Deprecated methods, should be removed in the future
    isEnable: function () {
        Notify.log( 'ShadowAttribute.isEnable() is deprecated, use isEnabled() instead' );
        return this.isEnabled();
    },

    getHash: function () {
        return this.getTypeMember() + '_' + this.getKernelSizePCF();

    }

} ), 'osgShadow', 'ShadowReceiveAttribute' );

MACROUTILS.setTypeID( ShadowReceiveAttribute );

module.exports = ShadowReceiveAttribute;
