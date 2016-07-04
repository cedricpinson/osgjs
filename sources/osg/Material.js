'use strict';
var MACROUTILS = require( 'osg/Utils' );
var StateAttribute = require( 'osg/StateAttribute' );
var Vec4 = require( 'osg/Vec4' );
var Uniform = require( 'osg/Uniform' );
var Map = require( 'osg/Map' );

// Define a material attribute
var Material = function () {
    StateAttribute.call( this );
    this._ambient = Vec4.createAndSet( 0.2, 0.2, 0.2, 1.0 );
    this._diffuse = Vec4.createAndSet( 0.8, 0.8, 0.8, 1.0 );
    this._specular = Vec4.createAndSet( 0.0, 0.0, 0.0, 1.0 );
    this._emission = Vec4.createAndSet( 0.0, 0.0, 0.0, 1.0 );
    this._shininess = 12.5;
};

Material.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( StateAttribute.prototype, {

    attributeType: 'Material',

    cloneType: function () {
        return new Material();
    },

    getParameterName: function ( name ) {
        return this.getType() + '_uniform_' + name;
    },

    getOrCreateUniforms: function () {
        var obj = Material;
        if ( obj.uniforms ) return obj.uniforms;

        var uniformList = {
            ambient: Uniform.createFloat4( Vec4.create(), 'MaterialAmbient' ),
            diffuse: Uniform.createFloat4( Vec4.create(), 'MaterialDiffuse' ),
            specular: Uniform.createFloat4( Vec4.create(), 'MaterialSpecular' ),
            emission: Uniform.createFloat4( Vec4.create(), 'MaterialEmission' ),
            shininess: Uniform.createFloat1( [ 0 ], 'MaterialShininess' )
        };

        obj.uniforms = new Map( uniformList );
        return obj.uniforms;
    },

    setEmission: function ( a ) {
        Vec4.copy( a, this._emission );
    },

    getEmission: function () {
        return this._emission;
    },

    setAmbient: function ( a ) {
        Vec4.copy( a, this._ambient );
    },

    getAmbient: function () {
        return this._ambient;
    },

    setSpecular: function ( a ) {
        Vec4.copy( a, this._specular );
    },

    getSpecular: function () {
        return this._specular;
    },

    setDiffuse: function ( a ) {
        Vec4.copy( a, this._diffuse );
    },

    getDiffuse: function () {
        return this._diffuse;
    },

    setShininess: function ( a ) {
        this._shininess = a;
    },

    getShininess: function () {
        return this._shininess;
    },

    setTransparency: function ( a ) {
        this._diffuse[ 3 ] = 1.0 - a;
    },

    getTransparency: function () {
        return this._diffuse[ 3 ];
    },

    apply: function () {
        var uniforms = this.getOrCreateUniforms();

        uniforms.ambient.setFloat4( this._ambient );
        uniforms.diffuse.setFloat4( this._diffuse );
        uniforms.specular.setFloat4( this._specular );
        uniforms.emission.setFloat4( this._emission );
        uniforms.shininess.setFloat( this._shininess );

    }


} ), 'osg', 'Material' );

module.exports = Material;
