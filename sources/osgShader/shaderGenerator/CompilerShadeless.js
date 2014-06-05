define( [
    'osg/Utils',
    'osgShader/Compiler',
    'osgShader/shaderNode'

], function ( MACROUTILS, Compiler, shaderNode ) {

    var CompilerShadeless = function ( state, attributes, textureAttributes, scene ) {
        Compiler.call( this, state, attributes, textureAttributes, scene );
    };

    CompilerShadeless.prototype = MACROUTILS.objectInherit( Compiler.prototype, {
        createFragmentShaderGraph: function () {
            this.declareUniforms();
            this.declareTextures();

            // diffuse intensity
            var diffuseIntensity = this.getTextureChannel( 'DiffuseIntensity' );

            // diffuse color
            var diffuseColor = this.getTextureChannel( 'DiffuseColor' );
            diffuseColor = this.getVertexColor( diffuseColor );
            diffuseColor = this.getDiffuseIntensity( diffuseColor, diffuseIntensity );

            // alpha
            var alpha = this.getTextureChannel( 'Opacity' ) || new shaderNode.InlineConstant( '1.0' );

            // emit color
            var emitColor = this.getTextureChannel( 'EmitColor' );

            // get final color
            var finalColor = this.getFinalColor( emitColor, diffuseColor );
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
