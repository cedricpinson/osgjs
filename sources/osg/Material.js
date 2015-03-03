define( [
    'osg/Utils',
    'osg/StateAttribute',
    'osg/Vec4',
    'osg/Uniform',
    'osg/Map'
], function ( MACROUTILS, StateAttribute, Vec4, Uniform, Map ) {
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
                'ambient': Uniform.createFloat4( [ 0, 0, 0, 0 ], 'MaterialAmbient' ),
                'diffuse': Uniform.createFloat4( [ 0, 0, 0, 0 ], 'MaterialDiffuse' ),
                'specular': Uniform.createFloat4( [ 0, 0, 0, 0 ], 'MaterialSpecular' ),
                'emission': Uniform.createFloat4( [ 0, 0, 0, 0 ], 'MaterialEmission' ),
                'shininess': Uniform.createFloat1( [ 0 ], 'MaterialShininess' )
            };

            obj.uniforms = new Map( uniformList );
            return obj.uniforms;
        },


        setEmission: function ( a ) {
            Vec4.copy( a, this._emission );
            this._dirty = true;
        },

        getEmission: function () {
            return this._emission;
        },


        setAmbient: function ( a ) {
            Vec4.copy( a, this._ambient );
            this._dirty = true;
        },

        getAmbient: function () {
            return this._ambient;
        },


        setSpecular: function ( a ) {
            Vec4.copy( a, this._specular );
            this._dirty = true;
        },

        getSpecular: function () {
            return this._specular;
        },


        setDiffuse: function ( a ) {
            Vec4.copy( a, this._diffuse );
            this._dirty = true;
        },

        getDiffuse: function () {
            return this._diffuse;
        },


        setShininess: function ( a ) {
            this._shininess = a;
            this._dirty = true;
        },

        getShininess: function () {
            return this._shininess;
        },


        setTransparency: function ( a ) {
            this._diffuse[ 3 ] = 1.0 - a;
            this._dirty = true;
        },

        getTransparency: function () {
            return this._diffuse[ 3 ];
        },



        apply: function ( /*state*/) {
            var uniforms = this.getOrCreateUniforms();

            uniforms.ambient.set( this._ambient );
            uniforms.diffuse.set( this._diffuse );
            uniforms.specular.set( this._specular );
            uniforms.emission.set( this._emission );
            uniforms.shininess.set( [ this._shininess ] );

            this.setDirty( false );
        }


    } ), 'osg', 'Material' );

    return Material;
} );
