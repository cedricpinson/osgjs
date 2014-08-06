define( [
    'osg/Utils',
    'osgShader/utils/sprintf',
    'osgShader/shaderNode/Node',
    'osgShader/shaderNode/textures',
    'osgShader/shaderNode/operations'

], function ( MACROUTILS, sprintf, Node, textures, operations ) {
    'use strict';

    var Light = function ( lights, normal, ambient, diffuse, specular, shininess, output ) {

        Node.call( this );

        this._light = lights || [];
        this._normal = normal;
        this._ambientColor = ambient;
        this._diffuseColor = diffuse;
        this._specularColor = specular;
        this._shininess = shininess;;
        if ( output !== undefined ) {
            this.connectOutput( output );
        }
        this.connectInputs( this._ambientColor, this._diffuseColor, this.specularColor, this.shininess, this._normal );

    };


    Light.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'Light',

        createFragmentShaderGraph: function ( lights ) {
            for ( var i = 0; i < lights.length; i++ ) {
                var light = lights[ 0 ];
                var lightNode;
                switch ( light.getType() ) {
                case 'Sun':
                case 'Directional':
                    lightNode = new SunLight( this, output );
                    break;
                case 'Spot':
                    lightNode = new SpotLight( this, output );
                    break;
                default:
                case 'Point':
                    lightNode = new PointLight( this, output );
                    break;
                }

                lightNode.createFragmentShaderGraph();
            }
        }
    } );


    var PointLight = function ( color, normal, output ) {
        Node.call( this );
        this._color = color;
        this._normal = normal;
        if ( output !== undefined ) {
            this.connectOutput( output );
        }
        this.connectInputs( color, normal );
        this._lights = [];
    };

    PointLight.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'pointLight',
        createFragmentShaderGraph: function ( context ) {
            var lambertOutput = this.getOutput();

            var accumulator = new operations.Add();
            accumulator.connectOutput( lambertOutput );
            accumulator.comment( 'lambertOutput = ???' );

            // CP: TODO
            // lambert node use an light input ( direct )
            // the probleme is that an environment is not considered
            // as light and maybe it shoul to be used in this kind of node
            if ( this._lights.length === 0 ) {
                MACROUTILS.error( 'using Lambert node with no light' );
            }

            for ( var i = 0, l = this._lights.length; i < l; i++ ) {
                var nodeLight = this._lights[ i ];

                // connect variable to light node
                var attenuation = nodeLight.getOutputAttenuation();
                var lightVector = nodeLight.getOutputLightVector();

                var lightColor = context.getVariable( nodeLight.getOrCreateUniforms().diffuse.name );
                var materialColor = this._color;

                var lightColorMaterial = context.Variable( 'vec4' );
                var normal = this._normal;

                // lightColorMaterial = lightColor * materialColor
                ( function ( output ) {
                    var operator = new operations.MultVector( lightColor, materialColor );
                    operator.comment( 'lambert_color = light_color * material_color' );
                    operator.connectOutput( output );
                } )( lightColorMaterial );


                // compute lambert term. term = max( LdotN * attenuation, 0.0)
                var term = context.Variable( 'float' );
                ( function ( output ) {
                    var str = output.getVariable() + ' = max(' + attenuation.getVariable() + ' * dot(' + lightVector.getVariable() + ', ' + normal.getVariable() + ') , 0.0);';
                    var operator = new operations.InlineCode( attenuation, lightVector, normal );
                    operator.comment( 'lambert_term = max(NdotL*attenuation, 0.0)' );
                    operator.setCode( str );
                    operator.connectOutput( output );
                } )( term );

                // diffuseOutput = ldotn * lightColorAttenuation
                var lightDiffuse = context.Variable( 'vec4' );
                ( function ( output ) {
                    var operator = new operations.MultVector( term, lightColorMaterial );
                    operator.comment( 'lambert_color_contribution = lambert_color * lambert_term' );
                    operator.connectOutput( output );
                } )( lightDiffuse );

                // accumulate light contribution
                accumulator.connectInput( lightDiffuse );
            }
        },
        computeFragment: function () {
            return '';
        }
    } );



    var SpotLight = function ( color, normal, output ) {
        Node.call( this );
        this._color = color;
        this._normal = normal;
        if ( output !== undefined ) {
            this.connectOutput( output );
        }
        this.connectInputs( color, normal );
        this._lights = [];
    };

    SpotLight.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'spotLight',
        connectLights: function ( lights ) {
            this._lights = lights;
        },
        createFragmentShaderGraph: function ( context ) {
            var lambertOutput = this.getOutput();

            var accumulator = new operations.Add();
            accumulator.connectOutput( lambertOutput );
            accumulator.comment( 'lambertOutput = ???' );

            // CP: TODO
            // lambert node use an light input ( direct )
            // the probleme is that an environment is not considered
            // as light and maybe it shoul to be used in this kind of node
            if ( this._lights.length === 0 ) {
                MACROUTILS.error( 'using Lambert node with no light' );
            }

            for ( var i = 0, l = this._lights.length; i < l; i++ ) {
                var nodeLight = this._lights[ i ];

                // connect variable to light node
                var attenuation = nodeLight.getOutputAttenuation();
                var lightVector = nodeLight.getOutputLightVector();

                var lightColor = context.getVariable( nodeLight.getOrCreateUniforms().diffuse.name );
                var materialColor = this._color;

                var lightColorMaterial = context.Variable( 'vec4' );
                var normal = this._normal;

                // lightColorMaterial = lightColor * materialColor
                ( function ( output ) {
                    var operator = new operations.MultVector( lightColor, materialColor );
                    operator.comment( 'lambert_color = light_color * material_color' );
                    operator.connectOutput( output );
                } )( lightColorMaterial );


                // compute lambert term. term = max( LdotN * attenuation, 0.0)
                var term = context.Variable( 'float' );
                ( function ( output ) {
                    var str = output.getVariable() + ' = max(' + attenuation.getVariable() + ' * dot(' + lightVector.getVariable() + ', ' + normal.getVariable() + ') , 0.0);';
                    var operator = new operations.InlineCode( attenuation, lightVector, normal );
                    operator.comment( 'lambert_term = max(NdotL*attenuation, 0.0)' );
                    operator.setCode( str );
                    operator.connectOutput( output );
                } )( term );

                // diffuseOutput = ldotn * lightColorAttenuation
                var lightDiffuse = context.Variable( 'vec4' );
                ( function ( output ) {
                    var operator = new operations.MultVector( term, lightColorMaterial );
                    operator.comment( 'lambert_color_contribution = lambert_color * lambert_term' );
                    operator.connectOutput( output );
                } )( lightDiffuse );

                // accumulate light contribution
                accumulator.connectInput( lightDiffuse );
            }
        },
        computeFragment: function () {
            return '';
        }
    } );


    var SunLight = function ( color, normal, hardness, output ) {
        Node.call( this );
        this._color = color;
        this._normal = normal;
        this._hardness = hardness;
        if ( output !== undefined ) {
            this.connectOutput( output );
        }
        this.connectInputs( color, normal, hardness );
        this._lights = [];
    };

    SunLight.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'SunLight',
        connectLights: function ( lights ) {
            this._lights = lights;
        },
        createFragmentShaderGraph: function ( context ) {
            var lambertOutput = this.getOutput();

            var operator = new operations.Add();
            operator.connectOutput( lambertOutput );

            for ( var i = 0, l = this._lights.length; i < l; i++ ) {
                var nodeLight = this._lights[ i ];

                // connect variable to light node
                var attenuation = nodeLight.getOutputAttenuation();
                var lightVector = nodeLight.getOutputLightVector();

                var lightColor = context.getVariable( nodeLight.getOrCreateUniforms().specular.name );
                var materialColor = this._color;
                var viewVector = context.getVariable( 'eyeVector' );
                var lightColorMaterial = context.Variable( 'vec4' );
                var normal = this._normal;
                var hardness = this._hardness;

                // lightColorMaterial = lightColor * materialColor
                ( function ( output ) {
                    var operator = new operations.Mult( lightColor, materialColor );
                    operator.comment( 'cooktorrance_color = light_color * material_color' );
                    operator.connectOutput( output );
                } )( lightColorMaterial );


                // compute lambert term. term = max( LdotN * attenuation, 0.0)
                var term = context.Variable( 'float' );

                ( function ( output ) {
                    var str = output.getVariable() + ' = ' + attenuation.getVariable() + ' * specularCookTorrance(' + normal.getVariable() + ', ' + lightVector.getVariable() + ', ' + viewVector.getVariable() + ', ' + hardness.getVariable() + ');';
                    var operator = new operations.InlineCode( attenuation, lightVector, normal );
                    operator.comment( 'specular_term = attenuation * specularCookTorrance(normal, lightVector, viewVector, hardness)' );
                    operator.setCode( str );
                    operator.connectOutput( output );
                } )( term );

                // specularOutput = specTerm * lightColorAttenuation
                var specularOutput = context.Variable( 'vec4' );
                ( function ( output ) {
                    var operator = new operations.Mult( term, lightColorMaterial );
                    operator.comment( 'cooktorrance_color_contribution = cooktorrance_color * cooktorrance_term' );
                    operator.connectOutput( output );
                } )( specularOutput );

                // accumulate light contribution
                operator.connectInput( specularOutput );
            }
        },
        globalFunctionDeclaration: function () {
            return [
                '#pragma include "lights.glsl"'
            ].join( '\n' );
        },
        computeFragment: function () {
            return '';
        }
    } );


    return {
        'Light': Light,
        'PointLight': PointLight,
        'SpotLight': SpotLight,
        'SunLight': SunLight
    };

} );
