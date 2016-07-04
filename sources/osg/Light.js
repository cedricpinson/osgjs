'use strict';
var MACROUTILS = require( 'osg/Utils' );
var StateAttribute = require( 'osg/StateAttribute' );
var Uniform = require( 'osg/Uniform' );
var Matrix = require( 'osg/Matrix' );
var Vec3 = require( 'osg/Vec3' );
var Vec4 = require( 'osg/Vec4' );
var Map = require( 'osg/Map' );
var Notify = require( 'osg/Notify' );


// use the same kind of opengl lights
// see http://www.glprogramming.com/red/chapter05.html


var Light = function ( lightNum, disable ) {
    StateAttribute.call( this );

    var lightNumber = lightNum !== undefined ? lightNum : 0;

    this._ambient = Vec4.createAndSet( 0.2, 0.2, 0.2, 1.0 );
    this._diffuse = Vec4.createAndSet( 0.8, 0.8, 0.8, 1.0 );
    this._specular = Vec4.createAndSet( 0.2, 0.2, 0.2, 1.0 );

    // Default is directional as postion[3] is 0
    this._position = Vec4.createAndSet( 0.0, 0.0, 1.0, 0.0 );
    this._direction = Vec3.createAndSet( 0.0, 0.0, -1.0 );

    // TODO : refactor lights management w=1.0 (isHemi), w=-1.0
    // (isNotHemi) _ground contains the color but w says if it's
    // an hemi or not
    this._ground = Vec4.createAndSet( 0.2, 0.2, 0.2, -1.0 );

    this._spotCutoff = 180.0;
    this._spotBlend = 0.01;

    // the array contains constant, linear, quadratic factor
    this._attenuation = Vec4.createAndSet( 1.0, 0.0, 0.0, 0.0 );

    this._lightUnit = lightNumber;

    this._invMatrix = Matrix.create();

    this._enable = !disable;

};

Light.DIRECTION = 'DIRECTION';
Light.SPOT = 'SPOT';
Light.POINT = 'POINT';
Light.HEMI = 'HEMI';

