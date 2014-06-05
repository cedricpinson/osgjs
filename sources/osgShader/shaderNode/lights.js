/*global define */
/*jshint unused: false */
/*jshint loopfunc: true */

define( [
    'osg/Utils',
    'osgShader/utils/sprintf',
    'osgShader/shaderNode/Node',
    'osgShader/shaderNode/textures',
    'osgShader/shaderNode/operations'

], function ( MACROUTILS, sprintf, Node, textures, operations ) {


    var Light = function ( light ) {
        Node.call( this );
        this._light = light;
    };

    Light.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'Light',
        globalFunctionDeclaration: function () {
            return [
                '#pragma include "lights.glsl"'
            ].join( '\n' );
        },

        INVERSE_SQUARE: function () {
            return this._attenuation.getVariable() + ' = invSquareFalloff(' + this._light.getOrCreateUniforms().distance.getName() + ' , ' + this._distance.getVariable() + ' );';
        },

        INVERSE_LINEAR: function () {
            return this._attenuation.getVariable() + ' = invLinearFalloff(' + this._light.getOrCreateUniforms().distance.getName() + ', ' + this._distance.getVariable() + ');';
        },

        SUN: function () {
            return 'computeLightDirection(' + this._light.getOrCreateUniforms().position.getName() + ' , ' + this._lightVector.getVariable() + ');';
        },

        POINT: function () {
            return 'computeLightPoint(' + this._eyePosition.getVariable() + ',' + this._light.getOrCreateUniforms().position.getName() + ' , ' + this._lightVector.getVariable() + ', ' + this._distance.getVariable() + ');';
        },

        // like point light
        SPOT: function () {
            return 'computeLightPoint(' + this._eyePosition.getVariable() + ',' + this._light.getOrCreateUniforms().position.getName() + ' , ' + this._lightVector.getVariable() + ', ' + this._distance.getVariable() + ');';
        },

        init: function ( context ) {
            // connect uniforms to this node
            this.connectUniforms( context, this._light );

            // declare some variable that will be computed here but used outside
            var ln = context.Variable( 'vec3' );
            ln.comment( 'light vector output' );
            this._lightVector = ln;
            this.connectOutput( ln );

            var att = context.Variable( 'float' );
            att.comment( 'light attenuation output' );
            this._attenuation = att;
            this.connectOutput( att );

            var dist = context.Variable( 'float' );
            dist.comment( 'distance from light' );
            this._distance = dist;

            // from outside
            this._eyePosition = context.getVariable( 'FragEyeVector' );

        },

        getOutputLightVector: function () {
            return this._lightVector;
        },
        getOutputAttenuation: function () {
            return this._attenuation;
        },

        computeFragment: function () {
            // computeLightPoint(light, lightVectorResult, lightDistance);
            var light = this._light;
            light.getOrCreateUniforms();

            var lightFalloff = '';
            var lightComputation = '';


            // compute light direction and attenuation
            if ( this[ light.getLightType() ] === undefined ) {
                lightComputation = this.SUN( this.getOutput() );
            }
            else {
                lightComputation = this[ light.getLightType() ]();
            }


            // no falloff for directionnal light
            if ( light.getLightType() !== 'SUN' &&
                 light.getLightType() !== 'HEMI' ) {

                // fallof with the good type
                if ( this[ light.getFalloffType() ] !== undefined ) {
                    lightFalloff = this[ light.getFalloffType() ]();
                }
            }


            var str = [
                this._attenuation.getVariable() + ' = 1.0;',
                this._lightVector.getVariable() + ' = vec3(0.0);',
                lightComputation,
                lightFalloff,
                '' ].join( '\n' );

            return str;
        },
        getOrCreateUniforms: function () {
            return this._light.getOrCreateUniforms();
        }
    } );


    var Lambert = function ( color, normal, output ) {
        Node.call( this );
        this._color = color;
        this._normal = normal;
        if ( output !== undefined ) {
            this.connectOutput( output );
        }
        this.connectInputs( color, normal );
        this._lights = [];
    };

    Lambert.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'Lambert',
        connectLights: function ( lights ) {
            this._lights = lights;
        },
        createFragmentShaderGraph: function ( context ) {
            var lambertOutput = this.getOutput();

            var accumulator = new operations.AddVector();
            accumulator.connectOutput( lambertOutput );
            accumulator.comment('lambertOutput = ???');

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

                var lightColor = context.getVariable( nodeLight.getOrCreateUniforms().color.name );
                var materialColor = this._color;

                var lightColorMaterial = context.Variable( 'vec3' );
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
                var lightDiffuse = context.Variable( 'vec3' );
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


    var SpheremapReflection = function ( environmentTransform, texture, textureSize, eyeDirection, normal, output ) {
        Node.call( this );
        this.connectInputs( environmentTransform, texture, textureSize, eyeDirection, normal );
        this._sampler = texture;
        this._eye = eyeDirection;
        this._normal = normal;
        this._environmentTransform = environmentTransform;
        this._textureSize = textureSize;

        if ( output !== undefined ) {
            this.connectOutput( output );
        }

        this._output = output;
    };
    SpheremapReflection.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'SpheremapReflection',

        createFragmentShaderGraph: function ( context ) {
            var lambertOutput = this.getOutput();

            var reflect = context.Variable( 'vec3' );

            // compute the reflection vector
            var operator = new operations.InlineCode( this._environmentTransform,
                                                      this._eye,
                                                      this._normal );
            var str = sprintf( '%s = computeAndRotateReflectionVector(%s,%s,%s);', [ reflect.getVariable(), this._environmentTransform.getVariable(), this._eye.getVariable(), this._normal.getVariable() ] );
            operator.setCode( str );
            operator.comment( '// environment reflection' );
            operator.connectOutput( reflect );

            // get the texture filtered from the refelction vector
            var node = new textures.TextureSpheremapHDR( this._sampler, this._textureSize, reflect ).connectOutput( this._output );
        },

        globalFunctionDeclaration: function () {
            return [
                '#pragma include "functions.glsl"'
            ].join( '\n' );
        },
    } );


    var CookTorrance = function ( color, normal, hardness, output ) {
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

    CookTorrance.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'CookTorrance',
        connectLights: function ( lights ) {
            this._lights = lights;
        },
        createFragmentShaderGraph: function ( context ) {
            var lambertOutput = this.getOutput();

            var operator = new operations.AddVector();
            operator.connectOutput( lambertOutput );

            for ( var i = 0, l = this._lights.length; i < l; i++ ) {
                var nodeLight = this._lights[ i ];

                // connect variable to light node
                var attenuation = nodeLight.getOutputAttenuation();
                var lightVector = nodeLight.getOutputLightVector();

                var lightColor = context.getVariable( nodeLight.getOrCreateUniforms().color.name );
                var materialColor = this._color;
                var viewVector = context.getVariable( 'eyeVector' );
                var lightColorMaterial = context.Variable( 'vec3' );
                var normal = this._normal;
                var hardness = this._hardness;

                // lightColorMaterial = lightColor * materialColor
                ( function ( output ) {
                    var operator = new operations.MultVector( lightColor, materialColor );
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
                var specularOutput = context.Variable( 'vec3' );
                ( function ( output ) {
                    var operator = new operations.MultVector( term, lightColorMaterial );
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
    });


    return {
        'Light': Light,
        'Lambert': Lambert,
        'SpheremapReflection': SpheremapReflection,
        'CookTorrance': CookTorrance
    };

} );
