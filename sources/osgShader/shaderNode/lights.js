define( [
    'osg/Utils',
    'osgShader/utils/sprintf',
    'osgShader/ShaderNode',
    'osgShader/shaderNode/Node',
    'osgShader/shaderNode/textures',
    'osgShader/shaderNode/operations'

], function ( MACROUTILS, sprintf, ShaderNode, Node, textures, operations ) {
    'use strict';


    // maybe we will need a struct later for the material
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
        createFragmentShaderGraph: function ( context ) {

            ShaderNode = require( 'osgShader/ShaderNode' );

            var accumulator = new ShaderNode.Add();
            accumulator.connectOutput( this.getOutput() );
            for ( var i = 0; i < this._lights.length; i++ ) {
                var light = this._lights[ 0 ];
                var lightNode;

                var lightedOutput = new ShaderNode.Variable( 'vec4', 'lightTempOutput' );

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

                lightNode.createFragmentShaderGraph( context );
                accumulator.connectInputs( lightedOutput );
            }
        }
    } );


    // base class for all point based light: Point/Directional/Spot/Hemi
    // avoid duplicate code
    var NodeLightsPointBased = function ( lighting, light, output ) {

        Node.call( this );

        if ( output !== undefined ) {
            this.connectOutput( output );
        }

        this._normal = lighting._normal;
        this._light = light;

        this.connectInputs( this._ambientColor, this._diffuseColor, this.specularColor, this.shininess, this._normal );

    };

    NodeLightsPointBased.prototype = MACROUTILS.objectInherit( Node.prototype, {
        globalFunctionDeclaration: function () {
            return '#pragma include "lights.glsl"';
        }

    } );



    var PointLight = function ( lighting, light, output ) {
        NodeLightsPointBased.call( this, lighting, light, output );
    };

    PointLight.prototype = MACROUTILS.objectInherit( NodeLightsPointBased.prototype, {
        type: 'PointLight',
        createFragmentShaderGraph: function ( context ) {

            // Common
            var normal = this._normal;
            var eyeVector = context.getVariable( 'FragEyeVector' );
            var vertexPos = context.getVariable( 'FragVertexPos' );

            // light specifics
            var nodeLight = this._light;
            var lightUniforms = nodeLight.getOrCreateUniforms();

            // connect variable to light node
            var lightAttenuation = context.getVariable( lightUniforms.attenuation.name );
            var lightPosition = context.getVariable( lightUniforms.position.name );
            var lightDiffuseColor = context.getVariable( lightUniforms.diffuse.name );
            var lightAmbientColor = context.getVariable( lightUniforms.ambient.name );
            var lightSpecularColor = context.getVariable( lightUniforms.specular.name );


            var funcOp = new operations.FunctionCall( normal, eyeVector, vertexPos, lightAmbientColor, lightDiffuseColor, lightSpecularColor, lightPosition, lightAttenuation );
            funcOp.connectOutput( this.getOutput() );
            funcOp.setCall( 'computePointLightShading', '(%s, %s, %s, %s, %s, %s, %s, %s);', 'woo PointLight' );

        }

    } );



    var SpotLight = function ( lighting, light, output ) {
        NodeLightsPointBased.call( this, lighting, light, output );
    };

    SpotLight.prototype = MACROUTILS.objectInherit( NodeLightsPointBased.prototype, {
        type: 'SpotLight',
        createFragmentShaderGraph: function ( context ) {
            // Common
            var normal = this._normal;
            var eyeVector = context.getVariable( 'FragEyeVector' );
            var vertexPos = context.getVariable( 'FragVertexPos' );

            // light specifics
            var nodeLight = this._light;
            var lightUniforms = nodeLight.getOrCreateUniforms();

            // connect variable to light node
            var lightAttenuation = context.getVariable( lightUniforms.attenuation.name );
            var lightPosition = context.getVariable( lightUniforms.position.name );
            var lightDirection = context.getVariable( lightUniforms.direction.name );
            var lightSpotCutOff = context.getVariable( lightUniforms.spotCutOff.name );
            var lightSpotBlend = context.getVariable( lightUniforms.spotBlend.name );

            var lightDiffuseColor = context.getVariable( lightUniforms.diffuse.name );
            var lightAmbientColor = context.getVariable( lightUniforms.ambient.name );
            var lightSpecularColor = context.getVariable( lightUniforms.specular.name );


            var funcOp = new operations.FunctionCall( normal, eyeVector, vertexPos, lightAmbientColor, lightDiffuseColor, lightSpecularColor, lightDirection, lightAttenuation, lightPosition, lightSpotCutOff, lightSpotBlend );
            funcOp.connectOutput( this.getOutput() );
            funcOp.setCall( 'computeSpotLightShading', '(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);', 'woo SpotLight' );
        }
    } );


    var SunLight = function ( lighting, light, output ) {
        NodeLightsPointBased.call( this, lighting, light, output );
    };

    SunLight.prototype = MACROUTILS.objectInherit( NodeLightsPointBased.prototype, {
        type: 'SunLight',
        createFragmentShaderGraph: function ( context ) {
            // Common
            var normal = this._normal;
            var eyeVector = context.getVariable( 'FragEyeVector' );

            // light specifics
            var nodeLight = this._light;
            var lightUniforms = nodeLight.getOrCreateUniforms();

            // connect variable to light node
            var lightDirection = context.getVariable( lightUniforms.direction.name );
            var lightDiffuseColor = context.getVariable( lightUniforms.diffuse.name );
            var lightAmbientColor = context.getVariable( lightUniforms.ambient.name );
            var lightSpecularColor = context.getVariable( lightUniforms.specular.name );


            var funcOp = new operations.FunctionCall( normal, eyeVector, lightAmbientColor, lightDiffuseColor, lightSpecularColor, lightDirection );
            funcOp.connectOutput( this.getOutput() );
            funcOp.setCall( 'computeSunLightShading', '(%s, %s, %s, %s, %s, %s);', 'waa SunLight' );
        }
    } );


    return {
        'Lighting': Lighting,
        'PointLight': PointLight,
        'SpotLight': SpotLight,
        'SunLight': SunLight
    };

} );
