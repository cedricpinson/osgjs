define( [
    'osg/Utils',
    'osgShader/shaderGenerator/Compiler',
    'osgShader/ShaderNode'

], function ( MACROUTILS, Compiler, shaderNode ) {

    var CompilerShadeless = function ( state, attributes, textureAttributes, scene ) {
        Compiler.call( this, state, attributes, textureAttributes, scene );
    };

    CompilerShadeless.prototype = MACROUTILS.objectInherit( Compiler.prototype, {
        createFragmentShaderGraph: function () {
            this.declareUniforms();
            this.declareTextures();

            // diffuse color
            var diffuseColor = this.getTexture( 'DiffuseColor' );
            diffuseColor = this.getVertexColor( diffuseColor );

            var alpha =  new shaderNode.InlineConstant( '1.0' );

            // get final color
            var finalColor = this.getFinalColor( diffuseColor );
            finalColor = this.getPremultAlpha( finalColor, alpha );

            // get srgb color
            var srgbColor = this.getSrgbColor( finalColor );

            var fragColor = new shaderNode.FragColor();
            new shaderNode.SetAlpha( srgbColor, alpha, fragColor );

            return fragColor;
        }
    } );

    return CompilerShadeless;
} );
