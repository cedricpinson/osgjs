/*global define */

define ( [
    'osg/Utils',
    'osg/StateAttribute',
    'osg/Vec4',
    'osg/Uniform',
    'osgShader/ShaderGenerator',
    'osg/Map',
    'defineGetterSetter'

] , function( MACROUTILS, StateAttribute, Vec4, Uniform, ShaderGenerator, Map, defineGetterSetter ) {

    // Define a material attribute

    var Material = function() {
        StateAttribute.call(this);

        this._diffuseColor = [ 0,0,0];
        this._diffuseIntensity = [ 1,1,1];

        this._specularColor = [ 0,0,0];
        this._specularIntensity = 1.0;

        this._emitColor = [0.0, 0.0, 0.0];
        this._opacity = 1.0;
        this._specularHardness = 12.5;

        this._reflection = 0.0;

        this._shadeless = false;
    };

    Material.prototype = MACROUTILS.objectLibraryClass( defineGetterSetter(
        [ 'Shadeless',
          'Reflection'
        ],

        MACROUTILS.objectInherit( StateAttribute.prototype, {
            attributeType: 'Material',
            getHash: function() {
                return this.attributeType + this._diffuseShader + this._specularShader + this._shadeless.toString();
            },

            cloneType: function() {return new Material(); },
            getType: function() { return this.attributeType;},
            getTypeMember: function() { return this.attributeType;},
            getParameterName: function (name) { return this.getType()+ '_uniform_' + name; },

            getOrCreateUniforms: function () {

                var obj = Material;
                if ( obj.uniforms ) return obj.uniforms;

                var uniformList = {
                    'reflection': 'createFloat1'
                };

                var uniforms = {};
                Object.keys( uniformList ).forEach( function( key ) {

                    var type = uniformList[ key ];
                    var func = Uniform[ type ];
                    uniforms[ key ] = func( this.getParameterName( key ) );

                }.bind(this) );

                obj.uniforms = new Map( uniforms );
                return obj.uniforms;
            },


            apply: function( /*state*/ )
            {
                var uniformMap = this.getOrCreateUniforms();

                uniformMap.reflection.set( this._reflection );

                this.setDirty( false );
            }

        })), 'osg' , 'Material' );

    return Material;

});
