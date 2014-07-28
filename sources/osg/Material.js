/*global define */

define( [
    'osg/Utils',
    'osg/StateAttribute',
    'osg/Vec4',
    'osg/Uniform',
    'osgShader/ShaderGeneratorProxy',
    'osg/Map'
], function ( MACROUTILS, StateAttribute, Vec4, Uniform, ShaderGenerator, Map ) {

    // Define a material attribute

    var Material = function () {
        StateAttribute.call( this );
        this.ambient = [ 0.2, 0.2, 0.2, 1.0 ];
        this.diffuse = [ 0.8, 0.8, 0.8, 1.0 ];
        this.specular = [ 0.0, 0.0, 0.0, 1.0 ];
        this.emission = [ 0.0, 0.0, 0.0, 1.0 ];
        this.shininess = 12.5;
        this._shadeless = false;
    };

    Material.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( StateAttribute.prototype, {
        setEmission: function ( a ) {
            Vec4.copy( a, this.emission );
            this._dirty = true;
        },
        setAmbient: function ( a ) {
            Vec4.copy( a, this.ambient );
            this._dirty = true;
        },
        setSpecular: function ( a ) {
            Vec4.copy( a, this.specular );
            this._dirty = true;
        },
        setDiffuse: function ( a ) {
            Vec4.copy( a, this.diffuse );
            this._dirty = true;
        },
        setShininess: function ( a ) {
            this.shininess = a;
            this._dirty = true;
        },

        getEmission: function () {
            return this.emission;
        },
        getAmbient: function () {
            return this.ambient;
        },
        getSpecular: function () {
            return this.specular;
        },
        getDiffuse: function () {
            return this.diffuse;
        },
        getShininess: function () {
            return this.shininess;
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
                'ambient': 'createFloat1',
                'diffuse': 'createFloat1',
                'specular': 'createFloat1',
                'emission': 'createFloat1',
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

            uniforms.ambient.set( this.ambient );
            uniforms.diffuse.set( this.diffuse );
            uniforms.specular.set( this.specular );
            uniforms.emission.set( this.emission );
            uniforms.shininess.set( [ this.shininess ] );

            this.setDirty( false );
        },

        getHash: function () {
            return this.attributeType + this.ambient.toString() + this.diffuse.toString() + this.specular.toString() + this.emission.toString() + this._shadeless.toString();
        }


    } ), 'osg', 'Material' );

    return Material;
} );
