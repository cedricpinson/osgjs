define( [
    'osg/Utils',
    'osg/StateAttribute',
    'osg/Vec4',
    'osg/Uniform',
    'osg/ShaderGenerator'
], function ( MACROUTILS, StateAttribute, Vec4, Uniform, ShaderGenerator ) {

    /**
     * Material
     * @class Material
     */
    var Material = function () {
        StateAttribute.call( this );
        this.ambient = [ 0.2, 0.2, 0.2, 1.0 ];
        this.diffuse = [ 0.8, 0.8, 0.8, 1.0 ];
        this.specular = [ 0.0, 0.0, 0.0, 1.0 ];
        this.emission = [ 0.0, 0.0, 0.0, 1.0 ];
        this.shininess = 12.5;
    };
    /** @lends Material.prototype */
    Material.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( StateAttribute.prototype, {
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
        getOrCreateUniforms: function () {
            if ( Material.uniforms === undefined ) {
                Material.uniforms = {
                    'ambient': Uniform.createFloat4( [ 0, 0, 0, 0 ], 'MaterialAmbient' ),
                    'diffuse': Uniform.createFloat4( [ 0, 0, 0, 0 ], 'MaterialDiffuse' ),
                    'specular': Uniform.createFloat4( [ 0, 0, 0, 0 ], 'MaterialSpecular' ),
                    'emission': Uniform.createFloat4( [ 0, 0, 0, 0 ], 'MaterialEmission' ),
                    'shininess': Uniform.createFloat1( [ 0 ], 'MaterialShininess' )
                };
                var uniformKeys = [];
                for ( var k in Material.uniforms ) {
                    uniformKeys.push( k );
                }
                Material.uniforms.uniformKeys = uniformKeys;
            }
            return Material.uniforms;
        },

        apply: function ( /*state*/ ) {
            var uniforms = this.getOrCreateUniforms();
            uniforms.ambient.set( this.ambient );
            uniforms.diffuse.set( this.diffuse );
            uniforms.specular.set( this.specular );
            uniforms.emission.set( this.emission );
            uniforms.shininess.set( [ this.shininess ] );
            this._dirty = false;
        },


        // will contain functions to generate shader
        _shader: {},
        _shaderCommon: {},

        generateShader: function ( type ) {
            if ( this._shader[ type ] ) {
                return this._shader[ type ].call( this );
            }
            return '';
        }

    } ), 'osg', 'Material' );


    Material.prototype._shader[ ShaderGenerator.Type.VertexInit ] = function () {
        var str = [ 'uniform vec4 MaterialAmbient;',
            'uniform vec4 MaterialDiffuse;',
            'uniform vec4 MaterialSpecular;',
            'uniform vec4 MaterialEmission;',
            'uniform float MaterialShininess;',
            ''
        ].join( '\n' );
        return str;
    };

    Material.prototype._shader[ ShaderGenerator.Type.FragmentInit ] = function () {
        var str = [ 'uniform vec4 MaterialAmbient;',
            'uniform vec4 MaterialDiffuse;',
            'uniform vec4 MaterialSpecular;',
            'uniform vec4 MaterialEmission;',
            'uniform float MaterialShininess;',
            ''
        ].join( '\n' );
        return str;
    };

    return Material;
} );