Light.uniforms = {};
Light.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( StateAttribute.prototype, {

    attributeType: 'Light',

    cloneType: function () {
        return new Light( this._lightUnit, true );
    },

    getTypeMember: function () {
        return this.attributeType + this._lightUnit;
    },

    getUniformName: function ( name ) {
        var prefix = this.getType() + this._lightUnit.toString();
        return prefix + '_uniform_' + name;
    },

    getHash: function () {
        return this.getTypeMember() + this.getLightType() + this.isEnabled().toString();
    },

    getOrCreateUniforms: function () {

        var obj = Light;
        var typeMember = this.getTypeMember();

        if ( obj.uniforms[ typeMember ] ) return obj.uniforms[ typeMember ];

        var uniformList = {
            ambient: 'createFloat4',
            diffuse: 'createFloat4',
            specular: 'createFloat4',

            attenuation: 'createFloat4',
            position: 'createFloat4',
            direction: 'createFloat3',

            spotCutOff: 'createFloat1',
            spotBlend: 'createFloat1',

            ground: 'createFloat4',

            matrix: 'createMatrix4',
            invMatrix: 'createMatrix4'
        };

        var uniforms = {};

        window.Object.keys( uniformList ).forEach( function ( key ) {

            var type = uniformList[ key ];
            var func = Uniform[ type ];
            uniforms[ key ] = func( this.getUniformName( key ) );

        }.bind( this ) );

        obj.uniforms[ typeMember ] = new Map( uniforms );

        return obj.uniforms[ typeMember ];
    },

    // enable / disable is not implemented in uniform
    // we should add it
    isEnabled: function () {
        return this._enable;
    },

    setEnabled: function ( bool ) {
        this._enable = bool;
    },

    // Deprecated methods, should be removed in the future
    isEnable: function () {
        Notify.log( 'Light.isEnable() is deprecated, use isEnabled instead' );
        return this.isEnabled();
    },

    setEnable: function ( bool ) {
        Notify.log( 'Light.setEnable() is deprecated, use setEnabled instead' );
        this.setEnabled( bool );
    },

    // colors
    setAmbient: function ( a ) {
        Vec4.copy( a, this._ambient );
    },

    getAmbient: function () {
        return this._ambient;
    },

    setDiffuse: function ( a ) {
        Vec4.copy( a, this._diffuse );
    },

    getDiffuse: function () {
        return this._diffuse;
    },

    setSpecular: function ( a ) {
        Vec4.copy( a, this._specular );
    },

    getSpecular: function () {
        return this._specular;
    },


    // position, also used for directional light
    // position[3] === 0 means directional
    // see creating lightsources http://www.glprogramming.com/red/chapter05.html
    setPosition: function ( a ) {
        Vec4.copy( a, this._position );
    },

    getPosition: function () {
        return this._position;
    },

    // unused for directional
    setDirection: function ( a ) {
        Vec3.copy( a, this._direction );
    },

    getDirection: function () {
        return this._direction;
    },


    setSpotCutoff: function ( a ) {
        this._spotCutoff = a;
    },

    getSpotCutoff: function () {
        return this._spotCutoff;
    },

    setSpotBlend: function ( a ) {
        this._spotBlend = a;
    },

    getSpotBlend: function () {
        return this._spotBlend;
    },

    // set/get the color of the ground
    setGround: function ( a ) {
        Vec3.copy( a, this._ground );
    },

    getGround: function () {
        return this._ground;
    },

    // attenuation coeff
    setConstantAttenuation: function ( value ) {
        this._attenuation[ 0 ] = value;
    },

    getConstantAttenuation: function () {
        return this._attenuation[ 0 ];
    },

    setLinearAttenuation: function ( value ) {
        this._attenuation[ 1 ] = value;
    },

    getLinearAttenuation: function () {
        return this._attenuation[ 1 ];
    },

    setQuadraticAttenuation: function ( value ) {
        this._attenuation[ 2 ] = value;
    },

    getQuadraticAttenuation: function () {
        return this._attenuation[ 2 ];
    },

    setLightType: function ( type ) {
        if ( type === Light.DIRECTION )
            return this.setLightAsDirection();
        else if ( type === Light.SPOT )
            return this.setLightAsSpot();
        else if ( type === Light.HEMI )
            return this.setLightAsHemi();
        return this.setLightAsPoint();
    },

    getLightType: function () {
        if ( this.isDirectionLight() )
            return Light.DIRECTION;
        else if ( this.isSpotLight() )
            return Light.SPOT;
        else if ( this.isHemiLight() )
            return Light.HEMI;
        return Light.POINT;
    },

    setLightAsSpot: function () {
        Vec4.set( 0.0, 0.0, 0.0, 1.0, this._position );
        Vec3.set( 0.0, 0.0, -1.0, this._direction );
        this._ground[ 3 ] = -1.0;
        this._spotCutoff = 90;
    },

    setLightAsPoint: function () {
        Vec4.set( 0.0, 0.0, 0.0, 1.0, this._position );
        Vec3.set( 0.0, 0.0, -1.0, this._direction );
        this._ground[ 3 ] = -1.0;
    },

    setLightAsDirection: function () {
        Vec4.set( 0.0, 0.0, 1.0, 0.0, this._position );
        this._spotCutoff = 180;
        this._ground[ 3 ] = -1.0;
    },

    setLightAsHemi: function () {
        Vec4.set( 0.0, 0.0, 1.0, 0.0, this._position );
        this._spotCutoff = 180;
        this._ground[ 3 ] = 1.0;
    },

    setLightNumber: function ( unit ) {
        this._lightUnit = unit;
    },

    getLightNumber: function () {
        return this._lightUnit;
    },

    // internal helper
    isSpotLight: function () {
        return this._spotCutoff < 180.0;
    },

    isDirectionLight: function () {
        return this._position[ 3 ] === 0.0 && this._ground[ 3 ] < 0.0;
    },

    isHemiLight: function () {
        return this._ground[ 3 ] >= 0.0;
    },

    // matrix is current model view, which can mean:
    // world (node refAbsolute)
    // world+camera (camera is refAbsolute)
    // world+camera+camera+... (camera relative...)
    applyPositionedUniform: function ( matrix ) {

        var uniformMap = this.getOrCreateUniforms();

        var matrixArray = uniformMap.matrix.getInternalArray();
        var invMatrixArray = uniformMap.invMatrix.getInternalArray();

        Matrix.copy( matrix, matrixArray );
        Matrix.copy( matrix, invMatrixArray );

        invMatrixArray[ 12 ] = 0.0;
        invMatrixArray[ 13 ] = 0.0;
        invMatrixArray[ 14 ] = 0.0;

        Matrix.inverse( invMatrixArray, invMatrixArray );
        Matrix.transpose( invMatrixArray, invMatrixArray );
    },

    apply: function () {

        if ( !this._enable ) return;

        var uniformMap = this.getOrCreateUniforms();

        uniformMap.position.setFloat4( this._position );

        if ( this.isSpotLight() ) {
            var spotsize = Math.cos( this._spotCutoff * Math.PI / 180.0 );
            uniformMap.spotCutOff.setFloat( spotsize );
            uniformMap.spotBlend.setFloat( ( 1.0 - spotsize ) * this._spotBlend );
            uniformMap.direction.setFloat3( this._direction );
        }

        if ( this.isHemiLight() )
            uniformMap.ground.setFloat4( this._ground );

        uniformMap.attenuation.setFloat4( this._attenuation );
        uniformMap.diffuse.setFloat4( this._diffuse );
        uniformMap.specular.setFloat4( this._specular );
        uniformMap.ambient.setFloat4( this._ambient );
    }

} ), 'osg', 'Light' );

MACROUTILS.setTypeID( Light );

module.exports = Light;
