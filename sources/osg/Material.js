define( [
    'osg/Utils',
    'osg/StateAttribute',
    'osg/Vec4',
    'osg/Uniform',
    'osgShader/ShaderGeneratorProxy',
    'osg/Map'
], function ( MACROUTILS, StateAttribute, Vec4, Uniform, ShaderGenerator, Map ) {
    'use strict';

    // Define a material attribute
    var Material = function () {
        StateAttribute.call( this );
        this._ambient = [ 0.2, 0.2, 0.2, 1.0 ];
        this._diffuse = [ 0.8, 0.8, 0.8, 1.0 ];
        this._specular = [ 0.0, 0.0, 0.0, 1.0 ];
        this._emission = [ 0.0, 0.0, 0.0, 1.0 ];
        this._shininess = 12.5;
        this._shadeless = false;
    };

    Material.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( StateAttribute.prototype, {
        setEmission: function ( a ) {
            Vec4.copy( a, this._emission );
            this._dirty = true;
        },
        setAmbient: function ( a ) {
            Vec4.copy( a, this._ambient );
            this._dirty = true;
        },
        setSpecular: function ( a ) {
            Vec4.copy( a, this._specular );
            this._dirty = true;
        },
        setDiffuse: function ( a ) {
            Vec4.copy( a, this._diffuse );
            this._dirty = true;
        },
        setShininess: function ( a ) {
            this._shininess = a;
            this._dirty = true;
        },

        getEmission: function () {
            return this._emission;
        },
        getAmbient: function () {
            return this._ambient;
        },
        getSpecular: function () {
            return this._specular;
        },
        getDiffuse: function () {
            return this._diffuse;
        },
        getShininess: function () {
            return this._shininess;
        },

        attributeType: 'Material',

        cloneType: function () {
            return new Material();
        },
        getType: function () {
            return this.attributeType;
        },
        getTypeMember: function () {
            return this.attributeType;
        },
        getParameterName: function ( name ) {
            return this.getType() + '_uniform_' + name;
        },

        getOrCreateUniforms: function () {

            var obj = Material;
            if ( obj.uniforms ) return obj.uniforms;

            var uniformList = {
                'ambient': 'createFloat4',
                'diffuse': 'createFloat4',
                'specular': 'createFloat4',
                'emission': 'createFloat4',
                'shininess': 'createFloat1'
            };

            var uniforms = {};
            Object.keys( uniformList ).forEach( function ( key ) {

                var type = uniformList[ key ];
                var func = Uniform[ type ];
                uniforms[ key ] = func( this.getParameterName( key ) );

            }.bind( this ) );

            obj.uniforms = new Map( uniforms );
            return obj.uniforms;
        },


        apply: function ( /*state*/) {
            var uniforms = this.getOrCreateUniforms();

            uniforms.ambient.set( this._ambient );
            uniforms.diffuse.set( this._diffuse );
            uniforms.specular.set( this._specular );
            uniforms.emission.set( this._emission );
            uniforms.shininess.set( [ this._shininess ] );

            this.setDirty( false );
        },

        getHash: function () {
            return this.attributeType + this._ambient.toString() + this._diffuse.toString() + this._specular.toString() + this._emission.toString() + this._shadeless.toString();
        }


    } ), 'osg', 'Material' );

    return Material;
} );
