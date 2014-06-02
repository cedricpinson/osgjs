define( [
    'osg/Utils',
    'osg/StateAttribute',
    'osg/Uniform',
    'osg/Matrix',
    'osg/Vec4',
    'osg/ShaderGenerator',
    'osg/Map'
], function ( MACROUTILS, StateAttribute, Uniform, Matrix, Vec4, ShaderGenerator, Map ) {

    /**
     *  Light
     *  @class Light
     */
    var Light = function ( lightNumber ) {
        StateAttribute.call( this );

        if ( lightNumber === undefined ) {
            lightNumber = 0;
        }

        this._ambient = [ 0.2, 0.2, 0.2, 1.0 ];
        this._diffuse = [ 0.8, 0.8, 0.8, 1.0 ];
        this._specular = [ 0.2, 0.2, 0.2, 1.0 ];
        this._position = [ 0.0, 0.0, 1.0, 0.0 ];
        this._direction = [ 0.0, 0.0, -1.0 ];
        this._spotCutoff = 180.0;
        this._spotBlend = 0.01;
        this._constantAttenuation = 1.0;
        this._linearAttenuation = 0.0;
        this._quadraticAttenuation = 0.0;
        this._lightUnit = lightNumber;
        this._enabled = 0;

        this.dirty();
    };

    /** @lends Light.prototype */
    Light.uniforms = {};
    Light.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( StateAttribute.prototype, {
        attributeType: 'Light',
        cloneType: function () {
            return new Light( this._lightUnit );
        },
        getType: function () {
            return this.attributeType;
        },
        getTypeMember: function () {
            return this.attributeType + this._lightUnit;
        },
        getOrCreateUniforms: function () {
            var uniforms = Light.uniforms;
            var typeMember = this.getTypeMember();
            if ( uniforms[ typeMember ] === undefined ) {

                var map = new Map();
                uniforms[ typeMember ] = map;

                var uFact = Uniform;
                map.setMap( {
                    'ambient': uFact.createFloat4( [ 0.2, 0.2, 0.2, 1 ], this.getUniformName( 'ambient' ) ),
                    'diffuse': uFact.createFloat4( [ 0.8, 0.8, 0.8, 1 ], this.getUniformName( 'diffuse' ) ),
                    'specular': uFact.createFloat4( [ 0.2, 0.2, 0.2, 1 ], this.getUniformName( 'specular' ) ),
                    'position': uFact.createFloat4( [ 0, 0, 1, 0 ], this.getUniformName( 'position' ) ),
                    'direction': uFact.createFloat3( [ 0, 0, 1 ], this.getUniformName( 'direction' ) ),
                    'spotCutoff': uFact.createFloat1( 180.0, this.getUniformName( 'spotCutoff' ) ),
                    'spotBlend': uFact.createFloat1( 0.01, this.getUniformName( 'spotBlend' ) ),
                    'constantAttenuation': uFact.createFloat1( 0, this.getUniformName( 'constantAttenuation' ) ),
                    'linearAttenuation': uFact.createFloat1( 0, this.getUniformName( 'linearAttenuation' ) ),
                    'quadraticAttenuation': uFact.createFloat1( 0, this.getUniformName( 'quadraticAttenuation' ) ),
                    'enable': uFact.createInt1( 0, this.getUniformName( 'enable' ) ),

                    'matrix': uFact.createMatrix4( Matrix.create(), this.getUniformName( 'matrix' ) ),
                    'invMatrix': uFact.createMatrix4( Matrix.create(), this.getUniformName( 'invMatrix' ) )
                });
            }
            return uniforms[ typeMember ];
        },

        setPosition: function ( pos ) {
            Vec4.copy( pos, this._position );
        },
        getPosition: function () {
            return this._position;
        },

        setAmbient: function ( a ) {
            this._ambient = a;
            this.dirty();
        },
        setSpecular: function ( a ) {
            this._specular = a;
            this.dirty();
        },
        setDiffuse: function ( a ) {
            this._diffuse = a;
            this.dirty();
        },

        setSpotCutoff: function ( a ) {
            this._spotCutoff = a;
            this.dirty();
        },
        getSpotCutoff: function () {
            return this._spotCutoff;
        },

        setSpotBlend: function ( a ) {
            this._spotBlend = a;
            this.dirty();
        },
        getSpotBlend: function () {
            return this._spotBlend;
        },

        setConstantAttenuation: function ( value ) {
            this._constantAttenuation = value;
            this.dirty();
        },
        setLinearAttenuation: function ( value ) {
            this._linearAttenuation = value;
            this.dirty();
        },
        setQuadraticAttenuation: function ( value ) {
            this._quadraticAttenuation = value;
            this.dirty();
        },

        setDirection: function ( a ) {
            this._direction = a;
            this.dirty();
        },
        getDirection: function () {
            return this._direction;
        },

        setLightNumber: function ( unit ) {
            this._lightUnit = unit;
            this.dirty();
        },
        getLightNumber: function () {
            return this._lightUnit;
        },

        getPrefix: function () {
            return this.getType() + this._lightUnit;
        },
        getParameterName: function ( name ) {
            return this.getPrefix() + '_' + name;
        },
        getUniformName: function ( name ) {
            return this.getPrefix() + '_uniform_' + name;
        },

        applyPositionedUniform: function ( matrix /*, state */ ) {
            var uniformMap = this.getOrCreateUniforms();
            Matrix.copy( matrix, uniformMap.matrix.get() );
            uniformMap.matrix.dirty();

            Matrix.copy( matrix, uniformMap.invMatrix.get() );
            uniformMap.invMatrix.get()[ 12 ] = 0;
            uniformMap.invMatrix.get()[ 13 ] = 0;
            uniformMap.invMatrix.get()[ 14 ] = 0;
            Matrix.inverse( uniformMap.invMatrix.get(), uniformMap.invMatrix.get() );
            Matrix.transpose( uniformMap.invMatrix.get(), uniformMap.invMatrix.get() );
            uniformMap.invMatrix.dirty();
        },

        apply: function ( /*state*/ ) {
            var uniformMap = this.getOrCreateUniforms();

            uniformMap.ambient.set( this._ambient );
            uniformMap.diffuse.set( this._diffuse );
            uniformMap.specular.set( this._specular );
            uniformMap.position.set( this._position );
            uniformMap.direction.set( this._direction );

            var spotsize = Math.cos( this._spotCutoff * Math.PI / 180.0 );
            uniformMap.spotCutoff.get()[ 0 ] = spotsize;
            uniformMap.spotCutoff.dirty();

            uniformMap.spotBlend.get()[ 0 ] = ( 1.0 - spotsize ) * this._spotBlend;
            uniformMap.spotBlend.dirty();

            uniformMap.constantAttenuation.get()[ 0 ] = this._constantAttenuation;
            uniformMap.constantAttenuation.dirty();

            uniformMap.linearAttenuation.get()[ 0 ] = this._linearAttenuation;
            uniformMap.linearAttenuation.dirty();

            uniformMap.quadraticAttenuation.get()[ 0 ] = this._quadraticAttenuation;
            uniformMap.quadraticAttenuation.dirty();

            //light._enable.set([this.enable]);

            this.setDirty( false );
        },


        _replace: function ( prefix, list, text, func ) {
            for ( var i = 0, l = list.length; i < l; i++ ) {
                var regex = new RegExp( prefix + list[ i ], 'g' );
                text = text.replace( regex, func.call( this, list[ i ] ) );
            }
            return text;
        },

        // will contain functions to generate shader
        _shader: {},
        _shaderCommon: {},

        generateShader: function ( type ) {
            if ( this._shader[ type ] ) {
                return this._shader[ type ].call( this );
            }
            return '';
        },

        generateShaderCommon: function ( type ) {
            if ( this._shaderCommon[ type ] ) {
                return this._shaderCommon[ type ].call( this );
            }
            return '';
        }


    } ), 'osg', 'Light' );


    // common shader generation functions
    Light.prototype._shaderCommon[ ShaderGenerator.Type.VertexInit ] = function () {
        return [ '',
            'varying vec3 FragNormal;',
            'varying vec3 FragEyeVector;',
            '',
            '' ].join( '\n' );
    };

    Light.prototype._shaderCommon[ ShaderGenerator.Type.VertexFunction ] = function () {
        return [ '',
            'vec3 computeNormal() {',
            '   return vec3(NormalMatrix * vec4(Normal, 0.0));',
            '}',
            '',
            'vec3 computeEyeVertex() {',
            '   return vec3(ModelViewMatrix * vec4(Vertex,1.0));',
            '}',
            '',
            '' ].join( '\n' );
    };

    Light.prototype._shaderCommon[ ShaderGenerator.Type.VertexMain ] = function () {
        return [ '',
            '  FragEyeVector = computeEyeVertex();',
            '  FragNormal = computeNormal();',
            '' ].join( '\n' );
    };

    Light.prototype._shaderCommon[ ShaderGenerator.Type.FragmentInit ] = function () {
        return [ 'varying vec3 FragNormal;',
            'varying vec3 FragEyeVector;',
            '' ].join( '\n' );
    };

    Light.prototype._shaderCommon[ ShaderGenerator.Type.FragmentFunction ] = function () {
        return [ '',
            'float getLightAttenuation(vec3 lightDir, float constant, float linear, float quadratic) {',
            '    ',
            '    float d = length(lightDir);',
            '    float att = 1.0 / ( constant + linear*d + quadratic*d*d);',
            '    return att;',
            '}',
            'vec4 computeLightContribution(vec4 materialAmbient,',
            '                              vec4 materialDiffuse,',
            '                              vec4 materialSpecular,',
            '                              float materialShininess,',
            '                              vec4 lightAmbient,',
            '                              vec4 lightDiffuse,',
            '                              vec4 lightSpecular,',
            '                              vec3 normal,',
            '                              vec3 eye,',
            '                              vec3 lightDirection,',
            '                              vec3 lightSpotDirection,',
            '                              float lightCosSpotCutoff,',
            '                              float lightSpotBlend,',
            '                              float lightAttenuation)',
            '{',
            '    vec3 L = lightDirection;',
            '    vec3 N = normal;',
            '    float NdotL = max(dot(L, N), 0.0);',
            '    float halfTerm = NdotL;',
            '    vec4 ambient = lightAmbient;',
            '    vec4 diffuse = vec4(0.0);',
            '    vec4 specular = vec4(0.0);',
            '    float spot = 0.0;',
            '',
            '    if (NdotL > 0.0) {',
            '        vec3 E = eye;',
            '        vec3 R = reflect(-L, N);',
            '        float RdotE = max(dot(R, E), 0.0);',
            '        if ( RdotE > 0.0) {',
            '           RdotE = pow( RdotE, materialShininess );',
            '        }',
            '        vec3 D = lightSpotDirection;',
            '        spot = 1.0;',
            '        if (lightCosSpotCutoff > 0.0) {',
            '          float cosCurAngle = dot(-L, D);',
            '          if (cosCurAngle < lightCosSpotCutoff) {',
            '             spot = 0.0;',
            '          } else {',
            '             if (lightSpotBlend > 0.0)',
            '               spot = cosCurAngle * smoothstep(0.0, 1.0, (cosCurAngle-lightCosSpotCutoff)/(lightSpotBlend));',
            '          }',
            '        }',

            '        diffuse = lightDiffuse * ((halfTerm));',
            '        specular = lightSpecular * RdotE;',
            '    }',
            '',
            '    return (materialAmbient*ambient + (materialDiffuse*diffuse + materialSpecular*specular) * spot) * lightAttenuation;',
            '}',
            'float linearrgb_to_srgb1(const in float c)',
            '{',
            '  float v = 0.0;',
            '  if(c < 0.0031308) {',
            '    if ( c > 0.0)',
            '      v = c * 12.92;',
            '  } else {',
            '    v = 1.055 * pow(c, 1.0/2.4) - 0.055;',
            '  }',
            '  return v;',
            '}',

            'vec4 linearrgb_to_srgb(const in vec4 col_from)',
            '{',
            '  vec4 col_to;',
            '  col_to.r = linearrgb_to_srgb1(col_from.r);',
            '  col_to.g = linearrgb_to_srgb1(col_from.g);',
            '  col_to.b = linearrgb_to_srgb1(col_from.b);',
            '  col_to.a = col_from.a;',
            '  return col_to;',
            '}',
            'float srgb_to_linearrgb1(const in float c)',
            '{',
            '  float v = 0.0;',
            '  if(c < 0.04045) {',
            '    if (c >= 0.0)',
            '      v = c * (1.0/12.92);',
            '  } else {',
            '    v = pow((c + 0.055)*(1.0/1.055), 2.4);',
            '  }',
            ' return v;',
            '}',
            'vec4 srgb2linear(const in vec4 col_from)',
            '{',
            '  vec4 col_to;',
            '  col_to.r = srgb_to_linearrgb1(col_from.r);',
            '  col_to.g = srgb_to_linearrgb1(col_from.g);',
            '  col_to.b = srgb_to_linearrgb1(col_from.b);',
            '  col_to.a = col_from.a;',
            '  return col_to;',
            '}',

            '' ].join( '\n' );
    };

    Light.prototype._shaderCommon[ ShaderGenerator.Type.FragmentMain ] = function () {
        return [ '',
            '  vec3 normal = normalize(FragNormal);',
            '  vec3 eyeVector = normalize(-FragEyeVector);',
            '  vec4 lightColor = MaterialEmission;',
            '' ].join( '\n' );
    };

    Light.prototype._shaderCommon[ ShaderGenerator.Type.FragmentEnd ] = function () {
        return [ '',
            '  fragColor *= lightColor;',
            '' ].join( '\n' );
    };


    // shader generation per instance of attribute
    Light.prototype._shader[ ShaderGenerator.Type.FragmentInit ] = function () {
        var str = [ '',
            'uniform vec4 Light_position;',
            'uniform vec3 Light_direction;',
            'uniform mat4 Light_matrix;',
            'uniform mat4 Light_invMatrix;',
            'uniform float Light_constantAttenuation;',
            'uniform float Light_linearAttenuation;',
            'uniform float Light_quadraticAttenuation;',
            'uniform vec4 Light_ambient;',
            'uniform vec4 Light_diffuse;',
            'uniform vec4 Light_specular;',
            'uniform float Light_spotCutoff;',
            'uniform float Light_spotBlend;',
            ''
        ].join( '\n' );

        // replace Light_xxxx by instance variable of 'this' light
        var uniformMapKeys = this.getOrCreateUniforms().getKeys();
        str = this._replace( 'Light_', uniformMapKeys, str, this.getUniformName );
        return str;
    };

    Light.prototype._shader[ ShaderGenerator.Type.FragmentMain ] = function () {
        var str = [ '',
            '  vec3 lightEye = vec3(Light_matrix * Light_position);',
            '  vec3 lightDir;',
            '  if (Light_position[3] == 1.0) {',
            '    lightDir = lightEye - FragEyeVector;',
            '  } else {',
            '    lightDir = lightEye;',
            '  }',
            '  vec3 spotDirection = normalize(mat3(vec3(Light_invMatrix[0]), vec3(Light_invMatrix[1]), vec3(Light_invMatrix[2]))*Light_direction);',
            '  float attenuation = getLightAttenuation(lightDir, Light_constantAttenuation, Light_linearAttenuation, Light_quadraticAttenuation);',
            '  lightDir = normalize(lightDir);',
            '  lightColor += computeLightContribution(MaterialAmbient,',
            '                                         MaterialDiffuse, ',
            '                                         MaterialSpecular,',
            '                                         MaterialShininess,',
            '                                         Light_ambient,',
            '                                         Light_diffuse,',
            '                                         Light_specular,',
            '                                         normal,',
            '                                         eyeVector,',
            '                                         lightDir,',
            '                                         spotDirection,',
            '                                         Light_spotCutoff,',
            '                                         Light_spotBlend,',
            '                                         attenuation);',
            ''
        ].join( '\n' );

        var fields = [ 'lightEye',
            'lightDir',
            'spotDirection',
            'attenuation'
        ];
        str = this._replace( '', fields, str, this.getParameterName );
        var uniformMapKeys = this.getOrCreateUniforms().getKeys();
        str = this._replace( 'Light_', uniformMapKeys, str, this.getUniformName );
        return str;
    };

    return Light;
} );
