define( [
    'osg/Utils',
    'osgShader/utils/sprintf',
    'osgShader/ShaderNode',
    'osgShader/shaderNode/Node',
    'osgShader/shaderNode/textures',
    'osgShader/shaderNode/operations'

], function ( MACROUTILS, sprintf, ShaderNode, Node, textures, operations ) {
    'use strict';

    var Lighting = function ( lights, normal, ambient, diffuse, specular, shininess, output ) {

        Node.call( this );

        this._lights = lights || [];
        this._normal = normal;
        this._ambientColor = ambient;
        this._diffuseColor = diffuse;
        this._specularColor = specular;
        this._shininess = shininess;

        if ( output !== undefined ) {
            this.connectOutput( output );
        }
        this.connectInputs( this._ambientColor, this._diffuseColor, this.specularColor, this.shininess, this._normal );

    };


    Lighting.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'Light',

        createFragmentShaderGraph: function ( lights ) {

            var accumulator = new ShaderNode.Add();
            accumulator.connectOutput( this.getOutput() );
            for ( var i = 0; i < this._lights.length; i++ ) {
                var light = lights[ 0 ];
                var lightNode;

                var lightedOutput = this.Variable( 'vec4', 'lightTempOutput' );

                switch ( light.getType() ) {
                case 'Sun':
                case 'Directional':
                    lightNode = new SunLight( this, light, lightedOutput );
                    break;
                case 'Spot':
                    lightNode = new SpotLight( this, light, lightedOutput );
                    break;
                default:
                case 'Point':
                    lightNode = new PointLight( this, light, lightedOutput );
                    break;
                }

                lightNode.createFragmentShaderGraph();
                accumulator.connectInputs( lightedOutput );
            }
        }
    } );


    var PointLight = function ( lighting, light, output ) {
        Node.call( this );
        if ( output !== undefined ) {
            this.connectOutput( output );
        }

        this._normal = lighting.normal;
        this._ambientColor = lighting.ambient;
        this._diffuseColor = lighting.diffuse;
        this._specularColor = lighting.specular;
        this._shininess = lighting.shininess;

        this.connectInputs( this._ambientColor, this._diffuseColor, this.specularColor, this.shininess, this._normal );
    };

    PointLight.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'pointLight',
        createFragmentShaderGraph: function ( context ) {

            var accumulator = new ShaderNode.Add();
            accumulator.connectOutput( this.getOutput() );

            var nodeLight = this._light;
            // connect variable to light node
            var attenuation = nodeLight.getOutputAttenuation();
            var lightVector = nodeLight.getOutputLightVector();
            var normal = this._normal;


            //////////////////////////////////////////////
            // DIFFUSE LAMBERT
            /////////////////////////

            var lightDiffuseColorMaterial = context.Variable( 'vec4' );
            var lightDiffuseColor = context.getVariable( nodeLight.getOrCreateUniforms().diffuse.name );
            var materialDiffuseColor = this._diffuse;

            // lightColorMaterial = lightColor * materialColor
            ( function ( output ) {
                var operator = new operations.MultVector( lightDiffuseColor, materialDiffuseColor );
                operator.comment( 'lambert_color = light_color * material_color' );
                operator.connectOutput( output );
            } )( lightDiffuseColorMaterial );


            // compute lambert term. term = max( LdotN * attenuation, 0.0)
            var termDiffuse = context.Variable( 'float' );
            ( function ( output ) {
                var str = output.getVariable() + ' = max(' + attenuation.getVariable() + ' * dot(' + lightVector.getVariable() + ', ' + normal.getVariable() + ') , 0.0);';
                var operator = new operations.InlineCode( attenuation, lightVector, normal );
                operator.comment( 'lambert_term = max(NdotL*attenuation, 0.0)' );
                operator.setCode( str );
                operator.connectOutput( output );
            } )( termDiffuse );

            // diffuseOutput = ldotn * lightColorAttenuation
            var lightDiffuse = context.Variable( 'vec4' );
            ( function ( output ) {
                var operator = new operations.MultVector( termDiffuse, lightDiffuseColorMaterial );
                operator.comment( 'lambert_color_contribution = lambert_color * lambert_term' );
                operator.connectOutput( output );
            } )( lightDiffuse );

            // accumulate light contribution
            accumulator.connectInput( lightDiffuse );

            //////////////////////////////////////////////
            //SPECULAR COOK TORRANCE
            /////////////////////////
            // connect variable to light node
            var lightSpecularColor = context.getVariable( nodeLight.getOrCreateUniforms().specular.name );
            var materialSpecularColor = this._specular;
            var viewVector = context.getVariable( 'eyeVector' );
            var lightSpecularColorMaterial = context.Variable( 'vec4' );
            var hardness = this._hardness;

            // lightSpecularColorMaterial = lightSpecularColor * materialSpecularColor
            ( function ( output ) {
                var operator = new operations.MultVector( lightSpecularColor, materialSpecularColor );
                operator.comment( 'cooktorrance_color = light_color * material_color' );
                operator.connectOutput( output );
            } )( lightSpecularColorMaterial );


            // compute lambert term. term = max( LdotN * attenuation, 0.0)
            var termSpecular = context.Variable( 'float' );

            ( function ( output ) {
                var str = output.getVariable() + ' = ' + attenuation.getVariable() + ' * specularCookTorrance(' + normal.getVariable() + ', ' + lightVector.getVariable() + ', ' + viewVector.getVariable() + ', ' + hardness.getVariable() + ');';
                var operator = new operations.InlineCode( attenuation, lightVector, normal );
                operator.comment( 'specular_term = attenuation * specularCookTorrance(normal, lightVector, viewVector, hardness)' );
                operator.setCode( str );
                operator.connectOutput( output );
            } )( termSpecular );

            // specularOutput = specTerm * lightColorAttenuation
            var specularOutput = context.Variable( 'vec4' );
            ( function ( output ) {
                var operator = new operations.MultVector( termSpecular, lightSpecularColorMaterial );
                operator.comment( 'cooktorrance_color_contribution = cooktorrance_color * cooktorrance_term' );
                operator.connectOutput( output );
            } )( specularOutput );

            // accumulate light contribution
            accumulator.connectInput( specularOutput );

        },
        globalFunctionDeclaration: function () {
            return [
                '#pragma include "lights.glsl"'
            ].join( '\n' );
        }
    } );



    var SpotLight = function ( lighting, light, output ) {
        Node.call( this );
        if ( output !== undefined ) {
            this.connectOutput( output );
        }


        this._normal = lighting.normal;
        this._ambientColor = lighting.ambient;
        this._diffuseColor = lighting.diffuse;
        this._specularColor = lighting.specular;
        this._shininess = lighting.shininess;

        this.connectInputs( this._ambientColor, this._diffuseColor, this.specularColor, this.shininess, this._normal );
    };

    SpotLight.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'spotLight',
        createFragmentShaderGraph: function () {

        },
        globalFunctionDeclaration: function () {
            return [
                '#pragma include "lights.glsl"'
            ].join( '\n' );
        }
    } );


    var SunLight = function ( lighting, light, output ) {
        Node.call( this );

        if ( output !== undefined ) {
            this.connectOutput( output );
        }


        this._normal = lighting.normal;
        this._ambientColor = lighting.ambient;
        this._diffuseColor = lighting.diffuse;
        this._specularColor = lighting.specular;
        this._shininess = lighting.shininess;

        this.connectInputs( this._ambientColor, this._diffuseColor, this.specularColor, this.shininess, this._normal );
    };

    SunLight.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'SunLight',
        createFragmentShaderGraph: function () {

        },
        globalFunctionDeclaration: function () {
            return [
                '#pragma include "lights.glsl"'
            ].join( '\n' );
        }
    } );


    return {
        'Lighting': Lighting,
        'PointLight': PointLight,
        'SpotLight': SpotLight,
        'SunLight': SunLight
    };

} );
