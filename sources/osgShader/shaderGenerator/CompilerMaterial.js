define( [
    'osg/Utils',
    'osgShader/shaderGenerator/Compiler',
    'osgShader/ShaderNode'

], function ( MACROUTILS, Compiler, shaderNode ) {
    'use strict';

    var CompilerMaterial = function ( state, attributes, textureAttributes, scene ) {
        Compiler.call( this, state, attributes, textureAttributes, scene );

    };

    CompilerMaterial.prototype = MACROUTILS.objectInherit( Compiler.prototype, {
        createFragmentShaderGraph: function () {
            this.declareUniforms();
            this.declareTextures();

            var uniforms = this._material.getOrCreateUniforms();
            var materialDiffuseColor = this.getVariable( uniforms.diffuse.name );
            //var materialAmbientColor = this.getVariable( uniforms.ambient.name );
            var materialEmissionColor = this.getVariable( uniforms.emission.name );
            var materialSpecularColor = this.getVariable( uniforms.specular.name );
            var materialShininess = this.getVariable( uniforms.shininess.name );
            //var materialOpacity = this.getVariable( uniforms.opacity.name );


            var inputNormal = this.Varying( 'vec3', 'FragNormal' );
            var inputPosition = this.Varying( 'vec3', 'FragEyeVector' );
            var normal = this.Variable( 'vec3', 'normal' );
            var eyeVector = this.Variable( 'vec3', 'eyeVector' );


            var normalizeNormalAndVector = new shaderNode.NormalizeNormalAndEyeVector( inputNormal, inputPosition );
            normalizeNormalAndVector.connectOutputNormal( normal );
            normalizeNormalAndVector.connectOutputEyeVector( eyeVector );

            // diffuse color
            var diffuseColor = this.getTexture();
            if ( diffuseColor === undefined ) {
                diffuseColor = materialDiffuseColor;
            }
            diffuseColor = this.getVertexColor( diffuseColor );

            //var alpha =  materialOpacity || new shaderNode.InlineConstant( '1.0' );
            var alpha = new shaderNode.InlineConstant( '1.0' );

            var finalColor;

            if ( this._lights.length > 0 ) {

                // by default geometryNormal is normal, but can change with normal map / bump map
                var geometryNormal = normal;

                var diffuseOutput = this.Variable( 'vec4', 'diffuseOutput_' );
                var nodeDiffuse = new shaderNode.Lambert( diffuseColor,
                    geometryNormal,
                    diffuseOutput );

                var specularOutput = this.Variable( 'vec4' );
                var nodeCookTorrance = new shaderNode.CookTorrance( materialSpecularColor,
                    geometryNormal,
                    materialShininess,
                    specularOutput );

                var lightNodes = [];
                var lights = this._lights;
                for ( var i = 0, l = lights.length; i < l; i++ ) {
                    var light = lights[ i ];
                    var nodeLight = new shaderNode.Light( light );
                    nodeLight.init( this );
                    lightNodes.push( nodeLight );
                }

                nodeDiffuse.connectLights( lightNodes );
                nodeDiffuse.createFragmentShaderGraph( this );

                nodeCookTorrance.connectLights( lightNodes );
                nodeCookTorrance.createFragmentShaderGraph( this );

                // get final color
                finalColor = this.getFinalColor( materialEmissionColor, diffuseOutput, specularOutput );
            } else {
                finalColor = this.getFinalColor( diffuseColor );
            }

            // premult alpha
            if ( true ) {
                var premultAlpha = this.Variable( 'vec4' );
                var tmp = this.Variable( 'vec4' );
                new shaderNode.SetAlpha( finalColor, alpha, tmp );
                new shaderNode.PreMultAlpha( tmp, premultAlpha );
                finalColor = premultAlpha;
            }

            // get srgb color
            var srgbColor = this.getSrgbColor( finalColor );

            var fragColor = new shaderNode.FragColor();
            new shaderNode.SetAlpha( srgbColor, alpha, fragColor );

            return fragColor;
        }
    } );

    return CompilerMaterial;
} );
